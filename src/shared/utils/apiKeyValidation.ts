/**
 * API Key Validation Utilities
 * Tests API keys to ensure they're valid before saving/using
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

export async function validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('sk-') === false) {
    return { valid: false, error: 'Invalid format' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' }
    }
    if (response.status === 429) {
      return { valid: false, error: 'Rate limited' }
    }
    if (!response.ok) {
      return { valid: false, error: `API error: ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

export async function validatePerplexityKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('pplx-')) {
    return { valid: false, error: 'Invalid format' }
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (response.status === 401) {
      return { valid: false, error: 'Invalid API key' }
    }
    if (response.status === 429) {
      return { valid: false, error: 'Rate limited' }
    }
    if (!response.ok) {
      return { valid: false, error: `API error: ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

export async function validateGeminiKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '' || !apiKey.startsWith('AIza')) {
    return { valid: false, error: 'Invalid format' }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })

    if (response.status === 400 || response.status === 403) {
      return { valid: false, error: 'Invalid API key' }
    }
    if (!response.ok) {
      return { valid: false, error: `API error: ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

export async function validateTavilyKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'Invalid format' }
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: 'test',
        max_results: 1,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid API key' }
    }
    if (!response.ok) {
      return { valid: false, error: `API error: ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

export async function validateApolloKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'Invalid format' }
  }

  try {
    const response = await fetch('https://api.apollo.io/v1/auth/health', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid API key' }
    }
    if (!response.ok) {
      return { valid: false, error: `API error: ${response.status}` }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error' }
  }
}

