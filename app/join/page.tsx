'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { joinHousehold } from '@/lib/queries/households'

export default function JoinPage() {
  const router = useRouter()
  const [code, setCode]       = useState('')
  const [name, setName]       = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setError('You must be signed in to join a household.'); return }

      await joinHousehold(code.trim(), session.user.id, name.trim() || session.user.email?.split('@')[0] || 'User')
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid invite code.'
      setError(msg.includes('No rows') || msg.includes('PGRST116') ? 'Invite code not found.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center gap-[10px] mb-8">
          <div className="w-8 h-8 rounded-lg bg-goals flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-medium text-white leading-none select-none">LO</span>
          </div>
          <span className="text-[16px] font-medium text-foreground">Life OS</span>
        </div>

        <div className="bg-background border-[0.5px] border-line-subtle rounded-xl p-6">
          <h1 className="text-[18px] font-medium text-foreground mb-1">Join a household</h1>
          <p className="text-[13px] text-foreground-tertiary mb-6">Enter the invite code your partner shared with you.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[12px] text-foreground-secondary">Your name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-[12px] text-foreground-secondary">Invite code</label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground tracking-widest placeholder:text-foreground-tertiary placeholder:tracking-normal focus:outline-none"
                placeholder="XXXXXXXX"
                maxLength={8}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="characters"
              />
            </div>

            {error && <p className="text-[12px] text-finance" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-goals text-white text-[13px] font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Joining…' : 'Join household'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-1 mt-4">
          <p className="text-[12px] text-foreground-tertiary">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-foreground-secondary underline-offset-2 hover:underline">
              Sign up
            </Link>
          </p>
          <p className="text-[12px] text-foreground-tertiary">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground-secondary underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
