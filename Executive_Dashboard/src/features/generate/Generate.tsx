'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { api } from '@/shared/api/client'
import { FileEdit } from 'lucide-react'

export interface Props {
  // Generate component has no props
}

export default function Generate(_props: Props = {}): JSX.Element {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      return [
        { id: 'loi', name: 'Letter of Intent', description: 'Generate LOI from deal data' },
        { id: 'term-sheet', name: 'Term Sheet', description: 'Generate term sheet' },
        { id: 'dd-report', name: 'Due Diligence Report', description: 'Generate DD report' },
      ]
    },
  })

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-xl">Document Generation</h1>
      </div>

      <Card variant="default">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Template Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {templates?.map((template) => (
            <Card
              key={template.id}
              variant={selectedTemplate === template.id ? 'elevated' : 'default'}
              onClick={() => setSelectedTemplate(template.id)}
              className="cursor-pointer"
            >
              <FileEdit className="w-8 h-8 mb-md text-[var(--accent-primary)]" />
              <h3 className="text-md font-semibold text-[var(--text-primary)] mb-xs">
                {template.name}
              </h3>
              <p className="text-sm text-[var(--text-muted)]">{template.description}</p>
            </Card>
          ))}
        </div>
      </Card>

      {selectedTemplate && (
        <Card variant="default">
          <p className="text-[var(--text-muted)]">Generation interface coming soon...</p>
        </Card>
      )}
    </div>
  )
}

