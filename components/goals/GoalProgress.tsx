'use client'

import { useState } from 'react'
import Badge       from '@/components/ui/Badge'
import ProgressBar from '@/components/ui/ProgressBar'
import type { Goal } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTargetDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  })
}

type BadgeIntent = 'goals' | 'habits' | 'neutral'

const STATUS_INTENT: Record<string, BadgeIntent> = {
  active: 'goals',
  paused: 'neutral',
  done:   'habits',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface GoalProgressProps {
  goal:     Goal
  onUpdate: (id: string, progress: number) => Promise<void>
  onDelete: (id: string) => void
}

export default function GoalProgress({ goal, onUpdate, onDelete }: GoalProgressProps) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')

  const progress = goal.progress ?? 0
  const status   = goal.status   ?? 'active'

  function startEdit() {
    setDraft(String(progress))
    setEditing(true)
  }

  function commitEdit() {
    const val = Math.min(100, Math.max(0, parseInt(draft, 10) || 0))
    setEditing(false)
    if (val !== progress) onUpdate(goal.id, val)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  commitEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div className="group flex flex-col py-[12px] border-b-[0.5px] border-line-subtle last:border-b-0 gap-[8px]">

      {/* Row 1: title + status + date + delete */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-foreground flex-1 leading-snug">
          {goal.title}
        </span>

        <Badge intent={STATUS_INTENT[status] ?? 'neutral'}>{status}</Badge>

        {goal.target_date && (
          <span className="text-[11px] text-foreground-tertiary flex-shrink-0">
            {formatTargetDate(goal.target_date)}
          </span>
        )}

        <button
          type="button"
          onClick={() => onDelete(goal.id)}
          aria-label="Delete goal"
          className="opacity-0 group-hover:opacity-100 ml-1 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
        >
          ×
        </button>
      </div>

      {/* Row 2: progress bar + editable percentage */}
      <div className="flex items-center gap-2">
        <ProgressBar value={progress} intent="goals" className="flex-1" />

        {editing ? (
          <input
            type="number"
            min={0}
            max={100}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            autoFocus
            className={
              'w-[48px] h-[22px] px-1 rounded text-[11px] text-center ' +
              'border-[0.5px] border-goals bg-background text-foreground ' +
              'focus:outline-none focus:border-[1px]'
            }
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            title="Click to set progress"
            className="w-[32px] text-right text-[11px] text-foreground-tertiary hover:text-foreground-secondary flex-shrink-0 transition-colors"
          >
            {progress}%
          </button>
        )}
      </div>

      {/* Row 3: description (optional) */}
      {goal.description && (
        <p className="text-[12px] text-foreground-secondary leading-snug">
          {goal.description}
        </p>
      )}

    </div>
  )
}
