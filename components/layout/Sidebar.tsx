'use client'

import { useState, useEffect } from 'react'
import Link        from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/context/auth'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1"/>
      <rect x="9" y="2" width="5" height="5" rx="1"/>
      <rect x="2" y="9" width="5" height="5" rx="1"/>
      <rect x="9" y="9" width="5" height="5" rx="1"/>
    </svg>
  )
}

function IconLists() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="4" height="4" rx="1"/>
      <rect x="2" y="10" width="4" height="4" rx="1"/>
      <line x1="9" y1="4" x2="14" y2="4"/>
      <line x1="9" y1="12" x2="14" y2="12"/>
      <line x1="9" y1="7"  x2="14" y2="7"/>
    </svg>
  )
}

function IconHabits() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 8A6 6 0 1 1 6 2.3"/>
      <polyline points="6,0.5 6,3.5 9,3.5"/>
    </svg>
  )
}

function IconGoals() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3.5" y1="1.5" x2="3.5" y2="14.5"/>
      <path d="M3.5 2.5h9l-2.5 3.5 2.5 3.5h-9"/>
    </svg>
  )
}

function IconFinance() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="8" y1="1.5" x2="8" y2="14.5"/>
      <path d="M11 4.5H6.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H5"/>
    </svg>
  )
}

function IconSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3"/>
      <line x1="8" y1="1"   x2="8"   y2="2.5"/>
      <line x1="8" y1="13.5" x2="8" y2="15"/>
      <line x1="1"   y1="8" x2="2.5" y2="8"/>
      <line x1="13.5" y1="8" x2="15" y2="8"/>
      <line x1="3.05" y1="3.05" x2="4.11" y2="4.11"/>
      <line x1="11.89" y1="11.89" x2="12.95" y2="12.95"/>
      <line x1="12.95" y1="3.05" x2="11.89" y2="4.11"/>
      <line x1="4.11"  y1="11.89" x2="3.05" y2="12.95"/>
    </svg>
  )
}

function IconMoon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z"/>
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="10,3 5,8 10,13"/>
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,3 11,8 6,13"/>
    </svg>
  )
}

function IconSignOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>
      <polyline points="10,5 13,8 10,11"/>
      <line x1="13" y1="8" x2="6" y2="8"/>
    </svg>
  )
}

// ── Nav config ────────────────────────────────────────────────────────────────

type Intent = 'neutral' | 'lists' | 'habits' | 'goals' | 'finance'

const NAV = [
  { href: '/',        label: 'Dashboard', intent: 'neutral'  as Intent, icon: <IconGrid />    },
  { href: '/lists',   label: 'Lists',     intent: 'lists'    as Intent, icon: <IconLists />   },
  { href: '/habits',  label: 'Habits',    intent: 'habits'   as Intent, icon: <IconHabits />  },
  { href: '/goals',   label: 'Goals',     intent: 'goals'    as Intent, icon: <IconGoals />   },
  { href: '/finance', label: 'Finance',   intent: 'finance'  as Intent, icon: <IconFinance /> },
]

const ACTIVE: Record<Intent, string> = {
  neutral: 'bg-background       text-foreground',
  lists:   'bg-lists-subtle     text-lists',
  habits:  'bg-habits-subtle    text-habits',
  goals:   'bg-goals-subtle     text-goals',
  finance: 'bg-finance-subtle   text-finance',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { displayName, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved === 'true') setCollapsed(true)
    } catch {}
  }, [])

  function toggle() {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  function active(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  const initial = (displayName?.[0] ?? 'U').toUpperCase()
  const nameLabel = displayName ?? 'User'

  return (
    <aside className={cn(
      'hidden md:flex flex-col flex-shrink-0 h-screen bg-background-secondary border-r-[0.5px] border-line-subtle transition-[width] duration-200 overflow-hidden',
      collapsed ? 'w-14' : 'w-[220px]',
    )}>

      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex items-center border-b-[0.5px] border-line-subtle flex-shrink-0',
        collapsed ? 'justify-center px-0 h-[57px]' : 'gap-[10px] px-5 h-[57px]',
      )}>
        <div className="w-[28px] h-[28px] rounded-lg bg-goals flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-medium text-white leading-none select-none">LO</span>
        </div>
        {!collapsed && (
          <>
            <span className="text-[14px] font-medium text-foreground flex-1 whitespace-nowrap">Life OS</span>
            <button
              type="button"
              aria-label="Collapse sidebar"
              onClick={toggle}
              className="w-6 h-6 rounded-md flex items-center justify-center text-foreground-tertiary hover:text-foreground hover:bg-background transition-colors flex-shrink-0"
            >
              <IconChevronLeft />
            </button>
          </>
        )}
        {collapsed && (
          <button
            type="button"
            aria-label="Expand sidebar"
            onClick={toggle}
            className="absolute left-0 w-14 h-[57px] flex items-center justify-center text-transparent hover:text-foreground-tertiary transition-colors"
          >
            <IconChevronRight />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className={cn(
        'flex-1 py-4 flex flex-col gap-[2px]',
        collapsed ? 'px-2' : 'px-3',
      )}>
        {NAV.map(item => {
          const isActive = active(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center h-9 rounded-lg text-[13px] transition-colors',
                collapsed ? 'justify-center' : 'gap-[10px] px-3',
                isActive
                  ? cn('font-medium', ACTIVE[item.intent])
                  : 'text-foreground-secondary hover:bg-background hover:text-foreground',
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Avatar + theme toggle + sign out */}
      <div className={cn(
        'border-t-[0.5px] border-line-subtle flex-shrink-0',
        collapsed ? 'px-2 py-4 flex flex-col items-center gap-3' : 'px-4 py-4',
      )}>
        {collapsed ? (
          <>
            <div className="w-7 h-7 rounded-full bg-background border-[0.5px] border-line flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] text-foreground-secondary leading-none select-none">{initial}</span>
            </div>
            {mounted && (
              <button
                type="button"
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-tertiary hover:text-foreground hover:bg-background transition-colors"
              >
                {resolvedTheme === 'dark' ? <IconSun /> : <IconMoon />}
              </button>
            )}
            <button
              type="button"
              aria-label="Sign out"
              onClick={signOut}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-tertiary hover:text-foreground hover:bg-background transition-colors"
            >
              <IconSignOut />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-[10px]">
            <div className="w-7 h-7 rounded-full bg-background border-[0.5px] border-line flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] text-foreground-secondary leading-none select-none">{initial}</span>
            </div>
            <span className="text-[12px] text-foreground-secondary truncate flex-1">{nameLabel}</span>
            {mounted && (
              <button
                type="button"
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-tertiary hover:text-foreground hover:bg-background transition-colors flex-shrink-0"
              >
                {resolvedTheme === 'dark' ? <IconSun /> : <IconMoon />}
              </button>
            )}
            <button
              type="button"
              aria-label="Sign out"
              onClick={signOut}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-tertiary hover:text-foreground hover:bg-background transition-colors flex-shrink-0"
            >
              <IconSignOut />
            </button>
          </div>
        )}
      </div>

    </aside>
  )
}
