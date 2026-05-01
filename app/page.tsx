'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getLists, getAllListItems }                  from '@/lib/queries/lists'
import { getGoals, deleteGoal, getGoalHabitsWithHabits } from '@/lib/queries/goals'
import { getHabits, getHabitLogsForWeek }                from '@/lib/queries/habits'
import { getIncomeSources, getBudgetCategories }          from '@/lib/queries/finance'
import {
  todayStr, getWeekDates, pad,
  weekOfTwelve, countHabitDaysInDates,
} from '@/lib/utils'
import type { List, ListItem, Goal, Habit, IncomeSource, BudgetCategory, GoalHabitWithHabit } from '@/types'
import MetricCard   from '@/components/ui/MetricCard'
import Card         from '@/components/ui/Card'
import GoalProgress from '@/components/goals/GoalProgress'
import HabitDots    from '@/components/habits/HabitDots'
import BudgetRow    from '@/components/finance/BudgetRow'
import type { DotState, DotKind } from '@/components/habits/HabitDots'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 22) return 'Good evening'
  return 'Good night'
}

function getDateStr(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function getMonthStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

const WEEK_DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long' })
}

function calcWeeklyExecution(
  linkedHabits: Habit[],
  logsByHabit:  Map<string, Set<string>>,
  weekDates:    string[],
): number | null {
  let weekExp = 0, weekLog = 0
  for (const h of linkedHabits) {
    weekExp += countHabitDaysInDates(h.days, weekDates)
    weekLog += weekDates.filter(d => logsByHabit.get(h.id)?.has(d)).length
  }
  return weekExp > 0 ? Math.round(weekLog / weekExp * 100) : null
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [lists,        setLists]        = useState<List[]>([])
  const [allItems,     setAllItems]     = useState<ListItem[]>([])
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [habits,       setHabits]       = useState<Habit[]>([])
  const [logsByHabit,  setLogsByHabit]  = useState<Map<string, Set<string>>>(new Map())
  const [goalHabits,   setGoalHabits]   = useState<GoalHabitWithHabit[]>([])
  const [incomes,      setIncomes]      = useState<IncomeSource[]>([])
  const [budgets,      setBudgets]      = useState<BudgetCategory[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [greeting,     setGreeting]     = useState('')
  const [dateStr,      setDateStr]      = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
    setDateStr(getDateStr())
  }, [])

  const today        = useMemo(() => todayStr(),    [])
  const weekDates    = useMemo(() => getWeekDates(), [])
  const currentMonth = useMemo(() => getMonthStr(), [])
  const todayKey     = useMemo(() => JS_DAY_TO_KEY[new Date().getDay()], [])

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [allLists, items, allGoals, allHabits, inc, cats] = await Promise.all([
        getLists(),
        getAllListItems(),
        getGoals({ status: 'active' }),
        getHabits(),
        getIncomeSources(currentMonth),
        getBudgetCategories(currentMonth),
      ])
      setLists(allLists)
      setAllItems(items)
      setGoals(allGoals)
      setHabits(allHabits)
      setIncomes(inc)
      setBudgets(cats)

      const goalIds = allGoals.map(g => g.id)
      const [logs, ghRows] = await Promise.all([
        allHabits.length > 0
          ? getHabitLogsForWeek(allHabits.map(h => h.id), weekDates[0], weekDates[6])
          : Promise.resolve([]),
        goalIds.length > 0
          ? getGoalHabitsWithHabits(goalIds)
          : Promise.resolve([]),
      ])

      const map = new Map<string, Set<string>>()
      for (const log of logs) {
        if (!log.habit_id) continue
        if (!map.has(log.habit_id)) map.set(log.habit_id, new Set())
        map.get(log.habit_id)!.add(log.logged_date)
      }
      setLogsByHabit(map)
      setGoalHabits(ghRows)
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [currentMonth, weekDates])

  useEffect(() => { load() }, [load])

  // ── Mutations ───────────────────────────────────────────────────────────────

  async function handleGoalDelete(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await deleteGoal(id)
    } catch {
      load()
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const habitsToday = useMemo(() =>
    habits.filter(h => !h.days || h.days.includes(todayKey)),
    [habits, todayKey],
  )

  const loggedTodayCount = useMemo(() =>
    habitsToday.filter(h => logsByHabit.get(h.id)?.has(today)).length,
    [habitsToday, logsByHabit, today],
  )

  const totalExpectedIncome = useMemo(() =>
    incomes.reduce((s, i) => s + i.expected, 0),
    [incomes],
  )

  const totalBudgeted = useMemo(() =>
    budgets.reduce((s, b) => s + b.expected, 0),
    [budgets],
  )

  const leftover = totalExpectedIncome - totalBudgeted

  function fmtWhole(n: number): string {
    return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const focusGoal = goals[0] ?? null

  const focusGoalHabits = useMemo(() =>
    focusGoal
      ? goalHabits.filter(gh => gh.goal_id === focusGoal.id).map(gh => gh.habit)
      : [],
    [goalHabits, focusGoal],
  )
  const focusExecution = useMemo(() =>
    focusGoal ? calcWeeklyExecution(focusGoalHabits, logsByHabit, weekDates) : null,
    [focusGoal, focusGoalHabits, logsByHabit, weekDates],
  )

  function buildDots(habitId: string, habitDays: string[] | null): DotState[] {
    const logged = logsByHabit.get(habitId) ?? new Set<string>()
    return weekDates.map((date, i) => {
      const dayKey = WEEK_DAY_KEYS[i]
      if (habitDays && !habitDays.includes(dayKey)) return { date, kind: 'skip' }
      let kind: DotKind
      if (date > today)        kind = 'future'
      else if (date === today) kind = logged.has(date) ? 'today-done' : 'today-pending'
      else                     kind = logged.has(date) ? 'done' : 'miss'
      return { date, kind }
    })
  }

  // Pinned lists (or 3 most recent)
  const dashLists = useMemo(() => {
    const pinned = lists.filter(l => l.is_pinned)
    return pinned.length > 0 ? pinned : lists.slice(0, 3)
  }, [lists])

  const itemsByList = useMemo(() => {
    const map: Record<string, ListItem[]> = {}
    for (const item of allItems) {
      if (!item.list_id) continue
      if (!map[item.list_id]) map[item.list_id] = []
      map[item.list_id].push(item)
    }
    return map
  }, [allItems])

  const totalListItems = useMemo(() => allItems.length, [allItems])
  const checkedItems   = useMemo(() => allItems.filter(i => i.is_checked).length, [allItems])

  // ── Render ──────────────────────────────────────────────────────────────────

  const focusStartDate = focusGoal
    ? (focusGoal.start_date ?? focusGoal.created_at?.slice(0, 10) ?? today)
    : today
  const focusWeekNum = focusGoal ? weekOfTwelve(focusStartDate, today) : 1

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Greeting */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">
        {greeting}
      </h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {dateStr}
      </p>

      {error && (
        <p className="text-[13px] text-finance mb-4">{error}</p>
      )}

      {/* Focus goal banner */}
      {!loading && focusGoal && (
        <div className="bg-goals-subtle rounded-xl px-5 py-4 mb-6">
          <div className="flex items-center gap-2 mb-[2px]">
            <p className="text-[11px] text-goals-on-subtle opacity-70 flex-1">
              Focus · Week {focusWeekNum} of 12
            </p>
            {focusExecution !== null && (
              <span className="text-[13px] font-medium text-goals-on-subtle">
                {focusExecution}% this week
              </span>
            )}
          </div>
          <p className="text-[14px] font-medium text-goals-on-subtle mb-3">
            {focusGoal.title}
          </p>
          <div className="flex items-center gap-[3px]">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-[4px] rounded-full ${i < focusWeekNum ? 'bg-goals' : 'bg-goals-on-subtle opacity-20'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] mb-6">
        <MetricCard
          label="Items done"
          value={loading ? '—' : checkedItems}
          valueSub={!loading && totalListItems > 0 ? `/ ${totalListItems}` : undefined}
        />
        <MetricCard
          label="Habits today"
          value={loading ? '—' : loggedTodayCount}
          valueSub={!loading && habitsToday.length > 0 ? `/ ${habitsToday.length}` : undefined}
        />
        <MetricCard
          label="Budget"
          value={loading ? '—' : fmtWhole(Math.abs(leftover))}
          sub={!loading ? (leftover < 0 ? 'over income' : 'unallocated') : undefined}
        />
      </div>

      {/* 2-column content grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Left column: lists + goals */}
        <div className="flex flex-col gap-4">

          <Card title="Lists">
            {loading ? (
              <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
            ) : dashLists.length === 0 ? (
              <p className="text-[13px] text-foreground-tertiary py-1">No lists yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {dashLists.map(list => {
                  const items   = itemsByList[list.id] ?? []
                  const total   = items.length
                  const checked = items.filter(i => i.is_checked).length
                  const pct     = total > 0 ? Math.round((checked / total) * 100) : 0
                  const accent  = `#${list.color}`
                  return (
                    <div key={list.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px]">{list.icon}</span>
                        <span className="text-[13px] text-foreground flex-1 truncate">{list.title}</span>
                        <span className="text-[11px] text-foreground-tertiary flex-shrink-0 tabular-nums">
                          {checked}/{total}
                        </span>
                      </div>
                      {total > 0 && (
                        <div className="h-[6px] rounded-full bg-background-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: accent }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Goals">
            {loading ? (
              <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
            ) : goals.length === 0 ? (
              <p className="text-[13px] text-foreground-tertiary py-1">No active goals.</p>
            ) : (
              <div>
                {goals.map(g => (
                  <GoalProgress
                    key={g.id}
                    goal={g}
                    onDelete={handleGoalDelete}
                  />
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* Right column: habits + budget */}
        <div className="flex flex-col gap-4">

          <Card title="Habits today">
            {loading ? (
              <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
            ) : habitsToday.length === 0 ? (
              <p className="text-[13px] text-foreground-tertiary py-1">No habits scheduled today.</p>
            ) : (
              <div>
                {habitsToday.map(h => (
                  <div
                    key={h.id}
                    className="flex flex-col gap-[5px] py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0"
                  >
                    <span className="text-[12px] text-foreground">{h.title}</span>
                    <HabitDots dots={buildDots(h.id, h.days)} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Budget — ${formatMonth(currentMonth)}`}>
            {loading ? (
              <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
            ) : budgets.length === 0 ? (
              <p className="text-[13px] text-foreground-tertiary py-1">No budget set this month.</p>
            ) : (
              <div>
                {budgets.map(b => (
                  <BudgetRow key={b.id} category={b} />
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>

    </div>
  )
}
