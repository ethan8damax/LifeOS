'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

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
  const router = useRouter()
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
      setHouseholdId(null)
      setDisplayName(
        (currentUser.user_metadata?.display_name as string | undefined) ??
        currentUser.email?.split('@')[0] ?? null,
      )
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
    // Hard-navigate to ensure all client state is cleared
    router.push('/login')
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
