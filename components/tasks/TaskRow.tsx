'use client'

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

// ── Component ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task:     Task
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

export default function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  const isDone = task.status === 'done'

  return (
    <div className="group flex items-center gap-[10px] py-[7px] border-b-[0.5px] border-line-subtle last:border-b-0 text-[13px]">

      {/* Checkbox — matches mockup: 16×16, 4px radius, 1.5px border */}
      <button
        type="button"
        onClick={() => onToggle(task.id, !isDone)}
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
        className={cn(
          'w-4 h-4 rounded-[4px] flex-shrink-0 border-[1.5px]',
          'flex items-center justify-center transition-colors',
          isDone
            ? 'bg-habits border-habits'
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
      </button>

      {/* Title */}
      <span className={cn(
        'flex-1 text-foreground',
        isDone && 'line-through text-foreground-tertiary',
      )}>
        {task.title}
      </span>

      {/* Due date — amber when overdue */}
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

      {/* Delete — revealed on row hover */}
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="opacity-0 group-hover:opacity-100 ml-1 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
      >
        ×
      </button>
    </div>
  )
}
