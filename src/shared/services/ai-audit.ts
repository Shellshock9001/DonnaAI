/**
 * AI Audit Logging Service
 * 
 * Logs all AI operations for FINRA compliance and observability
 */

import { getDatabasePool } from '@/config/database'

export interface AiAuditLog {
  operationType: 'llm_call' | 'embedding_generation' | 'vector_search' | 'external_api' | 'rag_pipeline'
  model?: string
  inputTokens?: number
  outputTokens?: number
  costUsd?: number
  latencyMs?: number
  confidenceScore?: number
  groundingScore?: number
  biasFlags?: string[]
  traceId?: string
  spanId?: string
  metadata?: Record<string, unknown>
}

/**
 * Log AI operation to ai_audits table
 */
export async function logAiOperation(log: AiAuditLog): Promise<void> {
  const pool = getDatabasePool()
  
  try {
    await pool.query(
      `INSERT INTO ai_audits (
        operation_type, model, input_tokens, output_tokens, cost_usd,
        latency_ms, confidence_score, grounding_score, bias_flags,
        trace_id, span_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        log.operationType,
        log.model || null,
        log.inputTokens || null,
        log.outputTokens || null,
        log.costUsd ? log.costUsd.toString() : null,
        log.latencyMs || null,
        log.confidenceScore || null,
        log.groundingScore || null,
        log.biasFlags || null,
        log.traceId || null,
        log.spanId || null,
        log.metadata ? JSON.stringify(log.metadata) : null,
      ]
    )
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log AI operation:', error)
  }
}

/**
 * Generate trace ID for request tracking
 */
export function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate span ID for operation tracking
 */
export function generateSpanId(): string {
  return `span-${Math.random().toString(36).substr(2, 9)}`
}

