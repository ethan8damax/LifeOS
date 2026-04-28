'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import type { Task } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

type BadgeIntent = 'tasks' | 'habits' | 'goals' | 'finance' | 'neutral'

function tagToIntent(tag: string): BadgeIntent {
  const t = tag.toLowerCase()
  if (['finance', 'money', 'budget'].includes(t)) return 'finance'
  if (['personal', 'health', 'fitness'].includes(t))  return 'habits'
  if (['goal', 'goals'].includes(t))                  return 'goals'
  return 'tasks'
}

function pad(n: number) { return String(n).padStart(2, '0') }

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDueDate(dateStr: string): string {
  const now = new Date()
  if (dateStr === toLocalDateStr(now)) return 'Today'
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (dateStr === toLocalDateStr(tomorrow)) return 'Tomorrow'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr: string, status: string | null): boolean {
  if (status === 'done') return false
  return dateStr < toLocalDateStr(new Date())
}

// ── Status menu config ────────────────────────────────────────────────────────

type TaskStatus = 'todo' | 'in_progress' | 'done'

const STATUS_OPTIONS: { value: TaskStatus; label: string; dot: string }[] = [
  { value: 'todo',        label: 'To do',       dot: 'bg-foreground-tertiary' },
  { value: 'in_progress', label: 'In progress', dot: 'bg-tasks' },
  { value: 'done',        label: 'Done',        dot: 'bg-habits' },
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconDots() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <circle cx="6" cy="2"  r="1.1"/>
      <circle cx="6" cy="6"  r="1.1"/>
      <circle cx="6" cy="10" r="1.1"/>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task:            Task
  onToggle:        (id: string, done: boolean) => void
  onDelete:        (id: string) => void
  onStatusChange?: (id: string, status: TaskStatus) => void
}

export default function TaskRow({ task, onToggle, onDelete, onStatusChange }: TaskRowProps) {
  const [menu,         setMenu]         = useState<{ x: number; y: number } | null>(null)
  const longPressTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDone        = task.status === 'done'
  const isInProgress  = task.status === 'in_progress'
  const currentStatus = (task.status ?? 'todo') as TaskStatus

  // Close on Escape
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu])

  function openMenu(rawX: number, rawY: number) {
    if (!onStatusChange) return
    const w = 152, h = 116
    setMenu({
      x: Math.min(rawX, window.innerWidth  - w - 8),
      y: Math.min(rawY, window.innerHeight - h - 8),
    })
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!onStatusChange) return
    e.preventDefault()
    openMenu(e.clientX, e.clientY)
  }

  function handleDotsClick(e: React.MouseEvent) {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    openMenu(rect.left, rect.bottom + 4)
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!onStatusChange) return
    const touch = e.touches[0]
    longPressTimer.current = setTimeout(() => {
      openMenu(touch.clientX, touch.clientY)
    }, 500)
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  return (
    <div
      className="group flex items-center gap-[10px] py-[7px] border-b-[0.5px] border-line-subtle last:border-b-0 text-[13px]"
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(task.id, !isDone)}
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
        className={cn(
          'w-4 h-4 rounded-[4px] flex-shrink-0 border-[1.5px]',
          'flex items-center justify-center transition-colors',
          isDone
            ? 'bg-habits border-habits'
            : isInProgress
              ? 'bg-tasks-subtle border-tasks text-tasks'
              : 'border-line hover:border-habits',
        )}
      >
        {isDone && (
          <svg viewBox="0 0 10 10" className="w-[9px] h-[9px]" aria-hidden>
            <polyline
              points="2,5 4.5,7.5 8,3"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {isInProgress && (
          <svg viewBox="0 0 10 10" className="w-[9px] h-[9px]" aria-hidden>
            <line
              x1="2" y1="5" x2="8" y2="5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {/* Title */}
      <span className={cn(
        'flex-1 text-foreground',
        isDone && 'line-through text-foreground-tertiary',
      )}>
        {task.title}
      </span>

      {/* Due date */}
      {task.due_date && (
        <span className={cn(
          'text-[11px] flex-shrink-0',
          isOverdue(task.due_date, task.status)
            ? 'text-finance'
            : 'text-foreground-tertiary',
        )}>
          {formatDueDate(task.due_date)}
        </span>
      )}

      {/* Tag badge */}
      {task.tag && (
        <Badge intent={tagToIntent(task.tag)}>{task.tag}</Badge>
      )}

      {/* Status menu trigger — only when handler provided */}
      {onStatusChange && (
        <button
          type="button"
          onClick={handleDotsClick}
          aria-label="Change status"
          className="opacity-0 group-hover:opacity-100 text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
        >
          <IconDots />
        </button>
      )}

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
      >
        ×
      </button>

      {/* Context menu */}
      {menu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[99]" onClick={() => setMenu(null)} />

          <div
            className="fixed z-[100] bg-background border-[0.5px] border-line rounded-lg py-1 min-w-[152px]"
            style={{ left: menu.x, top: menu.y }}
          >
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onStatusChange?.(task.id, opt.value)
                  setMenu(null)
                }}
                className={cn(
                  'w-full flex items-center gap-[8px] px-3 py-[7px] text-[12px] text-left transition-colors',
                  opt.value === currentStatus
                    ? 'text-foreground font-medium'
                    : 'text-foreground-secondary hover:bg-background-secondary hover:text-foreground',
                )}
              >
                <span className={cn('w-[6px] h-[6px] rounded-full flex-shrink-0', opt.dot)} />
                {opt.label}
                {opt.value === currentStatus && (
                  <span className="ml-auto text-foreground-tertiary text-[10px]">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

    </div>
  )
}
