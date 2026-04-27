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

type FreqOption = 'daily' | 'weekdays' | 'weekly'

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDots(
  habitId: string,
  weekDates: string[],
  logsByHabit: Map<string, Set<string>>,
  today: string,
): DotState[] {
  const logged = logsByHabit.get(habitId) ?? new Set<string>()
  return weekDates.map(date => {
    let kind: DotKind
    if (date > today) {
      kind = 'future'
    } else if (date === today) {
      kind = logged.has(date) ? 'today-done' : 'today-pending'
    } else {
      kind = logged.has(date) ? 'done' : 'miss'
    }
    return { date, kind }
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const [habits,       setHabits]       = useState<Habit[]>([])
  const [logsByHabit,  setLogsByHabit]  = useState<Map<string, Set<string>>>(new Map())
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [newTitle,     setNewTitle]     = useState('')
  const [newFreq,      setNewFreq]      = useState<FreqOption>('daily')
  const [adding,       setAdding]       = useState(false)

  const today     = useMemo(() => todayStr(), [])
  const weekDates = useMemo(() => getWeekDates(), [])

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
      setError(e instanceof Error ? e.message : 'Failed to load habits.')
    } finally {
      setLoading(false)
    }
  }, [weekDates])

  useEffect(() => { load() }, [load])

  // ── Mutations ─────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      const created = await createHabit({ title: trimmed, frequency: newFreq })
      setHabits(prev => [...prev, created])
      setNewTitle('')
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
    // Optimistic update
    setLogsByHabit(prev => {
      const next = new Map(prev)
      const dates = new Set(prev.get(habitId) ?? [])
      if (currentlyLogged) {
        dates.delete(today)
      } else {
        dates.add(today)
      }
      next.set(habitId, dates)
      return next
    })
    try {
      if (currentlyLogged) {
        await unlogHabit(habitId, today)
      } else {
        await logHabit(habitId, today)
      }
    } catch {
      load()
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────────

  const loggedTodayCount = habits.filter(h => {
    const dates = logsByHabit.get(h.id)
    return dates?.has(today) ?? false
  }).length

  const totalThisWeek = Array.from(logsByHabit.values()).reduce(
    (sum, dates) => sum + dates.size, 0
  )

  // ── Render ─────────────────────────────────────────────────────────────────────

  const inputBase =
    'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-[1px] focus:border-habits transition-colors'

  const FREQ_OPTIONS: FreqOption[] = ['daily', 'weekdays', 'weekly']
  const FREQ_LABELS: Record<FreqOption, string> = {
    daily:    'Daily',
    weekdays: 'Weekdays',
    weekly:   'Weekly',
  }

  return (
    <div className="p-6 max-w-3xl">

      {/* Page header */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Habits</h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {loading
          ? '—'
          : habits.length === 0
            ? 'No habits yet.'
            : `${loggedTodayCount} of ${habits.length} logged today`}
      </p>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <MetricCard
          label="Habits"
          value={loading ? '—' : habits.length}
        />
        <MetricCard
          label="Logged today"
          value={loading ? '—' : loggedTodayCount}
          valueSub={!loading && habits.length > 0 ? `/ ${habits.length}` : undefined}
        />
        <MetricCard
          label="This week"
          value={loading ? '—' : totalThisWeek}
        />
      </div>

      {/* Add habit form */}
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2 mb-6">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New habit…"
          className={`flex-1 min-w-[160px] ${inputBase}`}
          autoComplete="off"
        />

        {/* Frequency pills */}
        <div className="flex items-center gap-1">
          {FREQ_OPTIONS.map(f => (
            <Button
              key={f}
              type="button"
              size="sm"
              variant={newFreq === f ? 'secondary' : 'ghost'}
              intent="habits"
              onClick={() => setNewFreq(f)}
            >
              {FREQ_LABELS[f]}
            </Button>
          ))}
        </div>

        <Button
          variant="primary"
          intent="habits"
          size="md"
          type="submit"
          disabled={!newTitle.trim() || adding}
        >
          Add
        </Button>
      </form>

      {/* Habit list */}
      <Card>
        {loading ? (
          <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
        ) : error ? (
          <p className="text-[13px] text-finance py-1">{error}</p>
        ) : habits.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-1">No habits here.</p>
        ) : (
          <div>
            {habits.map(habit => (
              <HabitTracker
                key={habit.id}
                habit={habit}
                dots={buildDots(habit.id, weekDates, logsByHabit, today)}
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
