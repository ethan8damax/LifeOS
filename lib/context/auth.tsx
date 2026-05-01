'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  displayName: string | null
  householdId: string | null
  loading: boolean
  signOut: () => Promise<void>
  refreshHousehold: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  displayName: null,
  householdId: null,
  loading: true,
  signOut: async () => {},
  refreshHousehold: async () => {},
})

const PUBLIC_PATHS = ['/login', '/signup']
const ONBOARDING_PATH = '/onboarding'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchHousehold = useCallback(async (userId: string, currentUser: User) => {
    const { data, error } = await supabase
      .from('household_members')
      .select('household_id, display_name')
      .eq('user_id', userId)
      .maybeSingle()

    if (!error && data) {
      setHouseholdId(data.household_id)
      const name =
        data.display_name ??
        (currentUser.user_metadata?.display_name as string | undefined) ??
        (currentUser.email?.split('@')[0] ?? null)
      setDisplayName(name)
    } else {
      setHouseholdId(null)
      const name =
        (currentUser.user_metadata?.display_name as string | undefined) ??
        (currentUser.email?.split('@')[0] ?? null)
      setDisplayName(name)
    }
  }, [supabase])

  const refreshHousehold = useCallback(async () => {
    if (!user) return
    await fetchHousehold(user.id, user)
  }, [user, fetchHousehold])

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await fetchHousehold(session.user.id, session.user)
      }
      setLoading(false)
    }

    init()

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

  // Client-side redirect logic
  useEffect(() => {
    if (loading) return

    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
    const isOnboarding = pathname.startsWith(ONBOARDING_PATH)

    if (!user && !isPublic) {
      router.replace('/login')
      return
    }

    if (user && !householdId && !isOnboarding && !isPublic) {
      router.replace('/onboarding')
      return
    }

    // Redirect away from public auth pages once signed in
    if (user && householdId && isPublic) {
      router.replace('/')
      return
    }

    // Redirect away from onboarding if household is already set
    // (handles "Go to dashboard" race and direct URL access)
    if (user && householdId && isOnboarding) {
      router.replace('/')
      return
    }
  }, [loading, user, householdId, pathname, router])

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setDisplayName(null)
    setHouseholdId(null)
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
