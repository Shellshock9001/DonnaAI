/**
 * Tavily-like RAG Pipeline Service
 * 
 * Implements multi-source retrieval, relevance scoring, domain filtering,
 * and consensus verification to improve search accuracy.
 */

import { getDatabasePool } from '@/config/database'

export interface SearchSnippet {
  text: string
  url?: string
  title?: string
  score: number
  source: 'internal' | 'perplexity' | 'tavily' | 'apollo'
  domain?: string
  timestamp?: Date
  metadata?: Record<string, unknown>
}

export interface SearchPipelineConfig {
  maxResults: number
  searchDepth: 'basic' | 'advanced'
  topic?: 'general' | 'news' | 'company' | 'deal'
  includeDomains?: string[]
  excludeDomains?: string[]
  minScoreThreshold?: number
  enableConsensus?: boolean
}

export interface SearchPipelineResult {
  snippets: SearchSnippet[]
  answer?: string
  meta: {
    searchDepth: 'basic' | 'advanced'
    topic?: string
    latencyMs: number
    requestId: string
    totalSources: number
    consensusScore?: number
  }
}

/**
 * Simple BM25-like scoring for keyword relevance
 */
function computeBM25Score(text: string, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  if (queryTerms.length === 0) return 0

  const textLower = text.toLowerCase()
  let score = 0
  
  for (const term of queryTerms) {
    const termRegex = new RegExp(term, 'gi')
    const matches = textLower.match(termRegex)
    const termFreq = matches ? matches.length : 0
    
    if (termFreq > 0) {
      // Simple TF-IDF-like scoring (without IDF since we don't have corpus stats)
      score += termFreq / (termFreq + 1.2 * (0.25 + 0.75 * (text.length / 1000)))
    }
  }
  
  return Math.min(1.0, score / queryTerms.length)
}

/**
 * Compute embedding similarity score (cosine similarity)
 */
function computeEmbeddingSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) return 0
  
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i]
    norm1 += embedding1[i] * embedding1[i]
    norm2 += embedding2[i] * embedding2[i]
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2)
  return denominator === 0 ? 0 : dotProduct / denominator
}

/**
 * Domain trust scoring based on known authoritative sources
 */
function computeDomainTrustScore(domain: string | undefined): number {
  if (!domain) return 0.5 // Neutral score for unknown domains
  
  const trustedDomains = [
    'sec.gov', 'sec.com', // SEC filings
    'bloomberg.com', 'reuters.com', 'wsj.com', // Financial news
    'crunchbase.com', 'pitchbook.com', // Company data
    'linkedin.com', 'apollo.io', // Professional networks
    'github.com', 'stackoverflow.com', // Technical
  ]
  
  const lowTrustDomains = [
    'wikipedia.org', // Can be edited
    'reddit.com', 'twitter.com', 'facebook.com', // Social media
  ]
  
  const domainLower = domain.toLowerCase()
  
  if (trustedDomains.some(td => domainLower.includes(td))) {
    return 0.9
  }
  
  if (lowTrustDomains.some(ld => domainLower.includes(ld))) {
    return 0.3
  }
  
  // Check for .gov, .edu, .org domains (generally more trustworthy)
  if (domainLower.endsWith('.gov') || domainLower.endsWith('.edu')) {
    return 0.85
  }
  
  if (domainLower.endsWith('.org')) {
    return 0.7
  }
  
  return 0.5 // Default neutral score
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | undefined {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return undefined
  }
}

/**
 * Chunk text into smaller segments with overlap
 */
function chunkText(text: string, chunkSize: number = 512, overlap: number = 50): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ')
    if (chunk.trim().length > 0) {
      chunks.push(chunk)
    }
  }
  
  return chunks
}

/**
 * Deduplicate snippets by semantic similarity
 */
function deduplicateSnippets(snippets: SearchSnippet[], threshold: number = 0.85): SearchSnippet[] {
  const unique: SearchSnippet[] = []
  
  for (const snippet of snippets) {
    let isDuplicate = false
    
    for (const existing of unique) {
      // Simple text similarity check (can be enhanced with embeddings)
      const text1 = snippet.text.toLowerCase()
      const text2 = existing.text.toLowerCase()
      
      // Check if one contains the other (simple dedup)
      if (text1.includes(text2) || text2.includes(text1)) {
        const similarity = Math.min(text1.length, text2.length) / Math.max(text1.length, text2.length)
        if (similarity > threshold) {
          isDuplicate = true
          // Keep the one with higher score
          if (snippet.score > existing.score) {
            const index = unique.indexOf(existing)
            unique[index] = snippet
          }
          break
        }
      }
    }
    
    if (!isDuplicate) {
      unique.push(snippet)
    }
  }
  
  return unique
}

/**
 * Cluster snippets by semantic similarity for consensus verification
 */
function clusterSnippets(snippets: SearchSnippet[]): Array<{ snippets: SearchSnippet[], confidence: number }> {
  const clusters: Array<{ snippets: SearchSnippet[], confidence: number }> = []
  const processed = new Set<number>()
  
  for (let i = 0; i < snippets.length; i++) {
    if (processed.has(i)) continue
    
    const cluster: SearchSnippet[] = [snippets[i]]
    processed.add(i)
    
    // Find similar snippets
    for (let j = i + 1; j < snippets.length; j++) {
      if (processed.has(j)) continue
      
      const text1 = snippets[i].text.toLowerCase()
      const text2 = snippets[j].text.toLowerCase()
      
      // Simple similarity check (can be enhanced with embeddings)
      const similarity = Math.min(text1.length, text2.length) / Math.max(text1.length, text2.length)
      
      if (similarity > 0.7) {
        cluster.push(snippets[j])
        processed.add(j)
      }
    }
    
    if (cluster.length > 0) {
      // Compute cluster confidence based on:
      // 1. Average score
      // 2. Number of distinct domains
      // 3. Number of sources
      const avgScore = cluster.reduce((sum, s) => sum + s.score, 0) / cluster.length
      const distinctDomains = new Set(cluster.map(s => s.domain).filter(Boolean)).size
      const distinctSources = new Set(cluster.map(s => s.source)).size
      
      const confidence = (avgScore * 0.5) + 
                        (Math.min(distinctDomains / 3, 1) * 0.3) + 
                        (Math.min(distinctSources / 2, 1) * 0.2)
      
      clusters.push({ snippets: cluster, confidence })
    }
  }
  
  return clusters.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Score and filter snippets based on relevance
 */
export function scoreAndFilterSnippets(
  snippets: SearchSnippet[],
  query: string,
  config: SearchPipelineConfig
): SearchSnippet[] {
  // Apply domain filters
  let filtered = snippets.filter(snippet => {
    if (config.includeDomains && snippet.domain) {
      return config.includeDomains.some(domain => snippet.domain?.includes(domain))
    }
    if (config.excludeDomains && snippet.domain) {
      return !config.excludeDomains.some(domain => snippet.domain?.includes(domain))
    }
    return true
  })
  
  // Compute combined scores (BM25 + domain trust)
  filtered = filtered.map(snippet => {
    const bm25Score = computeBM25Score(snippet.text, query)
    const domainScore = computeDomainTrustScore(snippet.domain)
    
    // Combine scores: 70% relevance, 30% domain trust
    const combinedScore = (bm25Score * 0.7) + (domainScore * 0.3)
    
    return {
      ...snippet,
      score: Math.max(snippet.score, combinedScore), // Keep original score if higher
    }
  })
  
  // Apply minimum threshold
  const threshold = config.minScoreThreshold || 0.3
  filtered = filtered.filter(s => s.score >= threshold)
  
  // Sort by score
  filtered.sort((a, b) => b.score - a.score)
  
  // Apply search depth logic
  if (config.searchDepth === 'basic') {
    // Basic: 1 top snippet per URL/domain
    const seenUrls = new Set<string>()
    const seenDomains = new Set<string>()
    filtered = filtered.filter(snippet => {
      if (snippet.url && seenUrls.has(snippet.url)) return false
      if (snippet.domain && seenDomains.has(snippet.domain)) return false
      if (snippet.url) seenUrls.add(snippet.url)
      if (snippet.domain) seenDomains.add(snippet.domain)
      return true
    })
  } else {
    // Advanced: Multiple snippets per URL, then deduplicate
    filtered = deduplicateSnippets(filtered, 0.85)
  }
  
  // Limit results
  return filtered.slice(0, config.maxResults)
}

/**
 * Process Perplexity response and extract structured snippets
 */
export function extractPerplexitySnippets(
  perplexityResponse: string,
  query: string
): SearchSnippet[] {
  const snippets: SearchSnippet[] = []
  
  // Perplexity typically includes citations in format [1], [2], etc.
  // Extract text segments and try to identify citations
  const citationRegex = /\[(\d+)\]/g
  const matches = Array.from(perplexityResponse.matchAll(citationRegex))
  
  // Split response into sentences/paragraphs
  const paragraphs = perplexityResponse.split(/\n\n+/)
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length < 50) continue // Skip very short paragraphs
    
    // Check if paragraph contains query terms
    const bm25Score = computeBM25Score(paragraph, query)
    
    if (bm25Score > 0.1) {
      snippets.push({
        text: paragraph.trim(),
        score: bm25Score,
        source: 'perplexity',
        metadata: { hasCitations: citationRegex.test(paragraph) },
      })
    }
  }
  
  return snippets
}

/**
 * Process Tavily response and extract structured snippets
 * Tavily returns well-scored results with high-quality content
 */
export function extractTavilySnippets(tavilyData: {
  results?: Array<{
    title: string
    url: string
    content: string
    score?: number
    published_date?: string
    raw_content?: string | null
    favicon?: string | null
  }>
  answer?: string
  follow_up_questions?: string[] | null
}): SearchSnippet[] {
  const snippets: SearchSnippet[] = []
  
  if (!tavilyData.results) return snippets
  
  // Tavily already provides high-quality, scored results
  // Use their scores directly (they're already relevance-scored)
  for (const result of tavilyData.results) {
    const domain = extractDomain(result.url)
    const domainScore = computeDomainTrustScore(domain)
    
    // Tavily scores are typically 0.0-1.0, with higher being better
    // Combine Tavily's relevance score (70%) with domain trust (30%)
    const combinedScore = result.score !== undefined
      ? (result.score * 0.7) + (domainScore * 0.3)
      : domainScore
    
    // Use raw_content if available (more complete), otherwise use content snippet
    const contentToUse = result.raw_content || result.content
    
    // For high-scoring results (>0.5), use full content
    // For lower scores, chunk to avoid noise
    if (combinedScore > 0.5 && contentToUse.length <= 1000) {
      snippets.push({
        text: contentToUse,
        url: result.url,
        title: result.title,
        score: Math.min(1.0, combinedScore),
        source: 'tavily',
        domain,
        timestamp: result.published_date ? new Date(result.published_date) : undefined,
        metadata: {
          tavilyScore: result.score,
          favicon: result.favicon,
        },
      })
    } else {
      // Chunk lower-scoring or very long content
      const chunks = contentToUse.length > 500 
        ? chunkText(contentToUse, 500, 50)
        : [contentToUse]
      
      for (const chunk of chunks) {
        snippets.push({
          text: chunk,
          url: result.url,
          title: result.title,
          score: Math.min(1.0, combinedScore),
          source: 'tavily',
          domain,
          timestamp: result.published_date ? new Date(result.published_date) : undefined,
          metadata: {
            tavilyScore: result.score,
            favicon: result.favicon,
          },
        })
      }
    }
  }
  
  return snippets
}

/**
 * Hybrid search: Combine vector similarity + BM25 for document chunks
 */
export async function hybridDocumentSearch(
  query: string,
  companyId: string,
  dealId: string | null,
  maxResults: number = 10
): Promise<SearchSnippet[]> {
  const pool = getDatabasePool()
  const snippets: SearchSnippet[] = []
  
  // Check if pgvector is available
  let hasVectorExtension = false
  try {
    const extCheck = await pool.query("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')")
    hasVectorExtension = extCheck.rows[0].exists
  } catch {
    hasVectorExtension = false
  }
  
  const dealFilter = dealId ? `AND d.deal_id = $2` : ''
  const params = dealId ? [companyId, dealId] : [companyId]
  
  if (hasVectorExtension) {
    // Hybrid search: vector similarity + text search
    // Note: This is a simplified version - full hybrid would require generating query embedding
    const sqlQuery = `
      SELECT 
        dc.id,
        dc.content,
        dc.page_number,
        dc.embedding,
        d.id as document_id,
        d.name as document_name,
        CASE 
          WHEN dc.content ILIKE $${params.length + 1} THEN 1.0
          ELSE 0.5
        END as text_score
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE d.company_id = $1 
        AND d.deleted_at IS NULL
        ${dealFilter}
        AND dc.content ILIKE $${params.length + 1}
      ORDER BY text_score DESC, dc.created_at DESC
      LIMIT ${maxResults * 2}
    `
    
    const queryParam = `%${query}%`
    const result = await pool.query(sqlQuery, [...params, queryParam])
    
    for (const row of result.rows) {
      const bm25Score = computeBM25Score(row.content, query)
      const textScore = row.text_score || 0
      
      // Combine BM25 (30%) + text match (70%)
      const combinedScore = (bm25Score * 0.3) + (textScore * 0.7)
      
      snippets.push({
        text: row.content,
        score: combinedScore,
        source: 'internal',
        title: row.document_name,
        metadata: {
          documentId: row.document_id,
          pageNumber: row.page_number,
        },
      })
    }
  } else {
    // Fallback to text search only
    const sqlQuery = `
      SELECT 
        dc.id,
        dc.content,
        dc.page_number,
        d.id as document_id,
        d.name as document_name
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE d.company_id = $1 
        AND d.deleted_at IS NULL
        ${dealFilter}
        AND dc.content ILIKE $${params.length + 1}
      ORDER BY dc.created_at DESC
      LIMIT ${maxResults * 2}
    `
    
    const queryParam = `%${query}%`
    const result = await pool.query(sqlQuery, [...params, queryParam])
    
    for (const row of result.rows) {
      const bm25Score = computeBM25Score(row.content, query)
      
      snippets.push({
        text: row.content,
        score: bm25Score,
        source: 'internal',
        title: row.document_name,
        metadata: {
          documentId: row.document_id,
          pageNumber: row.page_number,
        },
      })
    }
  }
  
  return snippets
}

/**
 * Main pipeline: Orchestrate multi-source retrieval, scoring, and consensus
 */
export async function runSearchPipeline(
  query: string,
  config: SearchPipelineConfig,
  companyId: string,
  dealId: string | null,
  perplexityResponse?: string,
  tavilyData?: {
    results?: Array<{
      title: string
      url: string
      content: string
      score?: number
      published_date?: string
    }>
    answer?: string
  }
): Promise<SearchPipelineResult> {
  const startTime = Date.now()
  const requestId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const allSnippets: SearchSnippet[] = []
  
  // 1. Internal document search (hybrid)
  const internalSnippets = await hybridDocumentSearch(query, companyId, dealId, config.maxResults)
  allSnippets.push(...internalSnippets)
  
  // 2. Extract snippets from Perplexity response
  if (perplexityResponse) {
    const perplexitySnippets = extractPerplexitySnippets(perplexityResponse, query)
    allSnippets.push(...perplexitySnippets)
  }
  
  // 3. Extract snippets from Tavily response
  if (tavilyData) {
    const tavilySnippets = extractTavilySnippets(tavilyData)
    allSnippets.push(...tavilySnippets)
  }
  
  // 4. Score and filter snippets
  const scoredSnippets = scoreAndFilterSnippets(allSnippets, query, config)
  
  // 5. Consensus verification (if enabled)
  let consensusScore: number | undefined
  if (config.enableConsensus && scoredSnippets.length > 1) {
    const clusters = clusterSnippets(scoredSnippets)
    if (clusters.length > 0) {
      // Use top cluster's confidence as consensus score
      consensusScore = clusters[0].confidence
    }
  }
  
  const latencyMs = Date.now() - startTime
  
  return {
    snippets: scoredSnippets,
    answer: tavilyData?.answer,
    meta: {
      searchDepth: config.searchDepth,
      topic: config.topic,
      latencyMs,
      requestId,
      totalSources: new Set(scoredSnippets.map(s => s.source)).size,
      consensusScore,
    },
  }
}

