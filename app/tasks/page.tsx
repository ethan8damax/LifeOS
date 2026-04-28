'use client'

import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/queries/tasks'
import type { Task } from '@/types'
import MetricCard  from '@/components/ui/MetricCard'
import Card        from '@/components/ui/Card'
import Button      from '@/components/ui/Button'
import QuickAdd    from '@/components/tasks/QuickAdd'
import TaskList    from '@/components/tasks/TaskList'

type StatusFilter = 'all' | 'todo' | 'in_progress' | 'done'

const STATUS_LABELS: Record<StatusFilter, string> = {
  all:         'All',
  todo:        'To do',
  in_progress: 'In progress',
  done:        'Done',
}

export default function TasksPage() {
  const [tasks,        setTasks]        = useState<Task[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tagFilter,    setTagFilter]    = useState<string | null>(null)

  // ── Data loading ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (e) {
      setError((e as { message?: string })?.message ?? 'Failed to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Mutations ─────────────────────────────────────────────────────────────────

  async function handleAdd(title: string, tag?: string) {
    const created = await createTask({ title, tag: tag ?? null })
    setTasks(prev => [created, ...prev])
  }

  async function handleToggle(id: string, done: boolean) {
    const next = done ? 'done' : 'todo'
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t))
    try {
      await updateTask(id, { status: next })
    } catch {
      load() // revert by re-fetching
    }
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTask(id)
    } catch {
      load()
    }
  }

  async function handleStatusChange(id: string, status: 'todo' | 'in_progress' | 'done') {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    try {
      await updateTask(id, { status })
    } catch {
      load()
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────────

  // Unique tags across all tasks (for tag filter pills)
  const allTags = Array.from(
    new Set(tasks.map(t => t.tag).filter((t): t is string => !!t))
  )

  // Counts per status (always from the full task list)
  const counts: Record<StatusFilter, number> = {
    all:         tasks.length,
    todo:        tasks.filter(t => (t.status ?? 'todo') === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
  }

  // Visible tasks after applying both filters
  const visible = tasks.filter(t => {
    const status = t.status ?? 'todo'
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'todo' && status === 'todo') ||
      status === statusFilter
    const matchesTag = !tagFilter || t.tag === tagFilter
    return matchesStatus && matchesTag
  })

  const remaining = counts.todo + counts.in_progress

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl">

      {/* Page header */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Tasks</h1>
      <p className="text-[14px] text-foreground-secondary mb-6">
        {loading
          ? '—'
          : remaining === 0 && counts.all > 0
            ? 'All done.'
            : `${remaining} remaining`}
      </p>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <MetricCard
          label="Total"
          value={loading ? '—' : counts.all}
        />
        <MetricCard
          label="Remaining"
          value={loading ? '—' : remaining}
          sub={!loading && counts.in_progress > 0 ? `${counts.in_progress} in progress` : undefined}
        />
        <MetricCard
          label="Completed"
          value={loading ? '—' : counts.done}
          valueSub={!loading && counts.all > 0 ? `/ ${counts.all}` : undefined}
        />
      </div>

      {/* Quick add */}
      <div className="mb-5">
        <QuickAdd onAdd={handleAdd} />
      </div>

      {/* Filter bar — status pills then tag pills, divided by a line */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'secondary' : 'ghost'}
            intent="tasks"
            onClick={() => setStatusFilter(s)}
          >
            {STATUS_LABELS[s]}
            {counts[s] > 0 && (
              <span className="ml-1 text-[11px] opacity-70">{counts[s]}</span>
            )}
          </Button>
        ))}

        {allTags.length > 0 && (
          <>
            {/* Divider */}
            <span className="w-px h-4 bg-line-subtle mx-1 flex-shrink-0" />
            {allTags.map(tag => (
              <Button
                key={tag}
                size="sm"
                variant={tagFilter === tag ? 'secondary' : 'ghost'}
                intent="neutral"
                onClick={() => setTagFilter(prev => prev === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </>
        )}
      </div>

      {/* Task list */}
      <Card>
        {loading ? (
          <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
        ) : error ? (
          <p className="text-[13px] text-finance py-1">{error}</p>
        ) : (
          <TaskList
            tasks={visible}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </Card>

    </div>
  )
}
