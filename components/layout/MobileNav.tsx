'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1"/>
      <rect x="9" y="2" width="5" height="5" rx="1"/>
      <rect x="2" y="9" width="5" height="5" rx="1"/>
      <rect x="9" y="9" width="5" height="5" rx="1"/>
    </svg>
  )
}

function IconTasks() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,4.5 4,6.5 7,3"/>
      <line x1="10" y1="4.5" x2="14" y2="4.5"/>
      <line x1="2"  y1="9"   x2="14" y2="9"/>
      <line x1="2"  y1="13"  x2="11" y2="13"/>
    </svg>
  )
}

function IconHabits() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8A6 6 0 1 1 6 2.3"/>
      <polyline points="6,0.5 6,3.5 9,3.5"/>
    </svg>
  )
}

function IconGoals() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3.5" y1="1.5" x2="3.5" y2="14.5"/>
      <path d="M3.5 2.5h9l-2.5 3.5 2.5 3.5h-9"/>
    </svg>
  )
}

function IconFinance() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="8" y1="1.5" x2="8" y2="14.5"/>
      <path d="M11 4.5H6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H5"/>
    </svg>
  )
}

type Intent = 'neutral' | 'tasks' | 'habits' | 'goals' | 'finance'

const NAV = [
  { href: '/',        label: 'Dashboard', intent: 'neutral'  as Intent, icon: <IconGrid />    },
  { href: '/tasks',   label: 'Tasks',     intent: 'tasks'    as Intent, icon: <IconTasks />   },
  { href: '/habits',  label: 'Habits',    intent: 'habits'   as Intent, icon: <IconHabits />  },
  { href: '/goals',   label: 'Goals',     intent: 'goals'    as Intent, icon: <IconGoals />   },
  { href: '/finance', label: 'Finance',   intent: 'finance'  as Intent, icon: <IconFinance /> },
]

const ACTIVE_TEXT: Record<Intent, string> = {
  neutral: 'text-foreground',
  tasks:   'text-tasks',
  habits:  'text-habits',
  goals:   'text-goals',
  finance: 'text-finance',
}

const AUTH_PATHS = ['/login', '/signup', '/onboarding']

export default function MobileNav() {
  const pathname = usePathname()

  if (AUTH_PATHS.some(p => pathname.startsWith(p))) return null

  function active(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-background-secondary border-t-[0.5px] border-line-subtle flex safe-area-bottom z-50">
      {NAV.map(item => {
        const isActive = active(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-[4px] py-3 transition-colors',
              isActive
                ? cn('font-medium', ACTIVE_TEXT[item.intent])
                : 'text-foreground-tertiary',
            )}
          >
            {item.icon}
            <span className="text-[10px] leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
