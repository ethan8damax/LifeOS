'use client'

import Badge  from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import HabitDots from '@/components/habits/HabitDots'
import type { DotState } from '@/components/habits/HabitDots'
import type { Habit } from '@/types'

interface HabitTrackerProps {
  habit:    Habit
  dots:     DotState[]
  today:    string
  onToggle: (habitId: string, logged: boolean) => Promise<void>
  onDelete: (habitId: string) => void
}

const FREQ_LABEL: Record<string, string> = {
  daily:    'daily',
  weekdays: 'weekdays',
  weekly:   'weekly',
}

export default function HabitTracker({
  habit,
  dots,
  today,
  onToggle,
  onDelete,
}: HabitTrackerProps) {
  const todayDot   = dots.find(d => d.date === today)
  const todayLogged = todayDot?.kind === 'today-done' || todayDot?.kind === 'done'
  const weekDone   = dots.filter(d => d.kind === 'done' || d.kind === 'today-done').length
  const freq       = habit.frequency ?? 'daily'

  return (
    <div className="group flex flex-col py-[10px] border-b-[0.5px] border-line-subtle last:border-b-0">

      {/* Row 1: name + freq + count + delete */}
      <div className="flex items-center gap-2 mb-[8px]">
        <span className="text-[13px] font-medium text-foreground flex-1">
          {habit.title}
        </span>

        {freq && (
          <Badge intent="neutral">{FREQ_LABEL[freq] ?? freq}</Badge>
        )}

        <span className="text-[11px] text-foreground-tertiary">
          {weekDone}/7
        </span>

        <button
          type="button"
          onClick={() => onDelete(habit.id)}
          aria-label="Delete habit"
          className="opacity-0 group-hover:opacity-100 ml-1 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
        >
          ×
        </button>
      </div>

      {/* Row 2: dots + toggle */}
      <div className="flex items-center gap-3">
        <HabitDots dots={dots} />

        <Button
          size="sm"
          variant={todayLogged ? 'secondary' : 'ghost'}
          intent="habits"
          onClick={() => onToggle(habit.id, todayLogged)}
        >
          {todayLogged ? '✓ Logged' : 'Log today'}
        </Button>
      </div>

    </div>
  )
}
