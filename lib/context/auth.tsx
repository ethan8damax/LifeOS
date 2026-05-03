'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { createHousehold, addMemberToHousehold } from '@/lib/queries/households'

interface AuthContextValue {
  user:             User | null
  displayName:      string | null
  householdId:      string | null
  loading:          boolean
  signOut:          () => Promise<void>
  refreshHousehold: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user:             null,
  displayName:      null,
  householdId:      null,
  loading:          true,
  signOut:          async () => {},
  refreshHousehold: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)

  async function fetchHousehold(userId: string, currentUser: User) {
    const supabase = createClient()
    const { data } = await supabase
      .from('household_members')
      .select('household_id, display_name')
      .eq('user_id', userId)
      .maybeSingle()

    if (data) {
      setHouseholdId(data.household_id)
      setDisplayName(
        data.display_name ??
        (currentUser.user_metadata?.display_name as string | undefined) ??
        currentUser.email?.split('@')[0] ?? null,
      )
    } else {
      // No household row — user confirmed email before household was created.
      // Auto-create one so the app is immediately usable.
      const name =
        (currentUser.user_metadata?.display_name as string | undefined) ??
        currentUser.email?.split('@')[0] ??
        'User'
      setDisplayName(name)
      try {
        const { id: householdId } = await createHousehold(`${name}'s household`)
        await addMemberToHousehold(householdId, userId, name)
        setHouseholdId(householdId)
      } catch {
        setHouseholdId(null)
      }
    }
  }

  const refreshHousehold = useCallback(async () => {
    if (user) await fetchHousehold(user.id, user)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        await fetchHousehold(session.user.id, session.user)
      }
      setLoading(false)
    })

    // Keep in sync with Supabase auth state (token refresh, sign-out from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        await fetchHousehold(session.user.id, session.user)
      } else {
        setUser(null)
        setDisplayName(null)
        setHouseholdId(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, displayName, householdId, loading, signOut, refreshHousehold }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
