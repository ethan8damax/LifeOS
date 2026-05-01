'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getGoals, createGoal, deleteGoal,
  getGoalHabitsWithHabits, linkHabitToGoal, unlinkHabitFromGoal,
} from '@/lib/queries/goals'
import { getHabits, getHabitLogsForWeek } from '@/lib/queries/habits'
import { getLists, getAllListItems, getListsForGoals, linkListToGoal, unlinkListFromGoal } from '@/lib/queries/lists'
import { todayStr, getWeekDates }         from '@/lib/utils'
import type { Goal, Habit, List, ListItem, ListWithItems, GoalHabitWithHabit } from '@/types'
import MetricCard from '@/components/ui/MetricCard'
import Card       from '@/components/ui/Card'
import Button     from '@/components/ui/Button'
import GoalCard   from '@/components/goals/GoalCard'

// ── Page ──────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'paused' | 'done'

export default function GoalsPage() {
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [goalHabits,   setGoalHabits]   = useState<GoalHabitWithHabit[]>([])
  const [allHabits,    setAllHabits]    = useState<Habit[]>([])
  const [logMap,       setLogMap]       = useState<Map<string, Set<string>>>(new Map())
  const [allLists,     setAllLists]     = useState<List[]>([])
  const [allItems,     setAllItems]     = useState<ListItem[]>([])
  // goalId → ListWithItems[]
  const [goalListMap,  setGoalListMap]  = useState<Map<string, ListWithItems[]>>(new Map())
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // Add-goal form
  const [newTitle,  setNewTitle]  = useState('')
  const [newVision, setNewVision] = useState('')
  const [adding,    setAdding]    = useState(false)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')

  const today     = useMemo(() => todayStr(), [])
  const weekDates = useMemo(() => getWeekDates(), [])

  // ── Load ──────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setError(null)
    try {
      const [allGoals, habits, lists, items] = await Promise.all([
        getGoals(),
        getHabits(),
        getLists(),
        getAllListItems(),
      ])
      setGoals(allGoals)
      setAllHabits(habits)
      setAllLists(lists)
      setAllItems(items)

      const goalIds = allGoals.map(g => g.id)

      const [ghRows, goalListRows] = await Promise.all([
        getGoalHabitsWithHabits(goalIds),
        getListsForGoals(goalIds),
      ])
      setGoalHabits(ghRows)

      // Build goalId → ListWithItems[] map, enriching with items from allItems
      const itemsByList: Record<string, ListItem[]> = {}
      for (const item of items) {
        if (!item.list_id) continue
        if (!itemsByList[item.list_id]) itemsByList[item.list_id] = []
        itemsByList[item.list_id].push(item)
      }
      const glMap = new Map<string, ListWithItems[]>()
      for (const { goal_id, list } of goalListRows) {
        if (!glMap.has(goal_id)) glMap.set(goal_id, [])
        const withItems: ListWithItems = { ...list, items: itemsByList[list.id] ?? list.items }
        glMap.get(goal_id)!.push(withItems)
      }
      setGoalListMap(glMap)

      // Load habit logs for the full span of all goals
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
    setError(null)
    try {
      const created = await createGoal({
        title:  trimmedTitle,
        vision: newVision.trim() || null,
        status: 'active',
      })
      setGoals(prev => [created, ...prev])
      setNewTitle('')
      setNewVision('')
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to add goal.')
    } finally {
      setAdding(false)
    }
  }

  // ── Goal mutations ────────────────────────────────────────────────────────────

  async function handleDeleteGoal(goalId: string) {
    setGoals(prev => prev.filter(g => g.id !== goalId))
    setGoalHabits(prev => prev.filter(gh => gh.goal_id !== goalId))
    setGoalListMap(prev => { const next = new Map(prev); next.delete(goalId); return next })
    try {
      await deleteGoal(goalId)
    } catch {
      load()
    }
  }

  // ── List linking ──────────────────────────────────────────────────────────────

  async function handleLinkList(goalId: string, listId: string) {
    const list = allLists.find(l => l.id === listId)
    if (!list) return
    const itemsByList: Record<string, ListItem[]> = {}
    for (const item of allItems) {
      if (!item.list_id) continue
      if (!itemsByList[item.list_id]) itemsByList[item.list_id] = []
      itemsByList[item.list_id].push(item)
    }
    const withItems: ListWithItems = { ...list, items: itemsByList[listId] ?? [] }
    setGoalListMap(prev => {
      const next = new Map(prev)
      const existing = next.get(goalId) ?? []
      next.set(goalId, [...existing, withItems])
      return next
    })
    await linkListToGoal(goalId, listId)
  }

  async function handleUnlinkList(goalId: string, listId: string) {
    setGoalListMap(prev => {
      const next = new Map(prev)
      next.set(goalId, (next.get(goalId) ?? []).filter(l => l.id !== listId))
      return next
    })
    try {
      await unlinkListFromGoal(goalId, listId)
    } catch {
      load()
    }
  }

  // ── Habit linking ─────────────────────────────────────────────────────────────

  async function handleLinkHabit(goalId: string, habitId: string) {
    await linkHabitToGoal(goalId, habitId)
    const habit = allHabits.find(h => h.id === habitId)
    if (!habit) return
    setGoalHabits(prev => [...prev, { goal_id: goalId, habit_id: habitId, habit }])
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

  // ── Derived state ─────────────────────────────────────────────────────────────

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
    <div className="p-6 max-w-3xl mx-auto">

      {/* Page header */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Goals</h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {loading ? '—' : counts.active > 0 ? `${counts.active} active` : 'No active goals.'}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] mb-6">
        <MetricCard label="Total"  value={loading ? '—' : counts.all} />
        <MetricCard label="Active" value={loading ? '—' : counts.active} />
        <MetricCard label="Done"   value={loading ? '—' : counts.done} />
      </div>

      {error && (
        <p className="text-[13px] text-finance mb-3">{error}</p>
      )}

      {/* ── Add goal form ── */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-5">
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

        {newTitle.trim() && (
          <input
            value={newVision}
            onChange={e => setNewVision(e.target.value)}
            placeholder="Vision — why does this goal matter?"
            className={inputBase}
            autoComplete="off"
          />
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
                linkedLists={goalListMap.get(goal.id) ?? []}
                linkedHabits={habitsByGoal.get(goal.id) ?? []}
                habitLogsByHabit={logMap}
                allHabits={allHabits}
                allLists={allLists}
                today={today}
                weekDates={weekDates}
                onDelete={handleDeleteGoal}
                onLinkList={handleLinkList}
                onUnlinkList={handleUnlinkList}
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
