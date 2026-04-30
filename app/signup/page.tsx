'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      })
      if (authError) {
        setError(authError.message)
        return
      }
      router.push('/onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex items-center gap-[10px] mb-8">
          <div className="w-8 h-8 rounded-lg bg-goals flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-medium text-white leading-none select-none">LO</span>
          </div>
          <span className="text-[16px] font-medium text-foreground">Life OS</span>
        </div>

        {/* Card */}
        <div className="bg-background border-[0.5px] border-line-subtle rounded-xl p-6">
          <h1 className="text-[18px] font-medium text-foreground mb-1">Create account</h1>
          <p className="text-[13px] text-foreground-tertiary mb-6">Get started with Life OS.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-[12px] text-foreground-secondary">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-line focus:ring-0"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[12px] text-foreground-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-line focus:ring-0"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[12px] text-foreground-secondary">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-line focus:ring-0"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[12px] text-finance">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-goals text-white text-[13px] font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-foreground-tertiary mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground-secondary underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
