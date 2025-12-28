export interface SearchMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  timestamp: string
  meta?: {
    totalSnippets?: number
    consensusScore?: number
    totalSources?: number
    requestId?: string
  }
}

export interface Citation {
  documentId: string
  documentName: string
  pageNumber?: number
  confidence: number
}

export interface SearchResponse {
  answer: string
  citations: Citation[]
  confidence: number
  groundingScore: number
  meta?: {
    totalSnippets?: number
    consensusScore?: number
    totalSources?: number
    requestId?: string
  }
}

