'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Button } from '@/shared/components/Button'
import { api } from '@/shared/api/client'
import { Settings as SettingsIcon, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/shared/theme'

export interface Props {
  // Settings component has no props
}

interface AISettings {
  openaiApiKey: string
  geminiApiKey: string
  perplexityApiKey: string
  tavilyApiKey: string
  apolloApiKey: string
  defaultModel: string
  openaiConfigured: boolean
  geminiConfigured: boolean
  perplexityConfigured: boolean
  tavilyConfigured: boolean
  apolloConfigured: boolean
  openaiValidated: boolean
  geminiValidated: boolean
  perplexityValidated: boolean
  tavilyValidated: boolean
  apolloValidated: boolean
}

export default function Settings(_props: Props = {}): JSX.Element {
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()

  const { data: aiSettings } = useQuery<AISettings>({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      try {
        const response = await api.get<{ data: AISettings }>('/api/v1/ai-settings')
        return response.data?.data || {
          openaiApiKey: '',
          geminiApiKey: '',
          perplexityApiKey: '',
          tavilyApiKey: '',
          apolloApiKey: '',
          defaultModel: 'gpt-4-turbo',
          openaiConfigured: false,
          geminiConfigured: false,
          perplexityConfigured: false,
          tavilyConfigured: false,
          apolloConfigured: false,
          openaiValidated: false,
          geminiValidated: false,
          perplexityValidated: false,
          tavilyValidated: false,
          apolloValidated: false,
        }
      } catch (error) {
        console.error('Failed to fetch AI settings:', error)
        // Return default empty settings instead of undefined
        return {
          openaiApiKey: '',
          geminiApiKey: '',
          perplexityApiKey: '',
          tavilyApiKey: '',
          apolloApiKey: '',
          defaultModel: 'gpt-4-turbo',
          openaiConfigured: false,
          geminiConfigured: false,
          perplexityConfigured: false,
          tavilyConfigured: false,
          apolloConfigured: false,
          openaiValidated: false,
          geminiValidated: false,
          perplexityValidated: false,
          tavilyValidated: false,
          apolloValidated: false,
        }
      }
    },
  })

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: '',
    perplexity: '',
    tavily: '',
    apollo: '',
  })

  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    perplexity: false,
    tavily: false,
    apollo: false,
  })

  const saveMutation = useMutation({
    mutationFn: async (settings: { openai: string; gemini: string; perplexity: string; tavily: string; apollo: string }) => {
      await api.post('/api/v1/ai-settings', {
        openaiApiKey: settings.openai || undefined,
        geminiApiKey: settings.gemini || undefined,
        perplexityApiKey: settings.perplexity || undefined,
        tavilyApiKey: settings.tavily || undefined,
        apolloApiKey: settings.apollo || undefined,
      })
    },
    onSuccess: async () => {
      // Invalidate and refetch to get updated masked values
      await queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      // The useEffect will automatically update apiKeys when aiSettings refreshes
    },
  })

  // Load API keys from settings when available (masked values)
  useEffect(() => {
    if (aiSettings) {
      // Always show masked values from server when they exist
      // These come pre-masked from the API (e.g., "sk-****...abcd")
      setApiKeys({
        openai: aiSettings.openaiApiKey || '',
        gemini: aiSettings.geminiApiKey || '',
        perplexity: aiSettings.perplexityApiKey || '',
        tavily: aiSettings.tavilyApiKey || '',
        apollo: aiSettings.apolloApiKey || '',
      })
    }
  }, [aiSettings])

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-xl">Settings</h1>
      </div>

      <Card variant="default">
        <div className="flex items-center gap-md mb-md">
          <SettingsIcon className="w-6 h-6 text-[var(--accent-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">AI Settings</h2>
        </div>
        <form autoComplete="off" data-form-type="other" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-md">
          <div>
            <label className="block text-sm font-medium mb-sm text-[var(--text-primary)]">
              OpenAI API Key
              {aiSettings?.openaiConfigured && (
                <span className={`ml-sm text-xs ${aiSettings.openaiValidated ? 'text-[var(--accent-success)]' : 'text-[var(--accent-warning)]'}`}>
                  {aiSettings.openaiValidated ? '✓ Validated' : '⚠ Not validated'}
                </span>
              )}
              {!aiSettings?.openaiConfigured && (
                <span className="ml-sm text-xs text-[var(--text-muted)]">Not configured</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                placeholder={aiSettings?.openaiConfigured ? "••••••••••••••••••••••••" : "sk-... (enter your API key)"}
                disabled={saveMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                name="openai-api-key"
                id="openai-api-key"
                className="w-full pl-md pr-xl py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                className="absolute right-md top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={showKeys.openai ? 'Hide API key' : 'Show API key'}
              >
                {showKeys.openai ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-sm text-[var(--text-primary)]">
              Gemini API Key
              {aiSettings?.geminiConfigured && (
                <span className={`ml-sm text-xs ${aiSettings.geminiValidated ? 'text-[var(--accent-success)]' : 'text-[var(--accent-warning)]'}`}>
                  {aiSettings.geminiValidated ? '✓ Validated' : '⚠ Not validated'}
                </span>
              )}
              {!aiSettings?.geminiConfigured && (
                <span className="ml-sm text-xs text-[var(--text-muted)]">Not configured</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.gemini ? 'text' : 'password'}
                value={apiKeys.gemini}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                placeholder={aiSettings?.geminiConfigured ? "••••••••••••••••••••••••" : "AIza... (enter your API key)"}
                disabled={saveMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                name="gemini-api-key"
                id="gemini-api-key"
                className="w-full pl-md pr-xl py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys.gemini })}
                className="absolute right-md top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={showKeys.gemini ? 'Hide API key' : 'Show API key'}
              >
                {showKeys.gemini ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-sm text-[var(--text-primary)]">
              Perplexity API Key
              {aiSettings?.perplexityConfigured && (
                <span className={`ml-sm text-xs ${aiSettings.perplexityValidated ? 'text-[var(--accent-success)]' : 'text-[var(--accent-warning)]'}`}>
                  {aiSettings.perplexityValidated ? '✓ Validated' : '⚠ Not validated'}
                </span>
              )}
              {!aiSettings?.perplexityConfigured && (
                <span className="ml-sm text-xs text-[var(--text-muted)]">Not configured</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.perplexity ? 'text' : 'password'}
                value={apiKeys.perplexity}
                onChange={(e) => setApiKeys({ ...apiKeys, perplexity: e.target.value })}
                placeholder={aiSettings?.perplexityConfigured ? "••••••••••••••••••••••••" : "pplx-... (enter your API key)"}
                disabled={saveMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                name="perplexity-api-key"
                id="perplexity-api-key"
                className="w-full pl-md pr-xl py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, perplexity: !showKeys.perplexity })}
                className="absolute right-md top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={showKeys.perplexity ? 'Hide API key' : 'Show API key'}
              >
                {showKeys.perplexity ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-sm text-[var(--text-primary)]">
              Tavily API Key
              {aiSettings?.tavilyConfigured && (
                <span className={`ml-sm text-xs ${aiSettings.tavilyValidated ? 'text-[var(--accent-success)]' : 'text-[var(--accent-warning)]'}`}>
                  {aiSettings.tavilyValidated ? '✓ Validated' : '⚠ Not validated'}
                </span>
              )}
              {!aiSettings?.tavilyConfigured && (
                <span className="ml-sm text-xs text-[var(--text-muted)]">Not configured</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.tavily ? 'text' : 'password'}
                value={apiKeys.tavily}
                onChange={(e) => setApiKeys({ ...apiKeys, tavily: e.target.value })}
                placeholder={aiSettings?.tavilyConfigured ? "••••••••••••••••••••••••" : "tvly-... (enter your API key)"}
                disabled={saveMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                name="tavily-api-key"
                id="tavily-api-key"
                className="w-full pl-md pr-xl py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, tavily: !showKeys.tavily })}
                className="absolute right-md top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={showKeys.tavily ? 'Hide API key' : 'Show API key'}
              >
                {showKeys.tavily ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-xs text-xs text-[var(--text-muted)]">
              Tavily provides structured, research-focused web search with high-quality answers. Best for company intelligence and enterprise research.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-sm text-[var(--text-primary)]">
              Apollo.io API Key
              {aiSettings?.apolloConfigured && (
                <span className={`ml-sm text-xs ${aiSettings.apolloValidated ? 'text-[var(--accent-success)]' : 'text-[var(--accent-warning)]'}`}>
                  {aiSettings.apolloValidated ? '✓ Validated' : '⚠ Not validated'}
                </span>
              )}
              {!aiSettings?.apolloConfigured && (
                <span className="ml-sm text-xs text-[var(--text-muted)]">Not configured</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKeys.apollo ? 'text' : 'password'}
                value={apiKeys.apollo}
                onChange={(e) => setApiKeys({ ...apiKeys, apollo: e.target.value })}
                placeholder={aiSettings?.apolloConfigured ? "••••••••••••••••••••••••" : "Apollo API key (enter your API key)"}
                disabled={saveMutation.isPending}
                autoComplete="off"
                data-form-type="other"
                data-lpignore="true"
                name="apollo-api-key"
                id="apollo-api-key"
                className="w-full pl-md pr-xl py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowKeys({ ...showKeys, apollo: !showKeys.apollo })}
                className="absolute right-md top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={showKeys.apollo ? 'Hide API key' : 'Show API key'}
              >
                {showKeys.apollo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <Button
            onClick={() => saveMutation.mutate(apiKeys)}
            disabled={saveMutation.isPending}
            variant="primary"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save API Keys'}
          </Button>
          
          {saveMutation.isSuccess && (
            <div className="p-md bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20 rounded-md">
              <p className="text-sm text-[var(--accent-success)]">✓ API keys saved successfully</p>
            </div>
          )}
          
          {saveMutation.isError && (
            <div className="p-md bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/20 rounded-md">
              <p className="text-sm text-[var(--accent-danger)]">
                ✗ Failed to save API keys: {saveMutation.error instanceof Error ? saveMutation.error.message : 'Unknown error'}
              </p>
            </div>
          )}
        </div>
        </form>
      </Card>

      <Card variant="default">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Theme</h2>
        <div className="flex gap-md">
          <button
            onClick={() => setTheme('calm-bento')}
            className={`px-md py-sm rounded-md border transition-all duration-200 ${
              theme === 'calm-bento'
                ? 'border-[var(--border-strong)] bg-[var(--bg-surface-high)]'
                : 'border-[var(--border-subtle)] hover:bg-[var(--bg-surface-high)]'
            }`}
          >
            Calm Bento
          </button>
          <button
            onClick={() => setTheme('light-minimal')}
            className={`px-md py-sm rounded-md border transition-all duration-200 ${
              theme === 'light-minimal'
                ? 'border-[var(--border-strong)] bg-[var(--bg-surface-high)]'
                : 'border-[var(--border-subtle)] hover:bg-[var(--bg-surface-high)]'
            }`}
          >
            Light Minimal
          </button>
          <button
            onClick={() => setTheme('cyber-bento')}
            className={`px-md py-sm rounded-md border transition-all duration-200 ${
              theme === 'cyber-bento'
                ? 'border-[var(--border-strong)] bg-[var(--bg-surface-high)]'
                : 'border-[var(--border-subtle)] hover:bg-[var(--bg-surface-high)]'
            }`}
          >
            Cyber Bento
          </button>
        </div>
      </Card>
    </div>
  )
}

