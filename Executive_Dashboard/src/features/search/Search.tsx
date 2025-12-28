'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { api } from '@/shared/api/client'
import { Send, FileText } from 'lucide-react'
import { SearchMessage, SearchResponse } from './types'

export interface Props {
  // Search component has no props
}

export default function Search(_props: Props = {}): JSX.Element {
  const [messages, setMessages] = useState<SearchMessage[]>([])
  const [input, setInput] = useState('')
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: deals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await api.get<Array<{ id: string; name: string }>>('/api/v1/deals')
      return response.data
    },
  })

  const { data: documentCount } = useQuery({
    queryKey: ['documents', 'count', selectedDealId],
    queryFn: async () => {
      const response = await api.get<Array<unknown>>(
        `/api/v1/documents${selectedDealId ? `?dealId=${selectedDealId}` : ''}`
      )
      return response.data.length
    },
  })

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      try {
        const response = await api.post<SearchResponse>('/api/v1/donna/search', {
          query,
          dealId: selectedDealId || undefined,
        })
        return response.data
      } catch (error) {
        console.error('Search error:', error)
        throw error
      }
    },
    onSuccess: (data, query) => {
      const userMessage: SearchMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
      }

      const assistantMessage: SearchMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        timestamp: new Date().toISOString(),
        meta: data.meta,
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setInput('')
    },
    onError: (error) => {
      console.error('Search mutation error:', error)
      const errorMessage: SearchMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || searchMutation.isPending) return
    
    try {
      await searchMutation.mutateAsync(input)
    } catch (error) {
      // Error is handled by onError callback
      console.error('Failed to submit search:', error)
    }
  }

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-xl">AI Search</h1>
      </div>

      <Card variant="default">
        <div className="flex items-center justify-between mb-md">
          <div className="flex items-center gap-md">
            <select
              value={selectedDealId || ''}
              onChange={(e) => setSelectedDealId(e.target.value || null)}
              className="px-md py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            >
              <option value="">All Deals</option>
              {deals?.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}
                </option>
              ))}
            </select>
            {documentCount !== undefined && (
              <Badge variant="info">
                {documentCount} {documentCount === 1 ? 'document' : 'documents'}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Card variant="default" className="flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-md space-y-md mb-md">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              <p>Start a conversation by asking a question</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-md p-md ${
                    message.role === 'user'
                      ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]'
                      : 'bg-[var(--bg-surface-high)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-md pt-md border-t border-[var(--border-subtle)]">
                      <p className="text-xs font-medium mb-xs text-[var(--text-muted)]">
                        📚 Sources ({message.citations.length}):
                      </p>
                      <div className="space-y-xs">
                        {message.citations.map((citation, idx) => (
                          <div key={idx} className="flex items-center gap-xs text-xs">
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            <span className="flex-1">
                              {citation.documentName}
                              {citation.pageNumber && ` (Page ${citation.pageNumber})`}
                            </span>
                            <Badge size="sm" variant="info" className="flex-shrink-0">
                              {(citation.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.meta && (
                    <div className="mt-xs pt-xs border-t border-[var(--border-subtle)]">
                      <div className="flex items-center gap-md text-xs text-[var(--text-muted)]">
                        {message.meta.consensusScore !== undefined && (
                          <span>Consensus: {(message.meta.consensusScore * 100).toFixed(0)}%</span>
                        )}
                        {message.meta.totalSources !== undefined && (
                          <span>Sources: {message.meta.totalSources}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs mt-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-md p-md border-t border-[var(--border-subtle)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-md py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            disabled={searchMutation.isPending}
          />
          <Button type="submit" disabled={searchMutation.isPending || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}

