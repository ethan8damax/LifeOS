'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getHabits, createHabit, deleteHabit,
  getHabitLogsForWeek, logHabit, unlogHabit,
} from '@/lib/queries/habits'
import { todayStr, getWeekDates } from '@/lib/utils'
import type { Habit } from '@/types'
import MetricCard   from '@/components/ui/MetricCard'
import Card         from '@/components/ui/Card'
import Button       from '@/components/ui/Button'
import HabitTracker from '@/components/habits/HabitTracker'
import type { DotState, DotKind } from '@/components/habits/HabitDots'
import { cn } from '@/lib/utils'

// ── Day helpers ───────────────────────────────────────────────────────────────

// Ordered Mon → Sun to match weekDates (which also starts on Monday)
const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const WEEK_DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const ALL_DAYS = [...WEEK_DAYS]

// JS getDay(): 0=Sun,1=Mon,…,6=Sat — map to our Mon-first order
const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

function todayDayKey(): string {
  return JS_DAY_TO_KEY[new Date().getDay()]
}

function buildDots(
  habitId: string,
  weekDates: string[],
  logsByHabit: Map<string, Set<string>>,
  today: string,
  habitDays: string[] | null,
): DotState[] {
  const logged = logsByHabit.get(habitId) ?? new Set<string>()
  return weekDates.map((date, i) => {
    const dayKey = WEEK_DAYS[i]
    if (habitDays && !habitDays.includes(dayKey)) return { date, kind: 'skip' }
    let kind: DotKind
    if (date > today)       kind = 'future'
    else if (date === today) kind = logged.has(date) ? 'today-done' : 'today-pending'
    else                    kind = logged.has(date) ? 'done' : 'miss'
    return { date, kind }
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const [habits,      setHabits]      = useState<Habit[]>([])
  const [logsByHabit, setLogsByHabit] = useState<Map<string, Set<string>>>(new Map())
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [newTitle,    setNewTitle]    = useState('')
  const [newDays,     setNewDays]     = useState<string[]>([...ALL_DAYS])
  const [adding,      setAdding]      = useState(false)

  const today     = useMemo(() => todayStr(), [])
  const weekDates = useMemo(() => getWeekDates(), [])
  const todayKey  = useMemo(() => todayDayKey(), [])

  // ── Data loading ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await getHabits()
      setHabits(data)

      if (data.length > 0) {
        const logs = await getHabitLogsForWeek(
          data.map(h => h.id),
          weekDates[0],
          weekDates[6],
        )
        const map = new Map<string, Set<string>>()
        for (const log of logs) {
          if (!log.habit_id) continue
          if (!map.has(log.habit_id)) map.set(log.habit_id, new Set())
          map.get(log.habit_id)!.add(log.logged_date)
        }
        setLogsByHabit(map)
      }
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to load habits.')
    } finally {
      setLoading(false)
    }
  }, [weekDates])

  useEffect(() => { load() }, [load])

  // ── Mutations ─────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed || newDays.length === 0) return
    setAdding(true)
    try {
      const created = await createHabit({ title: trimmed, days: newDays })
      setHabits(prev => [...prev, created])
      setNewTitle('')
      setNewDays([...ALL_DAYS])
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(habitId: string) {
    setHabits(prev => prev.filter(h => h.id !== habitId))
    setLogsByHabit(prev => {
      const next = new Map(prev)
      next.delete(habitId)
      return next
    })
    try {
      await deleteHabit(habitId)
    } catch {
      load()
    }
  }

  async function handleToggle(habitId: string, currentlyLogged: boolean) {
    setLogsByHabit(prev => {
      const next  = new Map(prev)
      const dates = new Set(prev.get(habitId) ?? [])
      if (currentlyLogged) dates.delete(today)
      else                 dates.add(today)
      next.set(habitId, dates)
      return next
    })
    try {
      if (currentlyLogged) await unlogHabit(habitId, today)
      else                 await logHabit(habitId, today)
    } catch {
      load()
    }
  }

  function toggleNewDay(day: string) {
    setNewDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // ── Derived state ─────────────────────────────────────────────────────────────

  // Only show habits scheduled for today
  const habitsToday = habits.filter(h => !h.days || h.days.includes(todayKey))

  const loggedTodayCount = habitsToday.filter(h =>
    logsByHabit.get(h.id)?.has(today) ?? false
  ).length

  const totalThisWeek = Array.from(logsByHabit.values()).reduce(
    (sum, dates) => sum + dates.size, 0
  )

  // ── Render ─────────────────────────────────────────────────────────────────────

  const inputBase =
    'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-[1px] focus:border-habits transition-colors'

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Page header */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Habits</h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {loading
          ? '—'
          : habitsToday.length === 0
            ? 'No habits scheduled today.'
            : `${loggedTodayCount} of ${habitsToday.length} logged today`}
      </p>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] mb-6">
        <MetricCard label="Habits"       value={loading ? '—' : habits.length} />
        <MetricCard
          label="Logged today"
          value={loading ? '—' : loggedTodayCount}
          valueSub={!loading && habitsToday.length > 0 ? `/ ${habitsToday.length}` : undefined}
        />
        <MetricCard label="This week"    value={loading ? '—' : totalThisWeek} />
      </div>

      {/* Add habit form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-6">
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="New habit…"
            className={`flex-1 ${inputBase}`}
            autoComplete="off"
          />
          <Button
            variant="primary"
            intent="habits"
            size="md"
            type="submit"
            disabled={!newTitle.trim() || newDays.length === 0 || adding}
          >
            Add
          </Button>
        </div>

        {/* Day picker */}
        <div className="flex items-center gap-[4px]">
          {WEEK_DAYS.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleNewDay(day)}
              className={cn(
                'w-7 h-7 rounded-[6px] text-[11px] font-medium transition-colors',
                newDays.includes(day)
                  ? 'bg-habits text-white'
                  : 'bg-background-secondary text-foreground-tertiary hover:text-foreground',
              )}
            >
              {WEEK_DAY_LABELS[i]}
            </button>
          ))}
        </div>
      </form>

      {/* Habit list — only today's habits */}
      <Card>
        {loading ? (
          <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
        ) : error ? (
          <p className="text-[13px] text-finance py-1">{error}</p>
        ) : habitsToday.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-1">No habits scheduled for today.</p>
        ) : (
          <div>
            {habitsToday.map(habit => (
              <HabitTracker
                key={habit.id}
                habit={habit}
                dots={buildDots(habit.id, weekDates, logsByHabit, today, habit.days)}
                today={today}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
