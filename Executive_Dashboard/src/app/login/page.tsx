'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/auth'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { AlertCircle, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState('admin1@kcccapital.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  // Detect browser autofill after a delay
  useEffect(() => {
    const checkAutofill = () => {
      if (emailInputRef.current && emailInputRef.current.value !== email) {
        setEmail(emailInputRef.current.value)
      }
      if (passwordInputRef.current && passwordInputRef.current.value !== password) {
        setPassword(passwordInputRef.current.value)
      }
    }

    // Check immediately and after delays (browser autofill happens asynchronously)
    checkAutofill()
    const timeout1 = setTimeout(checkAutofill, 100)
    const timeout2 = setTimeout(checkAutofill, 500)
    const timeout3 = setTimeout(checkAutofill, 1000)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
    }
  }, []) // Run once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Read actual input values (in case browser autofill didn't trigger onChange)
    const actualEmail = emailInputRef.current?.value || email
    const actualPassword = passwordInputRef.current?.value || password

    // Update state if different (browser autofill case)
    if (actualEmail !== email) {
      setEmail(actualEmail)
    }
    if (actualPassword !== password) {
      setPassword(actualPassword)
    }

    // Use actual values for validation and login
    const emailValue = actualEmail.trim()
    const passwordValue = actualPassword

    // Debug logging
    console.log('Form submitted with:', { 
      email: emailValue, 
      passwordLength: passwordValue.length,
      fromState: { email, passwordLength: password.length },
      fromInputs: { email: actualEmail, passwordLength: actualPassword.length }
    })

    try {
      // Basic validation
      if (!emailValue) {
        setError('Please enter your email address')
        setIsLoading(false)
        return
      }

      if (!passwordValue || !passwordValue.trim()) {
        setError('Please enter your password')
        setIsLoading(false)
        return
      }

      if (!emailValue.includes('@')) {
        setError('Please enter a valid email address')
        setIsLoading(false)
        return
      }

      if (passwordValue.length < 8) {
        setError('Password must be at least 8 characters')
        setIsLoading(false)
        return
      }

      console.log('Attempting login with:', { email: emailValue, passwordLength: passwordValue.length })

      // Attempt login
      await new Promise<void>((resolve, reject) => {
        login(
          { email: emailValue, password: passwordValue },
          {
            onSuccess: () => {
              resolve()
            },
            onError: (err: Error) => {
              reject(err)
            },
          }
        )
      })

      // Success - redirect handled by useAuth
      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Invalid email or password')
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-page)] p-md">
      <div className="w-full max-w-md">
        <div className="text-center mb-xl">
          <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-xs">
            Donna AI
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Executive Dashboard - KCC Capital Partners
          </p>
        </div>

        <Card variant="default" className="p-xl">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-md">
            Sign In
          </h2>

          {error && (
            <div className="mb-md p-md bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/20 rounded-md flex items-start gap-sm">
              <AlertCircle className="w-5 h-5 text-[var(--accent-danger)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--accent-danger)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-md">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-sm text-[var(--text-primary)]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-md top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  onInput={(e) => {
                    // Catch browser autofill
                    const value = (e.target as HTMLInputElement).value
                    if (value !== email) {
                      setEmail(value)
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={isLoading}
                  className="w-full pl-xl pr-md py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  placeholder="admin1@kcccapital.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-sm text-[var(--text-primary)]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-md top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  ref={passwordInputRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    const newPassword = e.target.value
                    console.log('Password input changed, length:', newPassword.length)
                    setPassword(newPassword)
                    setError(null)
                  }}
                  onInput={(e) => {
                    // Catch browser autofill
                    const value = (e.target as HTMLInputElement).value
                    if (value !== password) {
                      console.log('Password autofill detected, length:', value.length)
                      setPassword(value)
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleSubmit(e as any)
                    }
                  }}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full pl-xl pr-xl py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-md top-1/2 transform -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email?.trim() || !password?.trim()}
              className="w-full"
              variant="primary"
              onClick={() => {
                // Debug button click
                console.log('Sign In button clicked', { 
                  email: email?.trim(), 
                  passwordLength: password?.trim().length,
                  isLoading,
                  disabled: isLoading || !email?.trim() || !password?.trim()
                })
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-sm animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-xl pt-xl border-t border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-muted)] text-center mb-sm">
              Demo Accounts Available:
            </p>
            <div className="text-xs text-[var(--text-muted)] space-y-xs">
              <p><strong>Admin:</strong> admin1@kcccapital.com</p>
              <p className="text-[var(--text-muted)]/70 ml-md">Password: Admin1@KCC2024!Secure</p>
              <p><strong>Manager:</strong> manager1@kcccapital.com</p>
              <p className="text-[var(--text-muted)]/70 ml-md">Password: Manager1@KCC2024!</p>
              <p><strong>User:</strong> user1@kcccapital.com</p>
              <p className="text-[var(--text-muted)]/70 ml-md">Password: User1@KCC2024!</p>
            </div>
          </div>
        </Card>

        <p className="text-xs text-center text-[var(--text-muted)] mt-md">
          Secure authentication powered by JWT
        </p>
      </div>
    </div>
  )
}
