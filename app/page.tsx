'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getTasks, updateTask, deleteTask }              from '@/lib/queries/tasks'
import { getGoals, deleteGoal, getGoalHabitsWithHabits } from '@/lib/queries/goals'
import { getHabits, getHabitLogsForWeek }                from '@/lib/queries/habits'
import { getTransactions, getBudgets }                   from '@/lib/queries/finance'
import {
  todayStr, getWeekDates, pad,
  weekOfTwelve, addDays, countHabitDaysInDates,
} from '@/lib/utils'
import type { Task, Goal, Habit, Transaction, Budget, GoalHabitWithHabit } from '@/types'
import MetricCard   from '@/components/ui/MetricCard'
import Card         from '@/components/ui/Card'
import ProgressBar  from '@/components/ui/ProgressBar'
import TaskList     from '@/components/tasks/TaskList'
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

// Compute a weekly execution score (0–100) for the focus goal.
// = average of tactic completion rate and linked-habit completion rate for this week.
function calcWeeklyExecution(
  tactics:      Task[],
  linkedHabits: Habit[],
  logsByHabit:  Map<string, Set<string>>,
  weekDates:    string[],
): number | null {
  const parts: number[] = []

  if (tactics.length > 0)
    parts.push(tactics.filter(t => t.status === 'done').length / tactics.length * 100)

  let weekExp = 0, weekLog = 0
  for (const h of linkedHabits) {
    weekExp += countHabitDaysInDates(h.days, weekDates)
    weekLog += weekDates.filter(d => logsByHabit.get(h.id)?.has(d)).length
  }
  if (weekExp > 0) parts.push(weekLog / weekExp * 100)

  return parts.length > 0 ? Math.round(parts.reduce((a, b) => a + b) / parts.length) : null
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tasks,        setTasks]        = useState<Task[]>([])
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [habits,       setHabits]       = useState<Habit[]>([])
  const [logsByHabit,  setLogsByHabit]  = useState<Map<string, Set<string>>>(new Map())
  const [goalHabits,   setGoalHabits]   = useState<GoalHabitWithHabit[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets,      setBudgets]      = useState<Budget[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const today        = useMemo(() => todayStr(),    [])
  const weekDates    = useMemo(() => getWeekDates(), [])
  const currentMonth = useMemo(() => getMonthStr(), [])
  const todayKey     = useMemo(() => JS_DAY_TO_KEY[new Date().getDay()], [])

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [allTasks, allGoals, allHabits, txns, bgs] = await Promise.all([
        getTasks(),
        getGoals({ status: 'active' }),
        getHabits(),
        getTransactions({ month: currentMonth }),
        getBudgets(currentMonth),
      ])
      setTasks(allTasks)
      setGoals(allGoals)
      setHabits(allHabits)
      setTransactions(txns)
      setBudgets(bgs)

      // Load habit logs (this week) and goal→habit links in parallel
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

  async function handleToggle(id: string, done: boolean) {
    const next = done ? 'done' : 'todo'
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t))
    try {
      await updateTask(id, { status: next })
    } catch {
      load()
    }
  }

  async function handleTaskDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTask(id)
    } catch {
      load()
    }
  }

  async function handleGoalDelete(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await deleteGoal(id)
    } catch {
      load()
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const todayTasks = useMemo(() =>
    tasks
      .filter(t => t.status !== 'done' && t.due_date !== null && t.due_date <= today)
      .slice(0, 8),
    [tasks, today],
  )

  const overdueCount = useMemo(() =>
    tasks.filter(t => t.status !== 'done' && t.due_date !== null && t.due_date < today).length,
    [tasks, today],
  )

  const habitsToday = useMemo(() =>
    habits.filter(h => !h.days || h.days.includes(todayKey)),
    [habits, todayKey],
  )

  const loggedTodayCount = useMemo(() =>
    habitsToday.filter(h => logsByHabit.get(h.id)?.has(today)).length,
    [habitsToday, logsByHabit, today],
  )

  const totalExpenses = useMemo(() =>
    transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions],
  )

  const totalBudgetLimit = useMemo(() =>
    budgets.reduce((s, b) => s + b.limit_amount, 0),
    [budgets],
  )

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.category) continue
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    return map
  }, [transactions])

  const budgetPctStr = totalBudgetLimit > 0
    ? `${Math.round(totalExpenses / totalBudgetLimit * 100)}%`
    : '—'

  const focusGoal = goals[0] ?? null

  // Focus goal execution score (this week)
  const focusGoalTactics = useMemo(() =>
    focusGoal ? tasks.filter(t => t.goal_id === focusGoal.id) : [],
    [tasks, focusGoal],
  )
  const focusGoalHabits = useMemo(() =>
    focusGoal
      ? goalHabits.filter(gh => gh.goal_id === focusGoal.id).map(gh => gh.habit)
      : [],
    [goalHabits, focusGoal],
  )
  const focusExecution = useMemo(() =>
    focusGoal
      ? calcWeeklyExecution(focusGoalTactics, focusGoalHabits, logsByHabit, weekDates)
      : null,
    [focusGoal, focusGoalTactics, focusGoalHabits, logsByHabit, weekDates],
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

  // ── Render ──────────────────────────────────────────────────────────────────

  const focusStartDate = focusGoal
    ? (focusGoal.start_date ?? focusGoal.created_at?.slice(0, 10) ?? today)
    : today
  const focusEndDate = focusGoal
    ? (focusGoal.end_date ?? addDays(focusStartDate, 83))
    : today
  const focusWeekNum = focusGoal ? weekOfTwelve(focusStartDate, today) : 1

  return (
    <div className="p-6 max-w-3xl">

      {/* Greeting */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">
        {getGreeting()}
      </h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {getDateStr()}
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
          {/* 12-week timeline */}
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
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <MetricCard
          label="Tasks today"
          value={loading ? '—' : todayTasks.length}
          sub={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
        />
        <MetricCard
          label="Habits today"
          value={loading ? '—' : loggedTodayCount}
          valueSub={!loading && habitsToday.length > 0 ? `/ ${habitsToday.length}` : undefined}
        />
        <MetricCard
          label="Budget"
          value={loading ? '—' : budgetPctStr}
          sub={!loading && totalBudgetLimit > 0 ? 'of monthly limit' : undefined}
        />
      </div>

      {/* 2-column content grid */}
      <div className="grid grid-cols-2 gap-4">

        {/* Left column: tasks + goals */}
        <div className="flex flex-col gap-4">

          <Card title="Today's tasks">
            {loading ? (
              <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
            ) : (
              <TaskList
                tasks={todayTasks}
                onToggle={handleToggle}
                onDelete={handleTaskDelete}
              />
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
              <p className="text-[13px] text-foreground-tertiary py-1">No budgets this month.</p>
            ) : (
              <div>
                {budgets.map(b => (
                  <BudgetRow
                    key={b.id}
                    budget={b}
                    spent={spentByCategory.get(b.category) ?? 0}
                  />
                ))}
              </div>
            )}
          </Card>

        </div>

      </div>

    </div>
  )
}
