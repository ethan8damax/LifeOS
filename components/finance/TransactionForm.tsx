'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { TransactionInsert } from '@/types'

interface TransactionFormProps {
  onAdd:       (payload: TransactionInsert) => Promise<void>
  defaultDate: string
}

export default function TransactionForm({ onAdd, defaultDate }: TransactionFormProps) {
  const [amount,   setAmount]   = useState('')
  const [type,     setType]     = useState<'expense' | 'income'>('expense')
  const [category, setCategory] = useState('')
  const [note,     setNote]     = useState('')
  const [busy,     setBusy]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return
    setBusy(true)
    try {
      await onAdd({
        amount:   parsed,
        type,
        category: category.trim() || null,
        note:     note.trim()     || null,
        date:     defaultDate,
      })
      setAmount('')
      setCategory('')
      setNote('')
    } finally {
      setBusy(false)
    }
  }

  const inputBase =
    'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-[1px] focus:border-finance transition-colors'

  const canSubmit = parseFloat(amount) > 0 && !busy

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">

      {/* Amount */}
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount"
        className={`w-[96px] ${inputBase}`}
        autoComplete="off"
      />

      {/* Type toggle */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={type === 'expense' ? 'secondary' : 'ghost'}
          intent="finance"
          onClick={() => setType('expense')}
        >
          Expense
        </Button>
        <Button
          type="button"
          size="sm"
          variant={type === 'income' ? 'secondary' : 'ghost'}
          intent="habits"
          onClick={() => setType('income')}
        >
          Income
        </Button>
      </div>

      {/* Category */}
      <input
        value={category}
        onChange={e => setCategory(e.target.value)}
        placeholder="Category"
        className={`w-[100px] ${inputBase}`}
        autoComplete="off"
      />

      {/* Note */}
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Note"
        className={`flex-1 min-w-[100px] ${inputBase}`}
        autoComplete="off"
      />

      <Button
        variant="primary"
        intent="finance"
        size="md"
        type="submit"
        disabled={!canSubmit}
      >
        Log
      </Button>

    </form>
  )
}
