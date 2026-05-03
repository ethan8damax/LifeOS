'use client'

import Badge  from '@/components/ui/Badge'
import type { Goal } from '@/types'
import { weekOfTwelve, todayStr, addDays } from '@/lib/utils'

type BadgeIntent = 'goals' | 'habits' | 'neutral'
const STATUS_INTENT: Record<string, BadgeIntent> = {
  active: 'goals',
  paused: 'neutral',
  done:   'habits',
}

interface GoalProgressProps {
  goal:     Goal
  onDelete: (id: string) => void
}

export default function GoalProgress({ goal, onDelete }: GoalProgressProps) {
  const today     = todayStr()
  const startDate = goal.start_date ?? goal.created_at?.slice(0, 10) ?? today
  const endDate   = goal.end_date   ?? addDays(startDate, 83)
  const weekNum   = weekOfTwelve(startDate, today)
  const status    = goal.status ?? 'active'

  const isPast = today > endDate

  return (
    <div className="group flex items-center gap-2 py-[10px] border-b-[0.5px] border-line-subtle last:border-b-0">
      <span className="text-[13px] font-medium text-foreground flex-1 leading-snug">
        {goal.title}
      </span>

      <span className="text-[11px] text-foreground-tertiary flex-shrink-0 tabular-nums">
        {isPast ? 'Done' : `Wk ${weekNum}/12`}
      </span>

      <Badge intent={STATUS_INTENT[status] ?? 'neutral'}>{status[0].toUpperCase() + status.slice(1)}</Badge>

      <button
        type="button"
        onClick={() => onDelete(goal.id)}
        aria-label="Delete goal"
        className="opacity-0 group-hover:opacity-100 ml-1 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
      >×</button>
    </div>
  )
}
