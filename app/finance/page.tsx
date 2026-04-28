'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  getTransactions, createTransaction, deleteTransaction,
  getBudgets, createBudget, updateBudget, deleteBudget,
} from '@/lib/queries/finance'
import { pad, todayStr } from '@/lib/utils'
import type { Transaction, Budget, TransactionInsert } from '@/types'
import MetricCard      from '@/components/ui/MetricCard'
import Card            from '@/components/ui/Card'
import Badge           from '@/components/ui/Badge'
import Button          from '@/components/ui/Button'
import BudgetRow       from '@/components/finance/BudgetRow'
import TransactionForm from '@/components/finance/TransactionForm'
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

  // Create budget form
  const [newCat,      setNewCat]      = useState('')
  const [newLimit,    setNewLimit]    = useState('')
  const [addingBudget, setAddingBudget] = useState(false)

  // Inline "set limit" for unbudgeted categories
  const [settingLimitFor, setSettingLimitFor] = useState<string | null>(null)
  const [inlineLimit,     setInlineLimit]     = useState('')
  const inlineLimitRef = useRef<HTMLInputElement>(null)

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
      setError((e as { message?: string })?.message ?? 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  // Focus the inline input when it appears
  useEffect(() => {
    if (settingLimitFor) inlineLimitRef.current?.focus()
  }, [settingLimitFor])

  // ── Transaction mutations ───────────────────────────────────────────────────

  async function handleAddTransaction(payload: TransactionInsert) {
    const created = await createTransaction(payload)
    if (created.date.startsWith(month)) {
      setTransactions(prev => [created, ...prev])
    }
  }

  async function handleDeleteTransaction(id: string) {
    setTransactions(prev => prev.filter(t => t.id !== id))
    try {
      await deleteTransaction(id)
    } catch {
      load()
    }
  }

  // ── Budget mutations ────────────────────────────────────────────────────────

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault()
    const cat   = newCat.trim()
    const limit = parseFloat(newLimit)
    if (!cat || !(limit > 0)) return
    setAddingBudget(true)
    try {
      const existing = budgets.find(b => b.category.toLowerCase() === cat.toLowerCase())
      if (existing) {
        // Update the limit if the category already has a budget this month
        const updated = await updateBudget(existing.id, { limit_amount: limit })
        setBudgets(prev => prev.map(b => b.id === existing.id ? updated : b))
      } else {
        const created = await createBudget({ category: cat, limit_amount: limit, month })
        setBudgets(prev => [...prev, created].sort((a, b) => a.category.localeCompare(b.category)))
      }
      setNewCat('')
      setNewLimit('')
    } finally {
      setAddingBudget(false)
    }
  }

  async function handleDeleteBudget(id: string) {
    setBudgets(prev => prev.filter(b => b.id !== id))
    try {
      await deleteBudget(id)
    } catch {
      load()
    }
  }

  async function handleSetInlineLimit(e: React.FormEvent, category: string) {
    e.preventDefault()
    const limit = parseFloat(inlineLimit)
    if (!(limit > 0)) return
    try {
      const created = await createBudget({ category, limit_amount: limit, month })
      setBudgets(prev => [...prev, created].sort((a, b) => a.category.localeCompare(b.category)))
      setSettingLimitFor(null)
      setInlineLimit('')
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

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.category) continue
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    }
    return map
  }, [transactions])

  // Expense categories with spending but no budget this month
  const budgetedCategories = useMemo(
    () => new Set(budgets.map(b => b.category.toLowerCase())),
    [budgets],
  )
  const unbudgeted = useMemo(() =>
    Array.from(spentByCategory.entries())
      .filter(([cat]) => !budgetedCategories.has(cat.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b)),
    [spentByCategory, budgetedCategories],
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  const balanceStr = `${balance < 0 ? '−' : ''}${fmt(balance)}`

  const inputBase =
    'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-[1px] focus:border-finance transition-colors'

  const inlineInputBase =
    'h-7 px-2 rounded-lg border-[0.5px] border-line bg-background ' +
    'text-[12px] text-foreground placeholder:text-foreground-tertiary ' +
    'focus:outline-none focus:border-finance transition-colors'

  return (
    <div className="p-6 max-w-3xl">

      {/* Page header + month nav */}
      <h1 className="text-[20px] font-medium text-foreground mb-[2px]">Finance</h1>
      <div className="flex items-center gap-2 mb-6">
        <Button size="sm" variant="ghost" intent="neutral" onClick={() => setMonth(m => shiftMonth(m, -1))}>
          ←
        </Button>
        <span className="text-[14px] text-foreground-secondary min-w-[120px] text-center">
          {formatMonth(month)}
        </span>
        <Button size="sm" variant="ghost" intent="neutral" onClick={() => setMonth(m => shiftMonth(m, 1))}>
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
        <TransactionForm onAdd={handleAddTransaction} defaultDate={today} />
      </div>

      {/* ── Budgets ── */}
      <Card className="mb-4">

        {/* Card header row with title */}
        <p className="text-[13px] font-medium text-foreground mb-3">Budgets</p>

        {/* Create budget form */}
        <form onSubmit={handleAddBudget} className="flex gap-2 mb-4 pb-4 border-b-[0.5px] border-line-subtle">
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            placeholder="Category"
            className={`flex-1 min-w-0 ${inputBase}`}
            autoComplete="off"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={newLimit}
            onChange={e => setNewLimit(e.target.value)}
            placeholder="Monthly limit"
            className={`w-[120px] ${inputBase}`}
            autoComplete="off"
          />
          <Button
            variant="primary"
            intent="finance"
            size="md"
            type="submit"
            disabled={!newCat.trim() || !(parseFloat(newLimit) > 0) || addingBudget}
          >
            {budgets.find(b => b.category.toLowerCase() === newCat.trim().toLowerCase())
              ? 'Update'
              : 'Add'}
          </Button>
        </form>

        {/* Budget rows */}
        {loading ? (
          <p className="text-[13px] text-foreground-tertiary py-1">Loading…</p>
        ) : error ? (
          <p className="text-[13px] text-finance py-1">{error}</p>
        ) : budgets.length === 0 && unbudgeted.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-1">No budgets set for this month.</p>
        ) : (
          <>
            {budgets.map(b => (
              <BudgetRow
                key={b.id}
                budget={b}
                spent={spentByCategory.get(b.category) ?? 0}
                onDelete={handleDeleteBudget}
              />
            ))}

            {/* Unbudgeted categories with spending */}
            {unbudgeted.length > 0 && (
              <div className={budgets.length > 0 ? 'mt-3 pt-3 border-t-[0.5px] border-line-subtle' : ''}>
                <p className="text-[11px] text-foreground-tertiary mb-2">
                  Spending without a budget
                </p>
                {unbudgeted.map(([category, spent]) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0"
                  >
                    <span className="text-[13px] text-foreground flex-1">{category}</span>
                    <span className="text-[12px] tabular-nums text-foreground-secondary">
                      {fmt(spent)}
                    </span>

                    {settingLimitFor === category ? (
                      <form
                        onSubmit={e => handleSetInlineLimit(e, category)}
                        className="flex items-center gap-1"
                      >
                        <input
                          ref={inlineLimitRef}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={inlineLimit}
                          onChange={e => setInlineLimit(e.target.value)}
                          placeholder="Limit"
                          className={`w-[72px] ${inlineInputBase}`}
                        />
                        <Button
                          size="sm"
                          variant="primary"
                          intent="finance"
                          type="submit"
                          disabled={!(parseFloat(inlineLimit) > 0)}
                        >
                          Set
                        </Button>
                        <button
                          type="button"
                          onClick={() => { setSettingLimitFor(null); setInlineLimit('') }}
                          className="text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-colors"
                        >×</button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setSettingLimitFor(category); setInlineLimit('') }}
                        className="text-[12px] text-finance hover:opacity-75 transition-opacity flex-shrink-0"
                      >
                        Set limit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
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
                <span className="text-[11px] text-foreground-tertiary w-[42px] flex-shrink-0">
                  {formatTxDate(t.date)}
                </span>

                <span className="flex-1 text-foreground">
                  {t.category || t.note || (
                    <span className="text-foreground-tertiary">—</span>
                  )}
                </span>

                {t.category && t.note && (
                  <span className="text-[11px] text-foreground-secondary hidden sm:inline">
                    {t.note}
                  </span>
                )}

                <Badge intent={t.type === 'income' ? 'habits' : 'finance'}>
                  {t.type}
                </Badge>

                <span className={cn(
                  'text-[13px] tabular-nums flex-shrink-0',
                  t.type === 'income' ? 'text-habits' : 'text-foreground',
                )}>
                  {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                </span>

                <button
                  type="button"
                  onClick={() => handleDeleteTransaction(t.id)}
                  aria-label="Delete transaction"
                  className="opacity-0 group-hover:opacity-100 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  )
}
