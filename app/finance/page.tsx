'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getTransactions, createTransaction, deleteTransaction,
  getBudgets,
} from '@/lib/queries/finance'
import { pad, todayStr } from '@/lib/utils'
import type { Transaction, Budget } from '@/types'
import MetricCard      from '@/components/ui/MetricCard'
import Card            from '@/components/ui/Card'
import Badge           from '@/components/ui/Badge'
import Button          from '@/components/ui/Button'
import BudgetRow       from '@/components/finance/BudgetRow'
import TransactionForm from '@/components/finance/TransactionForm'
import type { TransactionInsert } from '@/types'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function shiftMonth(m: string, delta: 1 | -1): string {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function formatMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatTxDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [month,        setMonth]        = useState(() => currentMonth())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets,      setBudgets]      = useState<Budget[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  const today = useMemo(() => todayStr(), [])

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [txs, bgs] = await Promise.all([
        getTransactions({ month }),
        getBudgets(month),
      ])
      setTransactions(txs)
      setBudgets(bgs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  // ── Mutations ───────────────────────────────────────────────────────────────

  async function handleAdd(payload: TransactionInsert) {
    const created = await createTransaction(payload)
    // Only add to list if the transaction's date falls in the current month
    if (created.date.startsWith(month)) {
      setTransactions(prev => [created, ...prev])
    }
  }

  async function handleDelete(id: string) {
    setTransactions(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTransaction(id)
    } catch {
      load()
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const totalIncome   = transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const balance = totalIncome - totalExpenses

  // Expense totals keyed by category — used by BudgetRow
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.category) continue
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    return map
  }, [transactions])

  // ── Render ──────────────────────────────────────────────────────────────────

  const balanceStr = `${balance < 0 ? '−' : ''}${fmt(balance)}`

  return (
    <div className="p-6 max-w-3xl">

      {/* Page header + month nav */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Finance</h1>
      <div className="flex items-center gap-2 mb-6">
        <Button
          size="sm"
          variant="ghost"
          intent="neutral"
          onClick={() => setMonth(m => shiftMonth(m, -1))}
        >
          ←
        </Button>
        <span className="text-[14px] text-foreground-secondary min-w-[120px] text-center">
          {formatMonth(month)}
        </span>
        <Button
          size="sm"
          variant="ghost"
          intent="neutral"
          onClick={() => setMonth(m => shiftMonth(m, 1))}
        >
          →
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-[10px] mb-6">
        <MetricCard label="Income"   value={loading ? '—' : fmt(totalIncome)} />
        <MetricCard label="Expenses" value={loading ? '—' : fmt(totalExpenses)} />
        <MetricCard
          label="Balance"
          value={loading ? '—' : balanceStr}
          sub={!loading && balance < 0 ? 'over income' : undefined}
        />
      </div>

      {/* Log transaction */}
      <div className="mb-5">
        <TransactionForm onAdd={handleAdd} defaultDate={today} />
      </div>

      {/* Budget categories */}
      <Card title="Budgets" className="mb-4">
        {loading ? (
          <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
        ) : error ? (
          <p className="text-[13px] text-finance py-1">{error}</p>
        ) : budgets.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-1">No budgets for this month.</p>
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

      {/* Transaction list */}
      <Card title="Transactions">
        {loading ? (
          <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
        ) : error ? (
          <p className="text-[13px] text-finance py-1">{error}</p>
        ) : transactions.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-1">No transactions this month.</p>
        ) : (
          <div>
            {transactions.map(t => (
              <div
                key={t.id}
                className="group flex items-center gap-[10px] py-[7px] border-b-[0.5px] border-line-subtle last:border-b-0 text-[13px]"
              >
                {/* Date */}
                <span className="text-[11px] text-foreground-tertiary w-[42px] flex-shrink-0">
                  {formatTxDate(t.date)}
                </span>

                {/* Category / note */}
                <span className="flex-1 text-foreground">
                  {t.category || t.note || (
                    <span className="text-foreground-tertiary">—</span>
                  )}
                </span>

                {/* Note (only if category also set) */}
                {t.category && t.note && (
                  <span className="text-[11px] text-foreground-secondary hidden sm:inline">
                    {t.note}
                  </span>
                )}

                {/* Type badge */}
                <Badge intent={t.type === 'income' ? 'habits' : 'finance'}>
                  {t.type}
                </Badge>

                {/* Amount */}
                <span className={cn(
                  'text-[13px] tabular-nums flex-shrink-0',
                  t.type === 'income' ? 'text-habits' : 'text-foreground',
                )}>
                  {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                </span>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  aria-label="Delete transaction"
                  className="opacity-0 group-hover:opacity-100 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
