'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { Badge } from '@/shared/components/Badge'
import { api } from '@/shared/api/client'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import { NetworkMember } from './types'

export interface Props {
  // Network component has no props
}

export default function Network(_props: Props = {}): JSX.Element {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'browser' | 'discovery' | 'import' | 'matching' | 'outcomes'>('browser')
  const queryClient = useQueryClient()

  const { data: members, isLoading } = useQuery<NetworkMember[]>({
    queryKey: ['network', 'members'],
    queryFn: async () => {
      const response = await api.get<NetworkMember[]>('/api/v1/network')
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/network/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network', 'members'] })
    },
  })

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'browser', label: 'Browser' },
    { id: 'discovery', label: 'Discovery' },
    { id: 'import', label: 'Import' },
    { id: 'matching', label: 'Matching' },
    { id: 'outcomes', label: 'Outcomes' },
  ]

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Network Intelligence</h1>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-sm" />
          Add Member
        </Button>
      </div>

      <Card variant="default">
        <div className="flex gap-md border-b border-[var(--border-subtle)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-md py-sm text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-[var(--border-strong)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {activeTab === 'browser' && (
        <div>
          {isLoading ? (
            <Card variant="default">
              <p className="text-[var(--text-muted)]">Loading...</p>
            </Card>
          ) : members && members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
              {members.map((member) => (
                <Card key={member.id} variant="default">
                  <div className="flex items-start justify-between mb-md">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-xs">
                        {member.name}
                      </h3>
                      {member.role && (
                        <Badge variant="default" className="mb-xs">
                          {member.role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-xs">
                      <button
                        onClick={() => {}}
                        className="p-xs hover:bg-[var(--bg-surface-high)] rounded-md transition-all duration-200"
                        aria-label="Edit member"
                      >
                        <Edit className="w-4 h-4 text-[var(--text-muted)]" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(member.id)}
                        className="p-xs hover:bg-[var(--bg-surface-high)] rounded-md transition-all duration-200"
                        aria-label="Delete member"
                      >
                        <Trash2 className="w-4 h-4 text-[var(--accent-danger)]" />
                      </button>
                    </div>
                  </div>
                  {member.company && (
                    <p className="text-sm text-[var(--text-muted)] mb-xs">{member.company}</p>
                  )}
                  {member.location && (
                    <p className="text-sm text-[var(--text-muted)] mb-md">{member.location}</p>
                  )}
                  {member.trustScore !== undefined && (
                    <div className="mb-md">
                      <p className="text-xs text-[var(--text-muted)] mb-xs">Trust Score</p>
                      <div className="h-2 bg-[var(--bg-surface-high)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent-primary)]"
                          style={{ width: `${member.trustScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-xs">{member.trustScore}%</p>
                    </div>
                  )}
                  {member.sectors.length > 0 && (
                    <div className="mb-md">
                      <p className="text-xs text-[var(--text-muted)] mb-xs">Sectors</p>
                      <div className="flex flex-wrap gap-xs">
                        {member.sectors.map((sector) => (
                          <Badge key={sector} size="sm" variant="info">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {member.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-xs">Tags</p>
                      <div className="flex flex-wrap gap-xs">
                        {member.tags.map((tag) => (
                          <Badge key={tag} size="sm" variant="default">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card variant="default">
              <div className="text-center py-xl">
                <Users className="w-12 h-12 mx-auto mb-md text-[var(--text-muted)]" />
                <p className="text-[var(--text-muted)]">No network members yet</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab !== 'browser' && (
        <Card variant="default">
          <p className="text-[var(--text-muted)]">Coming soon...</p>
        </Card>
      )}
    </div>
  )
}

