'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { api } from '@/shared/api/client'
import { Upload, FileText, Search } from 'lucide-react'
import { Document } from './types'

export interface Props {
  // Documents component has no props
}

export default function Documents(_props: Props = {}): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: deals } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const response = await api.get<Array<{ id: string; name: string }>>('/api/v1/deals')
      return response.data
    },
  })

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['documents', selectedDealId],
    queryFn: async () => {
      const response = await api.get<Document[]>(
        `/api/v1/documents${selectedDealId ? `?dealId=${selectedDealId}` : ''}`
      )
      return response.data
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)
      if (selectedDealId) {
        formData.append('dealId', selectedDealId)
      }

      const response = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        uploadMutation.mutate(file)
      })
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
  })

  const filteredDocuments = documents?.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Virtual Data Room</h1>
        <Button variant="primary">
          <Upload className="w-4 h-4 mr-sm" />
          Upload
        </Button>
      </div>

      <Card variant="default">
        <div className="flex gap-md mb-md">
          <div className="flex-1 relative">
            <Search className="absolute left-md top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-xl pr-md py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
            />
          </div>
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
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-xl text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-high)]'
              : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto mb-md text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">
            {isDragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
          </p>
        </div>
      </Card>

      {isLoading ? (
        <Card variant="default">
          <p className="text-[var(--text-muted)]">Loading...</p>
        </Card>
      ) : filteredDocuments && filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} variant="default">
              <div className="flex items-start justify-between mb-md">
                <FileText className="w-8 h-8 text-[var(--accent-primary)]" />
                <Badge
                  variant={
                    doc.status === 'indexed'
                      ? 'success'
                      : doc.status === 'processing'
                      ? 'warning'
                      : doc.status === 'failed'
                      ? 'danger'
                      : 'default'
                  }
                  size="sm"
                >
                  {doc.status}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-xs truncate">
                {doc.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-md">
                {formatFileSize(doc.fileSize)}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="default">
          <div className="text-center py-xl">
            <FileText className="w-12 h-12 mx-auto mb-md text-[var(--text-muted)]" />
            <p className="text-[var(--text-muted)]">No documents found</p>
          </div>
        </Card>
      )}
    </div>
  )
}

