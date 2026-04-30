'use client'

import { useState } from 'react'
import type { Goal, Habit, Task } from '@/types'
import Badge       from '@/components/ui/Badge'
import { cn, datesInRange, countHabitDaysInDates, weekOfTwelve, addDays } from '@/lib/utils'

// ── Scoring helpers ───────────────────────────────────────────────────────────

const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

function avg(parts: (number | null)[]): number | null {
  const valid = parts.filter((p): p is number => p !== null)
  return valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b) / valid.length) : null
}

function pct(num: number, den: number): number | null {
  return den > 0 ? Math.round((num / den) * 100) : null
}

function calcScores(
  tactics:          Task[],
  linkedHabits:     Habit[],
  habitLogsByHabit: Map<string, Set<string>>,
  weekDates:        string[],
  startDate:        string,
  endDate:          string,
  today:            string,
) {
  const periodEnd = today < endDate ? today : endDate

  // Tactic completion — same numerator/denominator for both time horizons
  const tacticTotal = tactics.length
  const tacticDone  = tactics.filter(t => t.status === 'done').length
  const tacticScore = pct(tacticDone, tacticTotal)

  // Weekly habit score
  let weekExp = 0, weekLog = 0
  for (const h of linkedHabits) {
    weekExp += countHabitDaysInDates(h.days, weekDates)
    weekLog += weekDates.filter(d => habitLogsByHabit.get(h.id)?.has(d)).length
  }
  const weekHabitScore = pct(weekLog, weekExp)

  // 12-week habit score
  const allDates = datesInRange(startDate, periodEnd)
  let periodExp = 0, periodLog = 0
  for (const h of linkedHabits) {
    periodExp += countHabitDaysInDates(h.days, allDates)
    const logSet = habitLogsByHabit.get(h.id) ?? new Set<string>()
    periodLog += allDates.filter(d => logSet.has(d)).length
  }
  const overallHabitScore = pct(periodLog, periodExp)

  return {
    weeklyScore:  avg([tacticScore, weekHabitScore]),
    overallScore: avg([tacticScore, overallHabitScore]),
    tacticDone,
    tacticTotal,
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type BadgeIntent = 'goals' | 'habits' | 'neutral'
const STATUS_INTENT: Record<string, BadgeIntent> = {
  active: 'goals',
  paused: 'neutral',
  done:   'habits',
}

export interface GoalCardProps {
  goal:             Goal
  tactics:          Task[]
  linkedHabits:     Habit[]
  habitLogsByHabit: Map<string, Set<string>>
  allHabits:        Habit[]
  today:            string
  weekDates:        string[]
  onDelete:         (goalId: string) => void
  onToggleTactic:   (taskId: string, done: boolean) => Promise<void>
  onAddTactic:      (goalId: string, title: string) => Promise<Task>
  onLinkHabit:      (goalId: string, habitId: string) => Promise<void>
  onUnlinkHabit:    (goalId: string, habitId: string) => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GoalCard({
  goal, tactics, linkedHabits, habitLogsByHabit,
  allHabits, today, weekDates,
  onDelete, onToggleTactic, onAddTactic, onLinkHabit, onUnlinkHabit,
}: GoalCardProps) {
  const [newTactic,       setNewTactic]       = useState('')
  const [addingTactic,    setAddingTactic]     = useState(false)
  const [showHabitPicker, setShowHabitPicker] = useState(false)

  const todayKey  = JS_DAY_TO_KEY[new Date().getDay()]
  const startDate = goal.start_date ?? goal.created_at?.slice(0, 10) ?? today
  const endDate   = goal.end_date   ?? addDays(startDate, 83)
  const weekNum   = weekOfTwelve(startDate, today)

  const { weeklyScore, overallScore, tacticDone, tacticTotal } = calcScores(
    tactics, linkedHabits, habitLogsByHabit, weekDates, startDate, endDate, today,
  )

  const linkedHabitIds  = new Set(linkedHabits.map(h => h.id))
  const availableHabits = allHabits.filter(h => !linkedHabitIds.has(h.id))

  async function handleAddTactic(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTactic.trim()
    if (!trimmed || addingTactic) return
    setAddingTactic(true)
    try {
      await onAddTactic(goal.id, trimmed)
      setNewTactic('')
    } finally {
      setAddingTactic(false)
    }
  }

  const inputBase =
    'h-7 px-2 w-full rounded-lg border-[0.5px] border-line bg-transparent ' +
    'text-[12px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-goals transition-colors disabled:opacity-50'

  return (
    <div className="group/card py-5 border-b-[0.5px] border-line-subtle last:border-b-0">

      {/* ── Header ── */}
      <div className="flex items-start gap-2 mb-1">
        <span className="text-[14px] font-medium text-foreground flex-1 leading-snug">
          {goal.title}
        </span>
        <Badge intent={STATUS_INTENT[goal.status ?? 'active']}>{goal.status ?? 'active'}</Badge>
        <button
          type="button"
          onClick={() => onDelete(goal.id)}
          aria-label="Delete goal"
          className="opacity-0 group-hover/card:opacity-100 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity flex-shrink-0"
        >×</button>
      </div>

      {/* ── Vision ── */}
      {goal.vision && (
        <p className="text-[12px] text-foreground-secondary mb-3 leading-snug">{goal.vision}</p>
      )}

      {/* ── Scores ── */}
      <div className="flex items-baseline gap-5 mb-3">
        <div className="flex items-baseline gap-[6px]">
          <span className="text-[26px] font-medium text-goals leading-none">
            {weeklyScore !== null ? `${weeklyScore}%` : '—'}
          </span>
          <span className="text-[11px] text-foreground-tertiary">this week</span>
        </div>
        <div className="flex items-baseline gap-[6px]">
          <span className="text-[17px] text-foreground-secondary leading-none">
            {overallScore !== null ? `${overallScore}%` : '—'}
          </span>
          <span className="text-[11px] text-foreground-tertiary">12-week</span>
        </div>
      </div>

      {/* ── 12-week timeline bar ── */}
      <div className="flex items-center gap-[3px] mb-5">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-[4px] rounded-full',
              i < weekNum ? 'bg-goals' : 'bg-background-secondary',
            )}
          />
        ))}
        <span className="text-[11px] text-foreground-tertiary ml-2 flex-shrink-0 tabular-nums">
          Week {weekNum} of 12
        </span>
      </div>

      {/* ── Tactics ── */}
      <div className="mb-4">
        <p className="text-[11px] text-foreground-tertiary mb-2">
          {tacticTotal > 0
            ? `Tactics · ${tacticDone}/${tacticTotal} done`
            : 'Tactics'}
        </p>

        {tactics.length > 0 && (
          <div className="flex flex-col gap-1 mb-2">
            {tactics.map(task => (
              <label key={task.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => onToggleTactic(task.id, task.status === 'done')}
                  className="w-[14px] h-[14px] rounded border-line accent-goals cursor-pointer flex-shrink-0"
                />
                <span className={cn(
                  'text-[13px] leading-snug',
                  task.status === 'done'
                    ? 'text-foreground-tertiary line-through'
                    : 'text-foreground',
                )}>
                  {task.title}
                </span>
              </label>
            ))}
          </div>
        )}

        <form onSubmit={handleAddTactic}>
          <input
            value={newTactic}
            onChange={e => setNewTactic(e.target.value)}
            placeholder="Add tactic…"
            disabled={addingTactic}
            className={inputBase}
          />
        </form>
      </div>

      {/* ── Lead indicators ── */}
      <div>
        <p className="text-[11px] text-foreground-tertiary mb-2">
          {linkedHabits.length > 0
            ? `Lead indicators · ${linkedHabits.length} linked`
            : 'Lead indicators'}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {linkedHabits.map(habit => {
            const scheduledToday = !habit.days || habit.days.includes(todayKey)
            const loggedToday    = habitLogsByHabit.get(habit.id)?.has(today) ?? false
            return (
              <div
                key={habit.id}
                className="group/chip flex items-center gap-[6px] h-7 px-2 rounded-lg bg-background-secondary"
              >
                <div className={cn(
                  'w-[7px] h-[7px] rounded-full flex-shrink-0',
                  loggedToday     ? 'bg-habits'
                  : scheduledToday ? 'border-[1.5px] border-habits'
                  :                  'bg-foreground-tertiary opacity-40',
                )} />
                <span className="text-[12px] text-foreground">{habit.title}</span>
                <button
                  type="button"
                  onClick={() => onUnlinkHabit(goal.id, habit.id)}
                  aria-label="Unlink habit"
                  className="opacity-0 group-hover/chip:opacity-100 ml-0.5 text-[14px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
                >×</button>
              </div>
            )
          })}

          {availableHabits.length > 0 && !showHabitPicker && (
            <button
              type="button"
              onClick={() => setShowHabitPicker(true)}
              className="text-[12px] text-goals hover:opacity-75 transition-opacity"
            >
              + Link habit
            </button>
          )}
        </div>

        {showHabitPicker && (
          <div className="mt-2 flex flex-wrap gap-1">
            {availableHabits.map(h => (
              <button
                key={h.id}
                type="button"
                onClick={async () => {
                  await onLinkHabit(goal.id, h.id)
                  setShowHabitPicker(false)
                }}
                className="h-7 px-3 text-[12px] rounded-lg bg-goals-subtle text-goals-on-subtle hover:opacity-80 transition-opacity"
              >
                {h.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowHabitPicker(false)}
              className="h-7 px-3 text-[12px] rounded-lg bg-background-secondary text-foreground-secondary hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
