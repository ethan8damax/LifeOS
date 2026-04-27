'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { getTasks, updateTask, deleteTask }   from '@/lib/queries/tasks'
import { getGoals, updateGoal, deleteGoal }   from '@/lib/queries/goals'
import { getHabits, getHabitLogsForWeek }     from '@/lib/queries/habits'
import { getTransactions, getBudgets }        from '@/lib/queries/finance'
import { todayStr, getWeekDates, pad }        from '@/lib/utils'
import type { Task, Goal, Habit, Transaction, Budget } from '@/types'
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

function formatMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long' })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tasks,        setTasks]        = useState<Task[]>([])
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [habits,       setHabits]       = useState<Habit[]>([])
  const [logsByHabit,  setLogsByHabit]  = useState<Map<string, Set<string>>>(new Map())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets,      setBudgets]      = useState<Budget[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const today        = useMemo(() => todayStr(),    [])
  const weekDates    = useMemo(() => getWeekDates(), [])
  const currentMonth = useMemo(() => getMonthStr(), [])

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

      if (allHabits.length > 0) {
        const logs = await getHabitLogsForWeek(
          allHabits.map(h => h.id),
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
      setError(e instanceof Error ? e.message : 'Failed to load dashboard.')
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

  async function handleGoalUpdate(id: string, progress: number) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g))
    try {
      await updateGoal(id, { progress })
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

  // Non-done tasks due today or overdue — the actionable list
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

  const loggedTodayCount = useMemo(() =>
    habits.filter(h => logsByHabit.get(h.id)?.has(today)).length,
    [habits, logsByHabit, today],
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

  function buildDots(habitId: string): DotState[] {
    const logged = logsByHabit.get(habitId) ?? new Set<string>()
    return weekDates.map(date => {
      let kind: DotKind
      if (date > today)       kind = 'future'
      else if (date === today) kind = logged.has(date) ? 'today-done' : 'today-pending'
      else                    kind = logged.has(date) ? 'done' : 'miss'
      return { date, kind }
    })
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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

      {/* Weekly focus banner */}
      {!loading && focusGoal && (
        <div className="bg-goals-subtle rounded-xl px-5 py-4 mb-6">
          <p className="text-[11px] text-goals-on-subtle mb-[6px] opacity-70">
            Focus
          </p>
          <div className="flex items-center gap-2 mb-[8px]">
            <span className="text-[14px] font-medium text-goals-on-subtle flex-1">
              {focusGoal.title}
            </span>
            <span className="text-[12px] text-goals-on-subtle opacity-70 flex-shrink-0">
              {focusGoal.progress ?? 0}%
            </span>
          </div>
          <ProgressBar value={focusGoal.progress ?? 0} intent="goals" />
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
          valueSub={!loading && habits.length > 0 ? `/ ${habits.length}` : undefined}
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
                    onUpdate={handleGoalUpdate}
                    onDelete={handleGoalDelete}
                  />
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* Right column: habits + budget */}
        <div className="flex flex-col gap-4">

          <Card title="Habits this week">
            {loading ? (
              <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
            ) : habits.length === 0 ? (
              <p className="text-[13px] text-foreground-tertiary py-1">No habits yet.</p>
            ) : (
              <div>
                {habits.map(h => (
                  <div
                    key={h.id}
                    className="flex flex-col gap-[5px] py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0"
                  >
                    <span className="text-[12px] text-foreground">{h.title}</span>
                    <HabitDots dots={buildDots(h.id)} />
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
