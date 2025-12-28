import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import { searchQuerySchema } from '@/shared/validation/schemas'
import { decrypt } from '@/shared/utils/encryption'
import jwt from 'jsonwebtoken'
import {
  runSearchPipeline,
  type SearchPipelineConfig,
  type SearchSnippet,
} from '@/shared/services/search-pipeline'
import {
  logAiOperation,
  generateTraceId,
  generateSpanId,
} from '@/shared/services/ai-audit'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

async function getAuthContext(request: NextRequest): Promise<{ userId: string; companyId: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string }
    return decoded
  } catch {
    return null
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = searchQuerySchema.parse(body)

    const pool = getDatabasePool()

    // Get company's API keys (only if validated)
    let openaiApiKey: string | null = null
    let geminiApiKey: string | null = null
    let perplexityApiKey: string | null = null
    let tavilyApiKey: string | null = null
    let apolloApiKey: string | null = null
    let defaultModel: string = 'gpt-4-turbo'
    let perplexityKeyStatus: 'none' | 'invalid' | 'valid' = 'none'
    
    try {
      const settingsResult = await pool.query(
        `SELECT openai_api_key_encrypted, openai_validated,
                gemini_api_key_encrypted, gemini_validated,
                perplexity_api_key_encrypted, perplexity_validated,
                tavily_api_key_encrypted, tavily_validated,
                apollo_api_key_encrypted, apollo_validated,
                default_model
         FROM ai_settings 
         WHERE company_id = $1`,
        [auth.companyId]
      )
      const settings = settingsResult.rows[0]
      
      if (settings) {
        defaultModel = settings.default_model || 'gpt-4-turbo'
        
        // OpenAI
        if (settings.openai_api_key_encrypted && settings.openai_validated === true) {
          try {
            openaiApiKey = decrypt(settings.openai_api_key_encrypted)
            if (openaiApiKey && openaiApiKey.trim() !== '') {
              console.log('✓ OpenAI API key loaded and validated')
            }
          } catch (error) {
            console.error('Failed to decrypt OpenAI API key:', error)
          }
        }
        
        // Gemini
        if (settings.gemini_api_key_encrypted && settings.gemini_validated === true) {
          try {
            geminiApiKey = decrypt(settings.gemini_api_key_encrypted)
            if (geminiApiKey && geminiApiKey.trim() !== '') {
              console.log('✓ Gemini API key loaded and validated')
            }
          } catch (error) {
            console.error('Failed to decrypt Gemini API key:', error)
          }
        }
        
        // Perplexity
        if (settings.perplexity_api_key_encrypted) {
          if (settings.perplexity_validated === true) {
            try {
              perplexityApiKey = decrypt(settings.perplexity_api_key_encrypted)
              if (!perplexityApiKey || perplexityApiKey.trim() === '') {
                console.warn('Perplexity API key decryption returned empty value')
                perplexityKeyStatus = 'invalid'
              } else {
                console.log('✓ Perplexity API key loaded and validated')
                perplexityKeyStatus = 'valid'
              }
            } catch (decryptError) {
              console.error('Failed to decrypt Perplexity API key:', decryptError)
              perplexityKeyStatus = 'invalid'
            }
          } else {
            console.warn('⚠ Perplexity API key exists but validation failed when saved')
            console.warn('  The key was saved but marked as invalid (perplexity_validated = false)')
            console.warn('  Possible reasons: Invalid key format, expired key, network error during validation')
            console.warn('  Solution: Re-enter the Perplexity API key in Settings to retry validation')
            perplexityKeyStatus = 'invalid'
          }
        } else {
          perplexityKeyStatus = 'none'
        }
        
        // Tavily
        if (settings.tavily_api_key_encrypted && settings.tavily_validated === true) {
          try {
            tavilyApiKey = decrypt(settings.tavily_api_key_encrypted)
            if (tavilyApiKey && tavilyApiKey.trim() !== '') {
              console.log('✓ Tavily API key loaded and validated')
            }
          } catch (error) {
            console.error('Failed to decrypt Tavily API key:', error)
          }
        }
        
        // Apollo
        if (settings.apollo_api_key_encrypted && settings.apollo_validated === true) {
          try {
            apolloApiKey = decrypt(settings.apollo_api_key_encrypted)
            if (apolloApiKey && apolloApiKey.trim() !== '') {
              console.log('✓ Apollo API key loaded and validated')
            }
          } catch (error) {
            console.error('Failed to decrypt Apollo API key:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }

    const query = validated.query.toLowerCase()
    const traceId = generateTraceId()
    
    // Entity resolution: Let LLMs handle this naturally (like Google does)
    // LLMs (Perplexity, OpenAI, Gemini) already have knowledge graphs and can resolve:
    // - Abbreviations (AAPL → Apple Inc.)
    // - Nicknames (Mickey D's → McDonald's)
    // - Common misspellings (macdonald → McDonald's)
    // - Ticker symbols (MSFT → Microsoft)
    // - Context-aware disambiguation
    // No hardcoded mappings needed - LLMs are trained on vast knowledge bases
    const expandedQuery = validated.query
    
    // Determine search depth and topic from query intent
    const searchDepth: 'basic' | 'advanced' = validated.intent === 'fact_qa' ? 'advanced' : 'basic'
    const topic = query.includes('company') || query.includes('business') || query.includes('deal')
      ? 'company'
      : query.includes('news') || query.includes('recent') || query.includes('latest')
      ? 'news'
      : 'general'

    // Configure pipeline
    const pipelineConfig: SearchPipelineConfig = {
      maxResults: 15,
      searchDepth,
      topic,
      minScoreThreshold: 0.3,
      enableConsensus: true,
    }

    // Also search deals if query mentions "deal" or "deals"
    let dealsInfo = ''
    if (query.includes('deal')) {
      try {
        const dealsResult = await pool.query(
          `SELECT id, name, stage, value, currency, sector, health_score 
           FROM deals 
           WHERE company_id = $1 
             AND deleted_at IS NULL 
             AND (LOWER(name) LIKE $2 OR LOWER(stage) LIKE $2 OR LOWER(sector) LIKE $2)
           ORDER BY created_at DESC 
           LIMIT 5`,
          [auth.companyId, `%${query}%`]
        )
        
        if (dealsResult.rows.length > 0) {
          dealsInfo = `\n\n**Active Deals:**\n${dealsResult.rows.map((deal: { name: string; stage: string; value?: number; currency?: string; sector?: string }, idx: number) => {
            const valueStr = deal.value ? `${deal.currency || 'USD'} ${deal.value.toLocaleString()}` : 'Value not specified'
            return `${idx + 1}. **${deal.name}** - Stage: ${deal.stage}, Value: ${valueStr}${deal.sector ? `, Sector: ${deal.sector}` : ''}`
          }).join('\n')}`
        }
      } catch (dealsError) {
        console.error('Error fetching deals:', dealsError)
      }
    }

    // Determine if web search would be helpful
    const hintsWebSearch = 
      query.includes('active deals') || 
      query.includes('public') || 
      query.includes('web') ||
      query.includes('current') ||
      query.includes('recent') ||
      query.includes('latest') ||
      query.includes('what') ||
      query.includes('who') ||
      query.includes('when') ||
      query.includes('where') ||
      query.includes('business') ||
      query.includes('company') ||
      query.includes('market') ||
      query.includes('industry') ||
      query.includes('should') ||
      query.includes('recommend')

    // Fetch web search results with Tavily-like pipeline
    let perplexityResponseText: string | undefined
    let tavilyData: {
      results?: Array<{
        title: string
        url: string
        content: string
        score?: number
        published_date?: string
      }>
      answer?: string
    } | undefined
    
    const spanIdPerplexity = generateSpanId()
    const spanIdTavily = generateSpanId()
    
    // Try Perplexity first (best for general web search)
    if (perplexityApiKey) {
      const searchPriority = hintsWebSearch ? 'high' : 'medium'
      console.log(`🔍 Using Perplexity API for web search (priority: ${searchPriority}):`, validated.query)
      
      const perplexityStartTime = Date.now()
      try {
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
            body: JSON.stringify({
              model: 'sonar-pro',
              messages: [
                {
                  role: 'system',
                  content: `You are an expert M&A and investment banking research analyst. When asked about companies, deals, or business recommendations, you MUST provide:
1. Specific company names (not generic descriptions) - use full official names
2. Key contacts or decision-makers when available
3. Detailed analysis with concrete reasons
4. Financial data, market position, and strategic fit
5. Actionable insights with citations

ENTITY RESOLUTION & DISAMBIGUATION:
- Use your knowledge graph to resolve abbreviations, nicknames, ticker symbols, and common misspellings to full official company names
- Common patterns: ticker symbols (AAPL → Apple Inc.), abbreviations (MSFT → Microsoft), nicknames (Mickey D's → McDonald's)
- For company names, use official legal names when available (e.g., "McDonald's Corporation" not just "McDonald's")
- Use context clues to disambiguate (e.g., "kcc" in M&A context likely refers to "KCC Capital Partners")
- When you encounter an abbreviation or nickname, search for both the abbreviation AND the full official company name to ensure comprehensive results
- Leverage your training data and knowledge base to resolve entities naturally - don't require exact matches

Always search thoroughly and provide comprehensive, detailed answers with specific examples. Do not give generic "we don't have enough information" responses - search deeper and provide the best available information.`,
                },
                {
                  role: 'user',
                  content: expandedQuery, // Use expanded query with full entity names
                },
              ],
              temperature: 0.3,
              max_tokens: 2000,
            }),
        })

        const perplexityLatency = Date.now() - perplexityStartTime

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json()
          perplexityResponseText = perplexityData.choices?.[0]?.message?.content
          
          // Log Perplexity API call
          await logAiOperation({
            operationType: 'external_api',
            model: 'sonar-pro',
            latencyMs: perplexityLatency,
            traceId,
            spanId: spanIdPerplexity,
            metadata: {
              provider: 'perplexity',
              query: validated.query,
              responseLength: perplexityResponseText?.length || 0,
            },
          })
          
          if (perplexityResponseText) {
            console.log('✓ Perplexity web search completed successfully')
          }
        } else {
          const errorText = await perplexityResponse.text()
          console.error(`Perplexity API error (${perplexityResponse.status}):`, errorText)
        }
      } catch (webError) {
        console.error('Perplexity API error:', webError)
      }
    }
    
    // Try Tavily as complementary search (especially for company intelligence)
    // Tavily excels at structured, research-focused queries with high-quality answers
    if (tavilyApiKey && (topic === 'company' || !perplexityResponseText || searchDepth === 'advanced')) {
      console.log('🔍 Using Tavily API for enterprise web search:', validated.query)
      
      const tavilyStartTime = Date.now()
      try {
        const tavilyResponse = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: expandedQuery, // Use expanded query with full entity names
            search_depth: searchDepth === 'advanced' ? 'advanced' : 'basic',
            max_results: 10,
            include_answer: 'advanced', // Use advanced answer generation (like Tavily playground)
            include_raw_content: true, // Get full content for better chunking
            include_images: false, // We don't use images currently
          }),
        })

        const tavilyLatency = Date.now() - tavilyStartTime

        if (tavilyResponse.ok) {
          tavilyData = await tavilyResponse.json()
          
          // Log Tavily API call
          await logAiOperation({
            operationType: 'external_api',
            latencyMs: tavilyLatency,
            traceId,
            spanId: spanIdTavily,
            metadata: {
              provider: 'tavily',
              query: validated.query,
              searchDepth,
              resultCount: tavilyData.results?.length || 0,
              hasAnswer: !!tavilyData.answer,
              responseTime: (tavilyData as { response_time?: number })?.response_time,
            },
          })
          
          console.log('✓ Tavily web search completed successfully')
          if (tavilyData.answer) {
            console.log(`  Answer length: ${tavilyData.answer.length} chars`)
          }
        } else {
          const errorText = await tavilyResponse.text()
          console.error(`Tavily API error (${tavilyResponse.status}):`, errorText)
        }
      } catch (tavilyError) {
        console.error('Tavily API error:', tavilyError)
      }
    }
    
    // Run Tavily-like RAG pipeline
    const pipelineStartTime = Date.now()
    const pipelineResult = await runSearchPipeline(
      expandedQuery, // Use expanded query with full entity names
      pipelineConfig,
      auth.companyId,
      validated.dealId || null,
      perplexityResponseText,
      tavilyData
    )
    const pipelineLatency = Date.now() - pipelineStartTime
    
    // Log RAG pipeline operation
    await logAiOperation({
      operationType: 'rag_pipeline',
      latencyMs: pipelineLatency,
      confidenceScore: pipelineResult.meta.consensusScore,
      groundingScore: pipelineResult.snippets.length > 0
        ? pipelineResult.snippets.reduce((sum, s) => sum + s.score, 0) / pipelineResult.snippets.length
        : undefined,
      traceId,
      metadata: {
        searchDepth,
        topic,
        snippetCount: pipelineResult.snippets.length,
        totalSources: pipelineResult.meta.totalSources,
      },
    })
    
    // Convert snippets to citations format
    const citations = pipelineResult.snippets
      .filter(s => s.source === 'internal')
      .map((snippet, idx) => ({
        documentId: snippet.metadata?.documentId as string | undefined,
        documentName: snippet.title || 'Unknown Document',
        pageNumber: snippet.metadata?.pageNumber as number | undefined,
        confidence: snippet.score,
      }))
    
    // Prepare web citations (for display)
    const webCitations = pipelineResult.snippets
      .filter(s => s.source !== 'internal')
      .map((snippet, idx) => ({
        url: snippet.url,
        title: snippet.title,
        domain: snippet.domain,
        score: snippet.score,
        source: snippet.source,
      }))

    // Prepare context for LLM generation from scored snippets
    const documentContext = pipelineResult.snippets
      .filter(s => s.source === 'internal')
      .map((snippet, idx) => {
        const pageInfo = snippet.metadata?.pageNumber ? ` (Page ${snippet.metadata.pageNumber})` : ''
        const title = snippet.title || 'Document'
        return `[${title}${pageInfo}] [Score: ${(snippet.score * 100).toFixed(0)}%]: ${snippet.text.substring(0, 500)}${snippet.text.length > 500 ? '...' : ''}`
      })
      .join('\n\n')
    
    // Prepare web search context with citations
    // Prioritize Tavily's structured answer if available, then add scored snippets
    let webSearchContext = ''
    
    // Use Tavily's advanced answer if available (it's already well-structured like their playground)
    if (tavilyData?.answer) {
      webSearchContext = `**Tavily Research Answer:**\n${tavilyData.answer}\n\n`
    }
    
    // Add scored snippets from all sources (Tavily, Perplexity)
    const webSnippets = pipelineResult.snippets.filter(s => s.source !== 'internal')
    
    if (webSnippets.length > 0) {
      const snippetsText = webSnippets
        .map((snippet, idx) => {
          const sourceLabel = snippet.source === 'perplexity' ? 'Perplexity' : snippet.source === 'tavily' ? 'Tavily' : snippet.source
          const domainInfo = snippet.domain ? ` (${snippet.domain})` : ''
          const scoreInfo = `[Relevance: ${(snippet.score * 100).toFixed(0)}%]`
          const urlInfo = snippet.url ? `\n🔗 Source: ${snippet.url}` : ''
          const titleInfo = snippet.title ? `\n📄 ${snippet.title}` : ''
          
          return `**${idx + 1}. ${sourceLabel}${domainInfo}** ${scoreInfo}${titleInfo}\n${snippet.text.substring(0, 500)}${snippet.text.length > 500 ? '...' : ''}${urlInfo}`
        })
        .join('\n\n---\n\n')
      
      if (webSearchContext) {
        webSearchContext += `**Supporting Sources:**\n\n${snippetsText}`
      } else {
        webSearchContext = `**Web Search Results:**\n\n${snippetsText}`
      }
    }

    const contextText = `${documentContext}${dealsInfo ? `\n\nDeal Information:\n${dealsInfo}` : ''}${webSearchContext ? `\n\n**Web Search Results:**\n${webSearchContext}` : ''}`

    // Generate intelligent answer using LLM (OpenAI or Gemini) if available
    let answer: string
    const hasLLM = openaiApiKey || geminiApiKey
    
    if (pipelineResult.snippets.length === 0 && !dealsInfo) {
      let helpMessage = 'Please try rephrasing your question or check if relevant documents have been uploaded.'
      if (perplexityKeyStatus === 'none') {
        helpMessage = 'Web search is not available. Please configure your Perplexity API key in Settings to enable web search for any query.'
      } else if (perplexityKeyStatus === 'invalid') {
        helpMessage = 'Web search is not available because your Perplexity API key failed validation. Please re-enter and save your Perplexity API key in Settings (make sure it starts with "pplx-").'
      } else if (perplexityApiKey) {
        helpMessage = 'Web search was attempted but returned no results.'
      }
      answer = `I couldn't find any information about "${validated.query}" in the available documents or deals. ${helpMessage}`
    } else if (hasLLM && contextText.trim() !== '') {
      // Use LLM to generate intelligent answer from context
      try {
        const useOpenAI = (defaultModel.includes('gpt') || defaultModel.includes('openai')) && openaiApiKey
        const useGemini = (defaultModel.includes('gemini') || !openaiApiKey) && geminiApiKey
        
        if (useOpenAI) {
          console.log('🤖 Using OpenAI for answer generation')
          const llmStartTime = Date.now()
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: defaultModel || 'gpt-4-turbo',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert M&A and investment banking analyst for KCC Capital Partners. When answering questions:\n1. Provide specific company names, contacts, and details (not generic descriptions)\n2. Give detailed analysis with concrete reasons and data\n3. Synthesize information from all sources (documents, deals, web search)\n4. Always cite sources when referencing specific information\n5. If web search provides company recommendations, extract and present them clearly with analysis\n6. Be comprehensive and actionable - provide the information requested, not excuses about missing data',
                },
                {
                  role: 'user',
                  content: `Question: ${validated.query}\n\nContext from internal documents and deals:\n${documentContext}${dealsInfo ? `\n\nDeal Information:\n${dealsInfo}` : ''}\n\nWeb Search Results:\n${webSearchContext}\n\nPlease provide a comprehensive, detailed answer that:\n1. Lists specific companies, names, and contacts when available\n2. Provides detailed analysis with concrete reasons\n3. Synthesizes information from all sources above\n4. Always cite sources using [Source Name] format when referencing specific information\n5. Answers the question directly and completely\n\nNote: Each snippet includes a relevance score - prioritize information from higher-scored sources.`,
                },
              ],
              temperature: 0.2,
              max_tokens: 1500,
            }),
          })
          
          if (openaiResponse.ok) {
            const openaiData = await openaiResponse.json()
          const llmLatency = Date.now() - llmStartTime
          answer = openaiData.choices?.[0]?.message?.content || `Based on the available information: ${contextText}`
          
          // Log LLM call
          const spanIdLLM = generateSpanId()
          await logAiOperation({
            operationType: 'llm_call',
            model: defaultModel || 'gpt-4-turbo',
            inputTokens: openaiData.usage?.prompt_tokens,
            outputTokens: openaiData.usage?.completion_tokens,
            latencyMs: llmLatency,
            traceId,
            spanId: spanIdLLM,
            metadata: {
              provider: 'openai',
              query: validated.query,
            },
          })
          } else {
            throw new Error(`OpenAI API error: ${openaiResponse.status}`)
          }
        } else if (useGemini) {
          console.log('🤖 Using Gemini for answer generation')
          const llmStartTime = Date.now()
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${defaultModel || 'gemini-pro'}:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
              body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `You are an expert M&A and investment banking analyst for KCC Capital Partners. When answering questions:
1. Provide specific company names, contacts, and details (not generic descriptions) - use full official names
2. Give detailed analysis with concrete reasons and data
3. Synthesize information from all sources (documents, deals, web search)
4. Always cite sources using [Source Name] format when referencing specific information
5. If web search provides company recommendations, extract and present them clearly with analysis
6. Be comprehensive and actionable - provide the information requested, not excuses about missing data

ENTITY RESOLUTION & DISAMBIGUATION:
- Use your knowledge graph and training data to resolve abbreviations, nicknames, ticker symbols, and common misspellings to full official company names
- Common patterns: ticker symbols (AAPL → Apple Inc.), abbreviations (MSFT → Microsoft), nicknames (Mickey D's → McDonald's)
- Use official legal names when available (e.g., "McDonald's Corporation" not just "McDonald's")
- Use context clues to disambiguate (e.g., "kcc" in M&A/investment banking context likely refers to "KCC Capital Partners")
- When you encounter an abbreviation or nickname, search for both the abbreviation AND the full official company name to ensure comprehensive results
- Leverage your training data and knowledge base to resolve entities naturally - don't require exact matches

Question: ${validated.query}

Context from internal documents and deals:
${documentContext}${dealsInfo ? `\n\nDeal Information:\n${dealsInfo}` : ''}

Web Search Results:
${webSearchContext}

Please provide a comprehensive, detailed answer that:
1. Lists specific companies, names, and contacts when available (use full official company names)
2. Provides detailed analysis with concrete reasons
3. Synthesizes information from all sources above
4. Always cite sources using [Source Name] format
5. Resolves any abbreviations or common misspellings to full official names (e.g., "kcc" → "KCC Capital Partners", "macdonald" → "McDonald's Corporation")
6. Answers the question directly and completely

Note: Each snippet includes a relevance score - prioritize information from higher-scored sources.`,
                    }],
                  }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1500,
              },
            }),
          })
          
          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json()
            const llmLatency = Date.now() - llmStartTime
            answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || `Based on the available information: ${contextText}`
            
            // Log LLM call
            const spanIdLLM = generateSpanId()
            await logAiOperation({
              operationType: 'llm_call',
              model: defaultModel || 'gemini-pro',
              latencyMs: llmLatency,
              traceId,
              spanId: spanIdLLM,
              metadata: {
                provider: 'gemini',
                query: validated.query,
              },
            })
          } else {
            throw new Error(`Gemini API error: ${geminiResponse.status}`)
          }
        } else {
          // Fallback: simple concatenation
          answer = `Based on the available information, here's what I found regarding "${validated.query}":\n\n${contextText}`
        }
      } catch (llmError) {
        console.error('LLM generation error:', llmError)
        // Fallback to simple answer
        answer = `Based on the available information, here's what I found regarding "${validated.query}":\n\n${contextText}`
      }
    } else {
      // No LLM available - use Tavily answer or simple concatenation
      if (pipelineResult.answer) {
        answer = pipelineResult.answer
      } else {
        const documentInfo = pipelineResult.snippets
          .filter(s => s.source === 'internal')
          .map((snippet, idx) => {
            const pageInfo = snippet.metadata?.pageNumber ? ` (Page ${snippet.metadata.pageNumber})` : ''
            const title = snippet.title || 'Document'
            return `${idx + 1}. [${title}${pageInfo}] [Score: ${(snippet.score * 100).toFixed(0)}%] ${snippet.text.substring(0, 300)}${snippet.text.length > 300 ? '...' : ''}`
          })
          .join('\n\n')
        
        const webInfo = pipelineResult.snippets
          .filter(s => s.source !== 'internal')
          .map((snippet, idx) => {
            const sourceLabel = snippet.source === 'perplexity' ? 'Perplexity' : snippet.source === 'tavily' ? 'Tavily' : snippet.source
            const urlInfo = snippet.url ? ` (${snippet.url})` : ''
            return `${idx + 1}. [${sourceLabel}${urlInfo}] [Score: ${(snippet.score * 100).toFixed(0)}%] ${snippet.text.substring(0, 200)}${snippet.text.length > 200 ? '...' : ''}`
          })
          .join('\n\n')
        
        answer = `Based on the available information, here's what I found regarding "${validated.query}":\n\n${documentInfo ? `**From Documents:**\n${documentInfo}\n\n` : ''}${webInfo ? `**Web Search Results:**\n${webInfo}\n\n` : ''}${dealsInfo || ''}`
        
        if (!hasLLM) {
          answer += '\n\n*Note: Configure OpenAI or Gemini API keys in Settings to enable AI-powered answer generation.*'
        }
      }
    }

    // Compute overall confidence and grounding scores
    const allScores = pipelineResult.snippets.map(s => s.score)
    const avgScore = allScores.length > 0 
      ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length 
      : 0
    
    const groundingScore = pipelineResult.meta.consensusScore !== undefined
      ? (avgScore * 0.5) + (pipelineResult.meta.consensusScore * 0.5)
      : avgScore

    return NextResponse.json({
      data: {
        answer,
        citations,
        confidence: citations.length > 0 ? citations[0].confidence : avgScore,
        groundingScore: Math.max(0, Math.min(1, groundingScore)),
        meta: {
          totalSnippets: pipelineResult.snippets.length,
          consensusScore: pipelineResult.meta.consensusScore,
          totalSources: pipelineResult.meta.totalSources,
          requestId: pipelineResult.meta.requestId,
        },
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 400 }
      )
    }

    console.error('Search error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Search failed',
          details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
        } 
      },
      { status: 500 }
    )
  }
}

