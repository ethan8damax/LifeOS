'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface QuickAddProps {
  onAdd: (title: string, tag?: string) => Promise<void>
}

export default function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState('')
  const [tag,   setTag]   = useState('')
  const [busy,  setBusy]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      await onAdd(trimmed, tag.trim() || undefined)
      setTitle('')
      setTag('')
    } finally {
      setBusy(false)
    }
  }

  const inputBase =
    'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-[1px] focus:border-tasks transition-colors'

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Add a task…"
        className={`flex-1 ${inputBase}`}
        autoComplete="off"
      />
      {/* Small tag field — optional */}
      <input
        value={tag}
        onChange={e => setTag(e.target.value)}
        placeholder="tag"
        className={`w-[72px] ${inputBase}`}
        autoComplete="off"
      />
      <Button
        variant="primary"
        intent="tasks"
        size="md"
        type="submit"
        disabled={!title.trim() || busy}
      >
        Add
      </Button>
    </form>
  )
}
