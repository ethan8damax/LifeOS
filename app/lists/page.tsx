'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  getLists, getAllListItems, createList, updateList, deleteList,
  createListItem, updateListItem, deleteListItem,
  clearCompletedItems, reorderListItems,
} from '@/lib/queries/lists'
import type { List, ListItem } from '@/types'
import { cn } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_ICONS = ['📋', '✅', '🛒', '💪', '📚', '🎯', '✈️', '🏠', '💡']

const PRESET_COLORS = [
  { hex: '1A6CD8', label: 'Blue'   },
  { hex: '534AB7', label: 'Purple' },
  { hex: '1D9E75', label: 'Teal'   },
  { hex: 'BA7517', label: 'Amber'  },
  { hex: '555555', label: 'Gray'   },
  { hex: 'C0392B', label: 'Red'    },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildItemMap(items: ListItem[]): Record<string, ListItem[]> {
  const map: Record<string, ListItem[]> = {}
  for (const item of items) {
    if (!item.list_id) continue
    if (!map[item.list_id]) map[item.list_id] = []
    map[item.list_id].push(item)
  }
  return map
}

// ── New list modal ────────────────────────────────────────────────────────────

function NewListModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (list: List) => void
}) {
  const [title,    setTitle]    = useState('')
  const [icon,     setIcon]     = useState('📋')
  const [color,    setColor]    = useState('1A6CD8')
  const [creating, setCreating] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setCreating(true)
    setError(null)
    try {
      const list = await createList({ title: trimmed, icon, color })
      onCreate(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative w-full max-w-[380px] bg-background border-[0.5px] border-line-subtle rounded-xl p-6 shadow-none">
        <h2 className="text-[15px] font-medium text-foreground mb-5">New list</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-foreground-secondary">Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="My list…"
              className="h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none"
            />
          </div>

          {/* Icon picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-foreground-secondary">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-[18px] flex items-center justify-center border-[0.5px] transition-colors',
                    icon === em
                      ? 'border-line bg-background-secondary'
                      : 'border-transparent hover:bg-background-secondary',
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] text-foreground-secondary">Color</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  aria-label={c.label}
                  onClick={() => setColor(c.hex)}
                  style={{ backgroundColor: `#${c.hex}` }}
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    color === c.hex ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : '',
                  )}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-[12px] text-finance">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!title.trim() || creating}
              className="flex-1 h-9 rounded-lg text-[13px] font-medium text-white disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: `#${color}` }}
            >
              {creating ? 'Creating…' : 'Create list'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border-[0.5px] border-line text-[13px] text-foreground-secondary hover:bg-background-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── List detail panel ─────────────────────────────────────────────────────────

function ListDetailPanel({
  list,
  items,
  onClose,
  onUpdateList,
  onDeleteList,
  onUpdateItems,
}: {
  list:          List
  items:         ListItem[]
  onClose:       () => void
  onUpdateList:  (id: string, patch: Partial<List>) => void
  onDeleteList:  (id: string) => void
  onUpdateItems: (listId: string, items: ListItem[]) => void
}) {
  const [localItems,    setLocalItems]    = useState<ListItem[]>(items)
  const [newContent,    setNewContent]    = useState('')
  const [adding,        setAdding]        = useState(false)
  const [editingTitle,  setEditingTitle]  = useState(false)
  const [editTitle,     setEditTitle]     = useState(list.title)
  const [editIcon,      setEditIcon]      = useState(list.icon)
  const [showIconPick,  setShowIconPick]  = useState(false)
  const [dragItemId,    setDragItemId]    = useState<string | null>(null)
  const [dragOverId,    setDragOverId]    = useState<string | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const titleRef  = useRef<HTMLInputElement>(null)

  // Keep local items in sync when parent updates (e.g. after clear completed)
  useEffect(() => { setLocalItems(items) }, [items])

  const checked   = localItems.filter(i => i.is_checked).length
  const total     = localItems.length
  const pct       = total > 0 ? Math.round((checked / total) * 100) : 0
  const accent    = `#${list.color}`

  // ── Quick add ───────────────────────────────────────────────────────────────

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    const content = newContent.trim()
    if (!content || adding) return
    setAdding(true)
    try {
      const sortOrder = localItems.length > 0
        ? Math.max(...localItems.map(i => i.sort_order)) + 1
        : 0
      const item = await createListItem({ list_id: list.id, content, sort_order: sortOrder })
      const next = [...localItems, item]
      setLocalItems(next)
      onUpdateItems(list.id, next)
      setNewContent('')
      // Keep focus on input so user can rapid-fire add
      setTimeout(() => inputRef.current?.focus(), 0)
    } finally {
      setAdding(false)
    }
  }

  // ── Toggle check ────────────────────────────────────────────────────────────

  async function handleToggle(item: ListItem) {
    const next = !item.is_checked
    const updated = localItems.map(i => i.id === item.id ? { ...i, is_checked: next } : i)
    setLocalItems(updated)
    onUpdateItems(list.id, updated)
    try {
      await updateListItem(item.id, { is_checked: next })
    } catch {
      setLocalItems(items)
      onUpdateItems(list.id, items)
    }
  }

  // ── Delete item ─────────────────────────────────────────────────────────────

  async function handleDeleteItem(itemId: string) {
    const next = localItems.filter(i => i.id !== itemId)
    setLocalItems(next)
    onUpdateItems(list.id, next)
    try {
      await deleteListItem(itemId)
    } catch {
      setLocalItems(items)
      onUpdateItems(list.id, items)
    }
  }

  // ── Clear completed ─────────────────────────────────────────────────────────

  async function handleClearCompleted() {
    const next = localItems.filter(i => !i.is_checked)
    setLocalItems(next)
    onUpdateItems(list.id, next)
    await clearCompletedItems(list.id)
  }

  // ── Edit title ──────────────────────────────────────────────────────────────

  async function commitTitle() {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === list.title) { setEditingTitle(false); return }
    await updateList(list.id, { title: trimmed })
    onUpdateList(list.id, { title: trimmed })
    setEditingTitle(false)
  }

  // ── Edit icon ───────────────────────────────────────────────────────────────

  async function handlePickIcon(em: string) {
    setEditIcon(em)
    setShowIconPick(false)
    await updateList(list.id, { icon: em })
    onUpdateList(list.id, { icon: em })
  }

  // ── Pin toggle ──────────────────────────────────────────────────────────────

  async function handleTogglePin() {
    const next = !list.is_pinned
    onUpdateList(list.id, { is_pinned: next })
    await updateList(list.id, { is_pinned: next })
  }

  // ── Drag & drop reorder ─────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, itemId: string) {
    setDragItemId(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, itemId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (itemId !== dragOverId) setDragOverId(itemId)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!dragItemId || dragItemId === targetId) {
      setDragItemId(null); setDragOverId(null); return
    }
    const reordered = [...localItems]
    const fromIdx   = reordered.findIndex(i => i.id === dragItemId)
    const toIdx     = reordered.findIndex(i => i.id === targetId)
    const [moved]   = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const withOrder = reordered.map((item, idx) => ({ ...item, sort_order: idx }))
    setLocalItems(withOrder)
    onUpdateItems(list.id, withOrder)
    setDragItemId(null)
    setDragOverId(null)
    reorderListItems(withOrder.map(i => ({ id: i.id, sort_order: i.sort_order })))
  }

  function handleDragEnd() {
    setDragItemId(null)
    setDragOverId(null)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-30 bg-foreground/10 md:bg-transparent"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-40 w-full md:w-[420px] bg-background border-l-[0.5px] border-line-subtle flex flex-col">

        {/* Panel header */}
        <div
          className="flex-shrink-0 px-5 pt-5 pb-4 border-b-[0.5px] border-line-subtle"
          style={{ borderTopColor: accent, borderTopWidth: '3px' }}
        >
          {/* Icon + title row */}
          <div className="flex items-start gap-3 mb-3">
            <button
              type="button"
              onClick={() => setShowIconPick(v => !v)}
              className="text-[24px] leading-none mt-0.5 hover:opacity-70 transition-opacity flex-shrink-0"
              aria-label="Change icon"
            >
              {editIcon}
            </button>

            {editingTitle ? (
              <input
                ref={titleRef}
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={e => { if (e.key === 'Enter') commitTitle() }}
                className="flex-1 text-[16px] font-medium text-foreground bg-transparent border-b-[0.5px] border-line focus:outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setEditingTitle(true); setTimeout(() => titleRef.current?.focus(), 0) }}
                className="flex-1 text-left text-[16px] font-medium text-foreground hover:opacity-70 transition-opacity"
              >
                {list.title}
              </button>
            )}

            {/* Pin + close */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                aria-label={list.is_pinned ? 'Unpin' : 'Pin'}
                onClick={handleTogglePin}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-[14px] transition-colors',
                  list.is_pinned ? 'text-foreground' : 'text-foreground-tertiary hover:text-foreground',
                )}
              >
                📌
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-colors text-[18px] leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Icon picker dropdown */}
          {showIconPick && (
            <div className="flex gap-2 flex-wrap mb-2">
              {PRESET_ICONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => handlePickIcon(em)}
                  className="w-9 h-9 rounded-lg text-[18px] flex items-center justify-center hover:bg-background-secondary transition-colors"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Progress bar + count */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[6px] rounded-full bg-background-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: accent }}
              />
            </div>
            <span className="text-[11px] text-foreground-tertiary flex-shrink-0 tabular-nums">
              {checked} of {total} done
            </span>
            {checked > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-[11px] text-foreground-tertiary hover:text-foreground transition-colors flex-shrink-0"
              >
                Clear done
              </button>
            )}
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto py-2">
          {localItems.length === 0 ? (
            <p className="text-[13px] text-foreground-tertiary px-5 py-4">
              No items yet. Add one below.
            </p>
          ) : (
            <div>
              {localItems.map(item => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item.id)}
                  onDragOver={e => handleDragOver(e, item.id)}
                  onDrop={e => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'group flex items-center gap-3 px-5 py-[9px] transition-colors',
                    dragOverId === item.id && dragItemId !== item.id
                      ? 'bg-background-secondary'
                      : 'hover:bg-background-secondary',
                    dragItemId === item.id ? 'opacity-40' : '',
                  )}
                >
                  {/* Drag handle */}
                  <span className="opacity-0 group-hover:opacity-40 cursor-grab text-foreground-tertiary text-[12px] select-none flex-shrink-0">
                    ⠿
                  </span>

                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={() => handleToggle(item)}
                    className="w-[15px] h-[15px] rounded border-line flex-shrink-0 cursor-pointer"
                    style={{ accentColor: accent }}
                  />

                  {/* Content */}
                  <span className={cn(
                    'flex-1 text-[13px] leading-snug',
                    item.is_checked ? 'line-through text-foreground-tertiary' : 'text-foreground',
                  )}>
                    {item.content}
                  </span>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    aria-label="Delete item"
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-opacity text-[16px] leading-none flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick add input */}
        <div className="flex-shrink-0 border-t-[0.5px] border-line-subtle px-5 py-3">
          <form onSubmit={handleAddItem} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Add an item…"
              className="flex-1 h-9 px-3 rounded-lg border-[0.5px] border-line bg-background-secondary text-[13px] text-foreground placeholder:text-foreground-tertiary focus:outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newContent.trim() || adding}
              className="h-9 px-4 rounded-lg text-[13px] font-medium text-white disabled:opacity-50 transition-opacity flex-shrink-0"
              style={{ backgroundColor: accent }}
            >
              Add
            </button>
          </form>
        </div>

        {/* Delete list footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t-[0.5px] border-line-subtle">
          <button
            type="button"
            onClick={() => { onDeleteList(list.id); onClose() }}
            className="text-[12px] text-foreground-tertiary hover:text-finance transition-colors"
          >
            Delete this list
          </button>
        </div>
      </div>
    </>
  )
}

// ── List card ─────────────────────────────────────────────────────────────────

function ListCard({
  list,
  items,
  onClick,
}: {
  list:    List
  items:   ListItem[]
  onClick: () => void
}) {
  const total   = items.length
  const checked = items.filter(i => i.is_checked).length
  const pct     = total > 0 ? Math.round((checked / total) * 100) : 0
  const accent  = `#${list.color}`

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left bg-background border-[0.5px] border-line-subtle rounded-xl p-4 hover:border-line transition-colors"
      style={{ borderTopColor: accent, borderTopWidth: '2px' }}
    >
      <div className="flex items-start gap-2 mb-3">
        <span className="text-[20px] leading-none flex-shrink-0">{list.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-medium text-foreground truncate">
              {list.title}
            </span>
            {list.is_pinned && (
              <span className="text-[11px] text-foreground-tertiary flex-shrink-0">📌</span>
            )}
          </div>
          <span className="text-[12px] text-foreground-tertiary">
            {total === 0
              ? 'Empty'
              : checked === total
              ? 'All done'
              : `${checked} of ${total} done`}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-[6px] rounded-full bg-background-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: accent }}
          />
        </div>
      )}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ListsPage() {
  const [lists,        setLists]        = useState<List[]>([])
  const [allItems,     setAllItems]     = useState<ListItem[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [morningMode,  setMorningMode]  = useState(false)

  // ── Data ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ls, items] = await Promise.all([getLists(), getAllListItems()])
      setLists(ls)
      setAllItems(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lists')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived ─────────────────────────────────────────────────────────────────

  const itemsByList = useMemo(() => buildItemMap(allItems), [allItems])

  const selectedList = useMemo(
    () => lists.find(l => l.id === selectedId) ?? null,
    [lists, selectedId],
  )

  const selectedItems = useMemo(
    () => (selectedId ? (itemsByList[selectedId] ?? []) : []),
    [selectedId, itemsByList],
  )

  // Morning mode: pinned lists, with "Today"/"Daily" first
  const morningLists = useMemo(() => {
    const pinned = lists.filter(l => l.is_pinned)
    const base   = pinned.length > 0 ? pinned : lists.slice(0, 3)
    return [...base].sort((a, b) => {
      const priority = (t: string) => /^(today|daily)$/i.test(t.trim()) ? 0 : 1
      return priority(a.title) - priority(b.title)
    })
  }, [lists])

  // ── Mutations ───────────────────────────────────────────────────────────────

  function handleUpdateList(id: string, patch: Partial<List>) {
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  function handleDeleteList(id: string) {
    setLists(prev => prev.filter(l => l.id !== id))
    setAllItems(prev => prev.filter(i => i.list_id !== id))
    deleteList(id)
  }

  function handleUpdateItems(listId: string, items: ListItem[]) {
    setAllItems(prev => [
      ...prev.filter(i => i.list_id !== listId),
      ...items,
    ])
  }

  function handleCreated(list: List) {
    setLists(prev => [list, ...prev])
    setShowNewModal(false)
    setSelectedId(list.id)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const pinnedLists  = lists.filter(l => l.is_pinned)
  const regularLists = lists.filter(l => !l.is_pinned)

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[20px] font-medium text-foreground">Lists</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMorningMode(v => !v)}
            className={cn(
              'h-8 px-3 rounded-lg text-[12px] font-medium border-[0.5px] transition-colors',
              morningMode
                ? 'bg-goals-subtle text-goals-on-subtle border-transparent'
                : 'border-line text-foreground-secondary hover:bg-background-secondary',
            )}
          >
            ☀️ Morning
          </button>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="h-8 px-3 rounded-lg bg-lists text-white text-[12px] font-medium transition-opacity hover:opacity-90"
          >
            + New list
          </button>
        </div>
      </div>

      <p className="text-[14px] text-foreground-secondary mb-6">
        {loading ? '—' : `${lists.length} ${lists.length === 1 ? 'list' : 'lists'}`}
      </p>

      {error && <p className="text-[13px] text-finance mb-4">{error}</p>}

      {/* Morning mode */}
      {morningMode && !loading && (
        <div className="mb-6 bg-goals-subtle rounded-xl p-4">
          <p className="text-[11px] text-goals-on-subtle opacity-70 mb-3">
            ☀️ Morning mode — pinned lists
          </p>
          {morningLists.length === 0 ? (
            <p className="text-[13px] text-goals-on-subtle opacity-70">
              Pin a list to see it here each morning.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {morningLists.map(l => {
                const items   = itemsByList[l.id] ?? []
                const unchecked = items.filter(i => !i.is_checked)
                const isToday   = /^(today|daily)$/i.test(l.title.trim())
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => { setMorningMode(false); setSelectedId(l.id) }}
                    className="flex items-center gap-3 text-left"
                  >
                    <span className="text-[18px]">{l.icon}</span>
                    <div className="flex-1">
                      <span className={cn(
                        'text-[13px] font-medium text-goals-on-subtle',
                        isToday && 'underline',
                      )}>
                        {l.title}
                      </span>
                    </div>
                    <span className="text-[12px] text-goals-on-subtle opacity-70">
                      {unchecked.length} left
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <p className="text-[13px] text-foreground-tertiary">Loading…</p>
      ) : lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-[40px]">📋</span>
          <p className="text-[14px] text-foreground-secondary">No lists yet.</p>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="h-9 px-4 rounded-lg bg-lists text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            Create your first list
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* Pinned */}
          {pinnedLists.length > 0 && (
            <div>
              <p className="text-[11px] text-foreground-tertiary mb-3 uppercase tracking-wide">
                Pinned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pinnedLists.map(list => (
                  <ListCard
                    key={list.id}
                    list={list}
                    items={itemsByList[list.id] ?? []}
                    onClick={() => setSelectedId(list.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All lists */}
          {regularLists.length > 0 && (
            <div>
              {pinnedLists.length > 0 && (
                <p className="text-[11px] text-foreground-tertiary mb-3 uppercase tracking-wide">
                  All lists
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regularLists.map(list => (
                  <ListCard
                    key={list.id}
                    list={list}
                    items={itemsByList[list.id] ?? []}
                    onClick={() => setSelectedId(list.id)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* New list modal */}
      {showNewModal && (
        <NewListModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreated}
        />
      )}

      {/* Detail panel */}
      {selectedList && (
        <ListDetailPanel
          list={selectedList}
          items={selectedItems}
          onClose={() => setSelectedId(null)}
          onUpdateList={handleUpdateList}
          onDeleteList={handleDeleteList}
          onUpdateItems={handleUpdateItems}
        />
      )}

    </div>
  )
}
