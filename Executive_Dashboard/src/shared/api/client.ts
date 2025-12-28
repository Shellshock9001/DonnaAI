const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface ApiResponse<T> {
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorMessage = 'API request failed'
      try {
        const error: ApiError = await response.json()
        errorMessage = error.error?.message || errorMessage
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || `HTTP ${response.status}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    // Ensure all errors are properly caught and re-thrown
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Unknown error occurred')
  }
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(endpoint: string, data: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
}

