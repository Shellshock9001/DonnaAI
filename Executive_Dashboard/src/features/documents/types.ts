export interface Document {
  id: string
  name: string
  fileName: string
  fileSize: number
  mimeType: string
  status: 'uploaded' | 'processing' | 'indexed' | 'failed'
  dealId?: string
  createdAt: string
  updatedAt: string
}

