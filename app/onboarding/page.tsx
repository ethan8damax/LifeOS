'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/context/auth'
import { createHousehold, joinHousehold, addMemberToHousehold } from '@/lib/queries/households'

export default function OnboardingPage() {
  const router = useRouter()
  const { user, loading: authLoading, refreshHousehold } = useAuth()

  // Create household state
  const [householdName, setHouseholdName] = useState('Our Household')
  const [createDisplayName, setCreateDisplayName] = useState('')
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Join household state
  const [inviteCode, setInviteCode] = useState('')
  const [joinDisplayName, setJoinDisplayName] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setCreateError(null)
    setCreateLoading(true)

    try {
      const { id, invite_code } = await createHousehold(householdName.trim() || 'Our Household')
      await addMemberToHousehold(id, user.id, createDisplayName.trim() || (user.email?.split('@')[0] ?? 'User'))
      setCreatedInviteCode(invite_code)
      await refreshHousehold()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setJoinError(null)
    setJoinLoading(true)

    try {
      await joinHousehold(
        inviteCode.trim(),
        user.id,
        joinDisplayName.trim() || (user.email?.split('@')[0] ?? 'User'),
      )
      await refreshHousehold()
      router.push('/')
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Invalid invite code or something went wrong')
    } finally {
      setJoinLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-[13px] text-foreground-tertiary">Loading…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[720px]">
        {/* Header */}
        <div className="flex items-center gap-[10px] mb-2">
          <div className="w-8 h-8 rounded-lg bg-goals flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-medium text-white leading-none select-none">LO</span>
          </div>
          <span className="text-[16px] font-medium text-foreground">Life OS</span>
        </div>
        <h1 className="text-[22px] font-medium text-foreground mt-6 mb-1">Welcome to Life OS</h1>
        <p className="text-[14px] text-foreground-tertiary mb-8">Set up your household to get started.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create household */}
          <div className="bg-background border-[0.5px] border-line-subtle rounded-xl p-6">
            <h2 className="text-[15px] font-medium text-foreground mb-1">Create a household</h2>
            <p className="text-[12px] text-foreground-tertiary mb-5">
              Start fresh. You&apos;ll get an invite code to share.
            </p>

            {createdInviteCode ? (
              <div className="flex flex-col gap-4">
                <div className="bg-background-secondary rounded-lg p-4">
                  <p className="text-[11px] text-foreground-tertiary mb-1">Share this code with your partner</p>
                  <p className="text-[22px] font-medium text-foreground tracking-widest">{createdInviteCode}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="h-9 px-4 rounded-lg bg-goals text-white text-[13px] font-medium transition-opacity"
                >
                  Go to dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="householdName" className="text-[12px] text-foreground-secondary">
                    Household name
                  </label>
                  <input
                    id="householdName"
                    type="text"
                    value={householdName}
                    onChange={e => setHouseholdName(e.target.value)}
                    className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-line focus:ring-0"
                    placeholder="Our Household"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="createDisplayName" className="text-[12px] text-foreground-secondary">
                    Your display name
                  </label>
                  <input
                    id="createDisplayName"
                    type="text"
                    required
                    value={createDisplayName}
                    onChange={e => setCreateDisplayName(e.target.value)}
                    className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-line focus:ring-0"
                    placeholder="What should we call you?"
                  />
                </div>

                {createError && (
                  <p className="text-[12px] text-finance">{createError}</p>
                )}

                <button
                  type="submit"
                  disabled={createLoading}
                  className="h-9 px-4 rounded-lg bg-goals text-white text-[13px] font-medium disabled:opacity-50 transition-opacity"
                >
                  {createLoading ? 'Creating…' : 'Create household'}
                </button>
              </form>
            )}
          </div>

          {/* Join household */}
          <div className="bg-background border-[0.5px] border-line-subtle rounded-xl p-6">
            <h2 className="text-[15px] font-medium text-foreground mb-1">Join a household</h2>
            <p className="text-[12px] text-foreground-tertiary mb-5">
              Enter the 8-character code from your partner.
            </p>

            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="inviteCode" className="text-[12px] text-foreground-secondary">
                  Invite code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  required
                  maxLength={8}
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground tracking-widest placeholder:text-foreground-tertiary placeholder:tracking-normal focus:outline-none focus:border-line focus:ring-0"
                  placeholder="ABCD1234"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="joinDisplayName" className="text-[12px] text-foreground-secondary">
                  Your display name
                </label>
                <input
                  id="joinDisplayName"
                  type="text"
                  required
                  value={joinDisplayName}
                  onChange={e => setJoinDisplayName(e.target.value)}
                  className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-line focus:ring-0"
                  placeholder="What should we call you?"
                />
              </div>

              {joinError && (
                <p className="text-[12px] text-finance">{joinError}</p>
              )}

              <button
                type="submit"
                disabled={joinLoading}
                className="h-9 px-4 rounded-lg bg-background border-[0.5px] border-line text-foreground text-[13px] font-medium disabled:opacity-50 transition-opacity hover:bg-background-secondary"
              >
                {joinLoading ? 'Joining…' : 'Join household'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
