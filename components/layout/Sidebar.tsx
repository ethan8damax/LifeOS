'use client'

import Link        from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

// ── Icons ─────────────────────────────────────────────────────────────────────
// 16×16, stroke="currentColor", fill="none", strokeWidth=1.5

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

function IconTasks() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
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

// ── Nav config ────────────────────────────────────────────────────────────────

type Intent = 'neutral' | 'tasks' | 'habits' | 'goals' | 'finance'

const NAV = [
  { href: '/',        label: 'Dashboard', intent: 'neutral'  as Intent, icon: <IconGrid />    },
  { href: '/tasks',   label: 'Tasks',     intent: 'tasks'    as Intent, icon: <IconTasks />   },
  { href: '/habits',  label: 'Habits',    intent: 'habits'   as Intent, icon: <IconHabits />  },
  { href: '/goals',   label: 'Goals',     intent: 'goals'    as Intent, icon: <IconGoals />   },
  { href: '/finance', label: 'Finance',   intent: 'finance'  as Intent, icon: <IconFinance /> },
]

const ACTIVE: Record<Intent, string> = {
  neutral: 'bg-background       text-foreground',
  tasks:   'bg-tasks-subtle     text-tasks',
  habits:  'bg-habits-subtle    text-habits',
  goals:   'bg-goals-subtle     text-goals',
  finance: 'bg-finance-subtle   text-finance',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  function active(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-screen bg-background-secondary border-r-[0.5px] border-line-subtle">

      {/* Logo */}
      <div className="flex items-center gap-[10px] px-5 py-[18px] border-b-[0.5px] border-line-subtle">
        <div className="w-[28px] h-[28px] rounded-lg bg-goals flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-medium text-white leading-none select-none">LO</span>
        </div>
        <span className="text-[14px] font-medium text-foreground">Life OS</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-[2px]">
        {NAV.map(item => {
          const isActive = active(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-[10px] px-3 h-9 rounded-lg text-[13px] transition-colors',
                isActive
                  ? cn('font-medium', ACTIVE[item.intent])
                  : 'text-foreground-secondary hover:bg-background hover:text-foreground',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Avatar + theme toggle */}
      <div className="px-4 py-4 border-t-[0.5px] border-line-subtle">
        <div className="flex items-center gap-[10px]">
          <div className="w-7 h-7 rounded-full bg-background border-[0.5px] border-line flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] text-foreground-secondary leading-none select-none">E</span>
          </div>
          <span className="text-[12px] text-foreground-secondary truncate flex-1">ethan2damax</span>
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-tertiary hover:text-foreground hover:bg-background transition-colors flex-shrink-0"
          >
            {resolvedTheme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </div>

    </aside>
  )
}
