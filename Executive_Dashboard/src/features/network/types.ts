export interface NetworkMember {
  id: string
  name: string
  email?: string
  company?: string
  role?: string
  location?: string
  sectors: string[]
  tags: string[]
  trustScore?: number
  createdAt: string
  updatedAt: string
}

export interface NetworkOutcome {
  id: string
  memberId: string
  type: string
  status: string
  description?: string
  createdAt: string
  updatedAt: string
}

