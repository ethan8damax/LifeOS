'use client'

import { usePathname } from 'next/navigation'

const AUTH_PATHS = ['/login', '/signup', '/onboarding']

export default function AppShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuth = AUTH_PATHS.some(p => pathname.startsWith(p))

  return (
    <div className="flex h-screen">
      {!isAuth && sidebar}
      <main className={`flex-1 h-screen overflow-y-auto ${isAuth ? '' : 'pb-[68px] md:pb-0'}`}>
        {children}
      </main>
    </div>
  )
}
