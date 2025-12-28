'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LoginOptions } from './types'

export interface User {
  id: string
  email: string
  role: string
  companyId: string
}

interface AuthResponse {
  user: User
  accessToken: string
}

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(false)

  // Check for token on mount and when it changes
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('accessToken')
      setHasToken(!!token)
    }
    
    checkToken()
    // Listen for storage changes (e.g., from other tabs)
    window.addEventListener('storage', checkToken)
    return () => window.removeEventListener('storage', checkToken)
  }, [])

  const { data: user } = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return null

      try {
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Auth /me error:', response.status, errorData)
          localStorage.removeItem('accessToken')
          setHasToken(false)
          return null
        }

        const data = await response.json()
        return data.data
      } catch (error) {
        console.error('Auth /me fetch error:', error)
        localStorage.removeItem('accessToken')
        setHasToken(false)
        return null
      }
    },
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Login API error:', error)
        throw new Error(error.error?.message || 'Invalid email or password')
      }

      const responseData = await response.json()
      
      // API returns { data: { user: {...}, accessToken: "..." } }
      const data = responseData.data as AuthResponse
      
      if (!data || !data.accessToken) {
        console.error('No access token in login response:', responseData)
        throw new Error('Login failed: No access token received')
      }
      
      // Store token and update state synchronously
      localStorage.setItem('accessToken', data.accessToken)
      setHasToken(true)
      // Immediately set user data to avoid query race condition
      queryClient.setQueryData(['auth', 'user'], data.user)
      
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'user'], data.user)
    },
    onError: (error) => {
      console.error('Login mutation error:', error)
      setHasToken(false)
      localStorage.removeItem('accessToken')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
      localStorage.removeItem('accessToken')
      setHasToken(false)
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'user'], null)
      router.push('/login')
    },
  })

  const login = (credentials: { email: string; password: string }, options?: LoginOptions) => {
    loginMutation.mutate(credentials, {
      onSuccess: () => {
        // User data is already set in mutation's onSuccess
        // Just trigger a refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })
        options?.onSuccess?.()
        // Small delay to ensure token is stored before navigation
        setTimeout(() => {
          router.push('/')
        }, 100)
      },
      onError: (error) => {
        console.error('Login function error:', error)
        options?.onError?.(error as Error)
      },
    })
  }

  return {
    user: user ?? null,
    isLoading: loginMutation.isPending,
    login,
    logout: logoutMutation.mutate,
  }
}

