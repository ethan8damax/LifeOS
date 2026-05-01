'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createHousehold, addMemberToHousehold } from '@/lib/queries/households'

type AccountType = 'individual' | 'household'
type Step = 'form' | 'invite' | 'confirm-email'

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [accountType, setAccountType] = useState<AccountType>('individual')
  const [error, setError]             = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [step, setStep]               = useState<Step>('form')
  const [inviteCode, setInviteCode]   = useState('')
  const [copied, setCopied]           = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      })

      if (authError) { setError(authError.message); return }

      if (!data.session) {
        setStep('confirm-email')
        return
      }

      const userId = data.session.user.id
      const { id: householdId, invite_code } = await createHousehold(
        accountType === 'individual' ? `${displayName}'s household` : `${displayName}'s household`,
      )
      await addMemberToHousehold(householdId, userId, displayName)

      if (accountType === 'individual') {
        router.push('/')
        router.refresh()
      } else {
        setInviteCode(invite_code)
        setStep('invite')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'confirm-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-[360px]">
          <Logo />
          <div className="bg-background border-[0.5px] border-line-subtle rounded-xl p-6">
            <h1 className="text-[18px] font-medium text-foreground mb-2">Check your email</h1>
            <p className="text-[13px] text-foreground-secondary leading-relaxed">
              We sent a confirmation link to <span className="text-foreground">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
            <Link
              href="/login"
              className="mt-5 flex h-9 items-center justify-center rounded-lg bg-goals px-4 text-[13px] font-medium text-white"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'invite') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-[360px]">
          <Logo />
          <div className="bg-background border-[0.5px] border-line-subtle rounded-xl p-6">
            <h1 className="text-[18px] font-medium text-foreground mb-1">Your invite code</h1>
            <p className="text-[13px] text-foreground-tertiary mb-6">
              Share this with your household partner so they can join.
            </p>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-background-secondary border-[0.5px] border-line px-4 py-3 mb-6">
              <span className="text-[22px] font-medium tracking-widest text-foreground select-all">
                {inviteCode}
              </span>
              <button
                onClick={handleCopy}
                className="text-[12px] text-foreground-secondary hover:text-foreground transition-colors shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button
              onClick={() => { router.push('/'); router.refresh() }}
              className="w-full h-9 rounded-lg bg-goals text-white text-[13px] font-medium"
            >
              Continue to app
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[360px]">
        <Logo />

        <div className="bg-background border-[0.5px] border-line-subtle rounded-xl p-6">
          <h1 className="text-[18px] font-medium text-foreground mb-1">Create account</h1>
          <p className="text-[13px] text-foreground-tertiary mb-6">Get started with Life OS.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-[12px] text-foreground-secondary">Name</label>
              <input
                id="displayName"
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[12px] text-foreground-secondary">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[12px] text-foreground-secondary">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {/* Account type */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-foreground-secondary">Account type</span>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'individual', label: 'Individual', sub: 'Just me, I\'ll use this solo' },
                  { value: 'household',  label: 'Household',  sub: 'My partner and I will share finances' },
                ] as { value: AccountType; label: string; sub: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccountType(opt.value)}
                    className={[
                      'flex flex-col items-start gap-0.5 rounded-lg border-[0.5px] p-3 text-left transition-colors',
                      accountType === opt.value
                        ? 'border-goals bg-goals/8 text-foreground'
                        : 'border-line bg-background-secondary text-foreground-secondary hover:border-line-subtle',
                    ].join(' ')}
                  >
                    <span className="text-[12px] font-medium">{opt.label}</span>
                    <span className="text-[11px] text-foreground-tertiary leading-snug">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-[12px] text-finance" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 rounded-lg bg-goals text-white text-[13px] font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-1 mt-4">
          <p className="text-[12px] text-foreground-tertiary">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground-secondary underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-[12px] text-foreground-tertiary">
            Have an invite code?{' '}
            <Link href="/join" className="text-foreground-secondary underline-offset-2 hover:underline">
              Join a household
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="flex items-center gap-[10px] mb-8">
      <div className="w-8 h-8 rounded-lg bg-goals flex items-center justify-center flex-shrink-0">
        <span className="text-[12px] font-medium text-white leading-none select-none">LO</span>
      </div>
      <span className="text-[16px] font-medium text-foreground">Life OS</span>
    </div>
  )
}
