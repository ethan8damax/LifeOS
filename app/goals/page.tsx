'use client'

import { useState, useEffect, useCallback } from 'react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/lib/queries/goals'
import type { Goal } from '@/types'
import MetricCard  from '@/components/ui/MetricCard'
import Card        from '@/components/ui/Card'
import Button      from '@/components/ui/Button'
import GoalProgress from '@/components/goals/GoalProgress'

type StatusFilter = 'all' | 'active' | 'paused' | 'done'

const STATUS_LABELS: Record<StatusFilter, string> = {
  all:    'All',
  active: 'Active',
  paused: 'Paused',
  done:   'Done',
}

export default function GoalsPage() {
  const [goals,        setGoals]        = useState<Goal[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [newTitle,     setNewTitle]     = useState('')
  const [newDate,      setNewDate]      = useState('')
  const [adding,       setAdding]       = useState(false)

  // ── Data loading ──────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await getGoals()
      setGoals(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load goals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Mutations ─────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      const created = await createGoal({
        title:       trimmed,
        target_date: newDate || null,
        status:      'active',
        progress:    0,
      })
      setGoals(prev => [created, ...prev])
      setNewTitle('')
      setNewDate('')
    } finally {
      setAdding(false)
    }
  }

  async function handleUpdateProgress(id: string, progress: number) {
    // Optimistic update
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g))
    try {
      await updateGoal(id, { progress })
    } catch {
      load()
    }
  }

  async function handleDelete(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id))
    try {
      await deleteGoal(id)
    } catch {
      load()
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────────

  const counts: Record<StatusFilter, number> = {
    all:    goals.length,
    active: goals.filter(g => (g.status ?? 'active') === 'active').length,
    paused: goals.filter(g => g.status === 'paused').length,
    done:   goals.filter(g => g.status === 'done').length,
  }

  const avgProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / goals.length)
    : 0

  const visible = goals.filter(g => {
    if (statusFilter === 'all') return true
    return (g.status ?? 'active') === statusFilter
  })

  // ── Render ────────────────────────────────────────────────────────────────────

  const inputBase =
    'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-[1px] focus:border-goals transition-colors'

  return (
    <div className="p-6 max-w-3xl">

      {/* Page header */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Goals</h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {loading
          ? '—'
          : counts.done > 0 && goals.length > 0
            ? `${counts.done} of ${goals.length} complete`
            : counts.active > 0
              ? `${counts.active} active`
              : 'No goals yet.'}
      </p>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <MetricCard label="Total"    value={loading ? '—' : counts.all} />
        <MetricCard label="Active"   value={loading ? '—' : counts.active} />
        <MetricCard
          label="Avg progress"
          value={loading ? '—' : `${avgProgress}%`}
          sub={!loading && counts.done > 0 ? `${counts.done} done` : undefined}
        />
      </div>

      {/* Add goal form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-5">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New goal…"
          className={`flex-1 ${inputBase}`}
          autoComplete="off"
        />
        <input
          type="date"
          value={newDate}
          onChange={e => setNewDate(e.target.value)}
          className={`w-[140px] ${inputBase}`}
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
      </form>

      {/* Status filter pills */}
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

      {/* Goal list */}
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
              <GoalProgress
                key={goal.id}
                goal={goal}
                onUpdate={handleUpdateProgress}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
