import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  stage: z.string().min(1, 'Stage is required'),
  value: z.number().positive().optional(),
  currency: z.string().default('USD'),
  sector: z.string().optional(),
})

export const documentUploadSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  dealId: z.string().uuid().optional(),
})

export const networkMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  sectors: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
})

export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Query is required'),
  dealId: z.string().uuid().optional(),
  intent: z.enum(['fact_qa', 'action', 'recommendation', 'settings', 'help', 'smalltalk']).optional(),
})

export const aiSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  perplexityApiKey: z.string().optional(),
  tavilyApiKey: z.string().optional(),
  apolloApiKey: z.string().optional(),
  defaultModel: z.string().optional(),
})

