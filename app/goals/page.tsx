'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getGoals, createGoal, updateGoal, deleteGoal,
  getGoalHabitsWithHabits, linkHabitToGoal, unlinkHabitFromGoal,
} from '@/lib/queries/goals'
import { createTask, updateTask, getTasksByGoalIds } from '@/lib/queries/tasks'
import { getHabits }                                 from '@/lib/queries/habits'
import { getHabitLogsForWeek }                       from '@/lib/queries/habits'
import { todayStr, getWeekDates, addDays }            from '@/lib/utils'
import type { Goal, Habit, Task, GoalHabitWithHabit } from '@/types'
import MetricCard from '@/components/ui/MetricCard'
import Card       from '@/components/ui/Card'
import Button     from '@/components/ui/Button'
import GoalCard   from '@/components/goals/GoalCard'

// ── Page ──────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'paused' | 'done'

export default function GoalsPage() {
  const [goals,      setGoals]      = useState<Goal[]>([])
  const [tactics,    setTactics]    = useState<Task[]>([])
  const [goalHabits, setGoalHabits] = useState<GoalHabitWithHabit[]>([])
  const [allHabits,  setAllHabits]  = useState<Habit[]>([])
  const [logMap,     setLogMap]     = useState<Map<string, Set<string>>>(new Map())
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  // Add-goal form
  const [newTitle,   setNewTitle]   = useState('')
  const [newVision,  setNewVision]  = useState('')
  const [newTactics, setNewTactics] = useState<string[]>([''])
  const [adding,     setAdding]     = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  const today     = useMemo(() => todayStr(), [])
  const weekDates = useMemo(() => getWeekDates(), [])

  // ── Load ──────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setError(null)
    try {
      const [allGoals, habits] = await Promise.all([getGoals(), getHabits()])
      setGoals(allGoals)
      setAllHabits(habits)

      const goalIds = allGoals.map(g => g.id)

      const [taskRows, ghRows] = await Promise.all([
        getTasksByGoalIds(goalIds),
        getGoalHabitsWithHabits(goalIds),
      ])
      setTactics(taskRows)
      setGoalHabits(ghRows)

      // Load habit logs for the full span of all goals so scores are accurate
      const linkedHabitIds = Array.from(new Set(ghRows.map(gh => gh.habit_id)))
      if (linkedHabitIds.length > 0 && allGoals.length > 0) {
        const minStart = allGoals.reduce((min, g) => {
          const s = g.start_date ?? g.created_at?.slice(0, 10) ?? today
          return s < min ? s : min
        }, today)
        const logs = await getHabitLogsForWeek(linkedHabitIds, minStart, today)
        const map = new Map<string, Set<string>>()
        for (const log of logs) {
          if (!log.habit_id) continue
          if (!map.has(log.habit_id)) map.set(log.habit_id, new Set())
          map.get(log.habit_id)!.add(log.logged_date)
        }
        setLogMap(map)
      } else {
        setLogMap(new Map())
      }
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to load goals.')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { load() }, [load])

  // ── Goal creation ─────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmedTitle = newTitle.trim()
    if (!trimmedTitle) return
    setAdding(true)
    try {
      const created = await createGoal({
        title:  trimmedTitle,
        vision: newVision.trim() || null,
        status: 'active',
      })
      setGoals(prev => [created, ...prev])

      const tacticTitles = newTactics.filter(t => t.trim())
      if (tacticTitles.length > 0) {
        const createdTactics = await Promise.all(
          tacticTitles.map(title =>
            createTask({ title, goal_id: created.id, status: 'todo', is_recurring: true })
          )
        )
        setTactics(prev => [...prev, ...createdTactics])
      }

      setNewTitle('')
      setNewVision('')
      setNewTactics([''])
    } finally {
      setAdding(false)
    }
  }

  // ── Goal-level mutations ──────────────────────────────────────────────────────

  async function handleDeleteGoal(goalId: string) {
    setGoals(prev => prev.filter(g => g.id !== goalId))
    setTactics(prev => prev.filter(t => t.goal_id !== goalId))
    setGoalHabits(prev => prev.filter(gh => gh.goal_id !== goalId))
    try {
      await deleteGoal(goalId)
    } catch {
      load()
    }
  }

  // ── Tactic mutations ──────────────────────────────────────────────────────────

  async function handleToggleTactic(taskId: string, done: boolean) {
    const next = done ? 'todo' : 'done'
    setTactics(prev => prev.map(t => t.id === taskId ? { ...t, status: next } : t))
    try {
      await updateTask(taskId, { status: next })
    } catch {
      load()
    }
  }

  async function handleAddTactic(goalId: string, title: string): Promise<Task> {
    const created = await createTask({ title, goal_id: goalId, status: 'todo', is_recurring: true })
    setTactics(prev => [...prev, created])
    return created
  }

  // ── Habit linking ─────────────────────────────────────────────────────────────

  async function handleLinkHabit(goalId: string, habitId: string) {
    await linkHabitToGoal(goalId, habitId)
    const habit = allHabits.find(h => h.id === habitId)
    if (!habit) return
    setGoalHabits(prev => [...prev, { goal_id: goalId, habit_id: habitId, habit }])
    // Load logs for newly linked habit if not already present
    if (!logMap.has(habitId)) {
      const goal = goals.find(g => g.id === goalId)
      if (goal) {
        const startDate = goal.start_date ?? goal.created_at?.slice(0, 10) ?? today
        const logs = await getHabitLogsForWeek([habitId], startDate, today)
        setLogMap(prev => {
          const next = new Map(prev)
          const dates = new Set<string>()
          for (const log of logs) dates.add(log.logged_date)
          next.set(habitId, dates)
          return next
        })
      }
    }
  }

  async function handleUnlinkHabit(goalId: string, habitId: string) {
    setGoalHabits(prev => prev.filter(gh => !(gh.goal_id === goalId && gh.habit_id === habitId)))
    try {
      await unlinkHabitFromGoal(goalId, habitId)
    } catch {
      load()
    }
  }

  // ── Tactic input helpers ──────────────────────────────────────────────────────

  function setTacticAt(i: number, val: string) {
    setNewTactics(prev => prev.map((t, idx) => idx === i ? val : t))
  }

  function addTacticRow() {
    setNewTactics(prev => [...prev, ''])
  }

  function removeTacticRow(i: number) {
    setNewTactics(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [''])
  }

  // ── Derived state ─────────────────────────────────────────────────────────────

  // Index: goalId → tactics[]
  const tacticsByGoal = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tactics) {
      if (!t.goal_id) continue
      if (!map.has(t.goal_id)) map.set(t.goal_id, [])
      map.get(t.goal_id)!.push(t)
    }
    return map
  }, [tactics])

  // Index: goalId → Habit[]
  const habitsByGoal = useMemo(() => {
    const map = new Map<string, Habit[]>()
    for (const gh of goalHabits) {
      if (!map.has(gh.goal_id)) map.set(gh.goal_id, [])
      map.get(gh.goal_id)!.push(gh.habit)
    }
    return map
  }, [goalHabits])

  const counts = useMemo(() => ({
    all:    goals.length,
    active: goals.filter(g => (g.status ?? 'active') === 'active').length,
    paused: goals.filter(g => g.status === 'paused').length,
    done:   goals.filter(g => g.status === 'done').length,
  }), [goals])

  const visible = useMemo(() =>
    goals.filter(g =>
      statusFilter === 'all' ? true : (g.status ?? 'active') === statusFilter
    ),
    [goals, statusFilter],
  )

  // ── Render ────────────────────────────────────────────────────────────────────

  const inputBase =
    'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-[1px] focus:border-goals transition-colors'

  const STATUS_LABELS: Record<StatusFilter, string> = {
    all: 'All', active: 'Active', paused: 'Paused', done: 'Done',
  }

  return (
    <div className="p-6 max-w-3xl">

      {/* Page header */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Goals</h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {loading ? '—' : counts.active > 0 ? `${counts.active} active` : 'No active goals.'}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <MetricCard label="Total"  value={loading ? '—' : counts.all} />
        <MetricCard label="Active" value={loading ? '—' : counts.active} />
        <MetricCard label="Done"   value={loading ? '—' : counts.done} />
      </div>

      {/* ── Add goal form ── */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-5">
        {/* Row 1: title + submit */}
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="New goal…"
            className={`flex-1 ${inputBase}`}
            autoComplete="off"
          />
          <Button
            variant="primary"
            intent="goals"
            size="md"
            type="submit"
            disabled={!newTitle.trim() || adding}
          >
            Add
          </Button>
        </div>

        {/* Row 2: vision (shown when title has content) */}
        {newTitle.trim() && (
          <>
            <input
              value={newVision}
              onChange={e => setNewVision(e.target.value)}
              placeholder="Vision — why does this goal matter?"
              className={inputBase}
              autoComplete="off"
            />

            {/* Tactics */}
            <div className="flex flex-col gap-1">
              <p className="text-[11px] text-foreground-tertiary px-1">Tactics (weekly actions)</p>
              {newTactics.map((tactic, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={tactic}
                    onChange={e => setTacticAt(i, e.target.value)}
                    placeholder={`Tactic ${i + 1}…`}
                    className={`flex-1 ${inputBase}`}
                    autoComplete="off"
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addTacticRow() }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeTacticRow(i)}
                    className="w-8 h-8 rounded-lg text-foreground-tertiary hover:text-foreground hover:bg-background-secondary transition-colors text-[16px]"
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addTacticRow}
                className="self-start text-[12px] text-goals hover:opacity-75 transition-opacity px-1"
              >
                + Add tactic
              </button>
            </div>
          </>
        )}
      </form>

      {/* Status filter */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'secondary' : 'ghost'}
            intent="goals"
            onClick={() => setStatusFilter(s)}
          >
            {STATUS_LABELS[s]}
            {counts[s] > 0 && (
              <span className="ml-1 text-[11px] opacity-70">{counts[s]}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Goal cards */}
      <Card>
        {loading ? (
          <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
        ) : error ? (
          <p className="text-[13px] text-finance py-1">{error}</p>
        ) : visible.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-1">No goals here.</p>
        ) : (
          <div>
            {visible.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                tactics={tacticsByGoal.get(goal.id) ?? []}
                linkedHabits={habitsByGoal.get(goal.id) ?? []}
                habitLogsByHabit={logMap}
                allHabits={allHabits}
                today={today}
                weekDates={weekDates}
                onDelete={handleDeleteGoal}
                onToggleTactic={handleToggleTactic}
                onAddTactic={handleAddTactic}
                onLinkHabit={handleLinkHabit}
                onUnlinkHabit={handleUnlinkHabit}
              />
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
