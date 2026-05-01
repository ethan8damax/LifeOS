'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getBudgetCategories, createBudgetCategory, updateBudgetCategory, deleteBudgetCategory,
  getIncomeSources, createIncomeSource, updateIncomeSource, deleteIncomeSource,
  getRecurringPayments, createRecurringPayment, updateRecurringPayment, deleteRecurringPayment,
  getDebts, createDebt, updateDebt, deleteDebt,
  getSavingsPods, createSavingsPod, updateSavingsPod, deleteSavingsPod,
  getAssets, createAsset, updateAsset, deleteAsset,
  getNetWorthSnapshots, createNetWorthSnapshot,
} from '@/lib/queries/finance'
import { getHouseholdMemberNames } from '@/lib/queries/households'
import { pad } from '@/lib/utils'
import type {
  BudgetCategory, IncomeSource, RecurringPayment,
  Debt, SavingsPod, Asset, NetWorthSnapshot,
} from '@/types'
import Card   from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'

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

function formatMonthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtWhole(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const inputCls =
  'h-8 px-3 rounded-lg border-[0.5px] border-line bg-background ' +
  'text-[13px] text-foreground placeholder:text-foreground-tertiary ' +
  'focus:outline-none focus:border-[1px] focus:border-finance transition-colors'

const numInputCls =
  'h-8 w-[96px] px-3 rounded-lg border-[0.5px] border-line bg-background ' +
  'text-[13px] text-foreground tabular-nums ' +
  'focus:outline-none focus:border-[1px] focus:border-finance transition-colors'

type Tab = 'budget' | 'income' | 'recurring' | 'savings' | 'networth'

const DEFAULT_CATEGORIES = [
  'Savings', 'Rent', 'Gas', 'Groceries', 'Restaurants',
  'Coffee', 'Fun money', 'Recurring payments', 'Contribution', 'Hosting',
]


// ── Net worth sparkline chart ─────────────────────────────────────────────────

function NetWorthChart({ snapshots }: { snapshots: NetWorthSnapshot[] }) {
  if (snapshots.length < 2) return (
    <p className="text-[12px] text-foreground-tertiary py-2">
      Record at least two snapshots to see the trend.
    </p>
  )

  const values = snapshots.map(s => s.net_worth ?? 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 500, H = 64

  const pts = snapshots.map((s, i) => {
    const x = (i / (snapshots.length - 1)) * W
    const y = H - ((s.net_worth ?? 0) - min) / range * (H - 8) - 4
    return `${x},${y}`
  }).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
        <polyline
          points={pts}
          fill="none"
          stroke="var(--color-finance)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {snapshots.map((s, i) => {
          const x = (i / (snapshots.length - 1)) * W
          const y = H - ((s.net_worth ?? 0) - min) / range * (H - 8) - 4
          return <circle key={s.id} cx={x} cy={y} r={3} fill="var(--color-finance)" />
        })}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[11px] text-foreground-tertiary">{snapshots[0].month}</span>
        <span className="text-[11px] text-foreground-tertiary">{snapshots[snapshots.length - 1].month}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [tab,   setTab]   = useState<Tab>('budget')
  const [month, setMonth] = useState(() => currentMonth())

  // Data state
  const [categories,  setCategories]  = useState<BudgetCategory[]>([])
  const [incomes,     setIncomes]     = useState<IncomeSource[]>([])
  const [recurrings,  setRecurrings]  = useState<RecurringPayment[]>([])
  const [debts,       setDebts]       = useState<Debt[]>([])
  const [pods,        setPods]        = useState<SavingsPod[]>([])
  const [assets,      setAssets]      = useState<Asset[]>([])
  const [snapshots,   setSnapshots]   = useState<NetWorthSnapshot[]>([])
  const [loading,     setLoading]     = useState(true)
  const [savingSnap,  setSavingSnap]  = useState(false)
  const [owners,      setOwners]      = useState<string[]>([])

  // ── Data loading ─────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, inc, rec, dbt, spods, ast, snaps, memberNames] = await Promise.all([
        getBudgetCategories(month),
        getIncomeSources(month),
        getRecurringPayments(),
        getDebts(),
        getSavingsPods(),
        getAssets(),
        getNetWorthSnapshots(),
        getHouseholdMemberNames(),
      ])
      setCategories(cats)
      setIncomes(inc)
      setRecurrings(rec)
      setDebts(dbt)
      setPods(spods)
      setAssets(ast)
      setSnapshots(snaps)
      setOwners(memberNames)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { load() }, [load])

  // ── Derived ──────────────────────────────────────────────────────────────────

  const totalExpectedIncome = useMemo(
    () => incomes.reduce((s, i) => s + i.expected, 0),
    [incomes],
  )
  const totalBudgeted = useMemo(
    () => categories.reduce((s, c) => s + c.expected, 0),
    [categories],
  )
  const leftover = totalExpectedIncome - totalBudgeted

  const recurringTotal = useMemo(
    () => recurrings.reduce((s, r) => s + r.amount, 0),
    [recurrings],
  )

  const totalAssets  = useMemo(() => assets.reduce((s, a) => s + a.balance, 0), [assets])
  const totalDebt    = useMemo(() => debts.reduce((s, d) => s + d.amount_owed, 0), [debts])
  const netWorth     = totalAssets - totalDebt

  const totalAllotted = useMemo(() => pods.reduce((s, p) => s + p.allotted, 0), [pods])
  const totalPodGoal  = useMemo(() => pods.reduce((s, p) => s + p.goal, 0), [pods])

  // ── Tab nav ───────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string }[] = [
    { key: 'budget',    label: 'Budget' },
    { key: 'income',    label: 'Income' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'savings',   label: 'Savings pods' },
    { key: 'networth',  label: 'Net worth' },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-[20px] font-medium text-foreground mb-5">Finance</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b-[0.5px] border-line-subtle">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              'px-4 py-[7px] text-[13px] rounded-t-lg transition-colors ' +
              (tab === t.key
                ? 'text-finance font-medium border-b-[1.5px] border-finance -mb-[0.5px]'
                : 'text-foreground-secondary hover:text-foreground')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[13px] text-foreground-tertiary">Loading…</p>
      ) : (
        <>
          {tab === 'budget'    && <BudgetTab    month={month} setMonth={setMonth} categories={categories} setCategories={setCategories} leftover={leftover} totalExpectedIncome={totalExpectedIncome} totalBudgeted={totalBudgeted} recurringTotal={recurringTotal} />}
          {tab === 'income'    && <IncomeTab    month={month} setMonth={setMonth} incomes={incomes} setIncomes={setIncomes} owners={owners} />}
          {tab === 'recurring' && <RecurringTab recurrings={recurrings} setRecurrings={setRecurrings} recurringTotal={recurringTotal} />}
          {tab === 'savings'   && <SavingsTab   pods={pods} setPods={setPods} totalAllotted={totalAllotted} totalPodGoal={totalPodGoal} savingsBalance={assets.filter(a => a.type === 'savings').reduce((s, a) => s + a.balance, 0)} />}
          {tab === 'networth'  && <NetWorthTab  assets={assets} setAssets={setAssets} debts={debts} setDebts={setDebts} recurrings={recurrings} setRecurrings={setRecurrings} snapshots={snapshots} setSnapshots={setSnapshots} totalAssets={totalAssets} totalDebt={totalDebt} netWorth={netWorth} month={month} savingSnap={savingSnap} setSavingSnap={setSavingSnap} owners={owners} />}
        </>
      )}
    </div>
  )
}

// ── Budget tab ────────────────────────────────────────────────────────────────

function BudgetTab({
  month, setMonth, categories, setCategories, leftover,
  totalExpectedIncome, totalBudgeted, recurringTotal,
}: {
  month: string
  setMonth: (m: string) => void
  categories: BudgetCategory[]
  setCategories: React.Dispatch<React.SetStateAction<BudgetCategory[]>>
  leftover: number
  totalExpectedIncome: number
  totalBudgeted: number
  recurringTotal: number
}) {
  const [newName,    setNewName]    = useState('')
  const [addingCat,  setAddingCat]  = useState(false)

  async function handleAddCategory(name: string) {
    if (!name.trim()) return
    setAddingCat(true)
    try {
      const existing = categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase())
      if (existing) return
      const created = await createBudgetCategory({ name: name.trim(), month, expected: 0, actual: 0 })
      setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    } finally {
      setAddingCat(false)
      setNewName('')
    }
  }

  async function handleUpdateField(id: string, field: 'expected' | 'actual', raw: string) {
    const val = parseFloat(raw)
    if (isNaN(val) || val < 0) return
    const updated = await updateBudgetCategory(id, { [field]: val })
    setCategories(prev => prev.map(c => c.id === id ? updated : c))
  }

  async function handleDelete(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id))
    await deleteBudgetCategory(id)
  }

  const leftoverColor = leftover < 0 ? 'text-finance' : leftover === 0 ? 'text-habits' : 'text-foreground'

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center gap-2 mb-5">
        <Button size="sm" variant="ghost" intent="neutral" onClick={() => setMonth(shiftMonth(month, -1))}>←</Button>
        <span className="text-[13px] text-foreground-secondary min-w-[140px] text-center">{formatMonthLabel(month)}</span>
        <Button size="sm" variant="ghost" intent="neutral" onClick={() => setMonth(shiftMonth(month, 1))}>→</Button>
      </div>

      {/* Over-budget warning */}
      {(() => {
        const over = categories.filter(c => c.expected > 0 && c.actual > c.expected)
        if (over.length === 0) return null
        const totalOver = over.reduce((s, c) => s + (c.actual - c.expected), 0)
        return (
          <div className="bg-finance-subtle rounded-xl px-5 py-4 mb-5">
            <p className="text-[13px] font-medium text-finance-on-subtle mb-[6px]">
              Over budget on {over.length} {over.length === 1 ? 'category' : 'categories'} · {fmtWhole(totalOver)} total over
            </p>
            {over.map(c => (
              <div key={c.id} className="flex items-center py-[4px]">
                <span className="flex-1 text-[12px] text-finance-on-subtle">{c.name}</span>
                <span className="text-[12px] font-medium text-finance tabular-nums">
                  +{fmtWhole(c.actual - c.expected)} over
                </span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Leftover banner */}
      <div className="bg-background-secondary rounded-xl px-5 py-4 mb-5">
        <p className="text-[12px] text-foreground-secondary mb-1">Unallocated this month</p>
        <p className={`text-[28px] font-medium tabular-nums ${leftoverColor}`}>
          {leftover < 0 ? '−' : ''}{fmtWhole(Math.abs(leftover))}
        </p>
        <div className="flex items-center gap-3 mt-2 text-[12px] text-foreground-tertiary">
          <span>Income: {fmtWhole(totalExpectedIncome)}</span>
          <span>·</span>
          <span>Budgeted: {fmtWhole(totalBudgeted)}</span>
        </div>
        {totalExpectedIncome > 0 && (
          <div className="mt-3">
            <ProgressBar value={Math.min(100, totalBudgeted / totalExpectedIncome * 100)} intent="finance" />
          </div>
        )}
      </div>

      {/* Budget table */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-foreground">Budget categories</p>
          {recurringTotal > 0 && (
            <span className="text-[11px] text-foreground-tertiary">
              Recurring: {fmtWhole(recurringTotal)}/mo
            </span>
          )}
        </div>

        {/* Column header */}
        <div className="flex items-center gap-2 pb-2 border-b-[0.5px] border-line-subtle mb-1">
          <span className="flex-1 text-[11px] text-foreground-tertiary">Category</span>
          <span className="w-[88px] text-[11px] text-foreground-tertiary text-right">Expected</span>
          <span className="w-[88px] text-[11px] text-foreground-tertiary text-right">Actual</span>
          <span className="w-5" />
        </div>

        {categories.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-2">No categories yet. Add one below or pick a default.</p>
        ) : (
          <div>
            {categories.map(c => (
              <BudgetCategoryRow
                key={c.id}
                category={c}
                recurringTotal={c.name.toLowerCase() === 'recurring payments' ? recurringTotal : 0}
                onUpdate={handleUpdateField}
                onDelete={handleDelete}
              />
            ))}
            {/* Total row */}
            <div className="flex items-center gap-2 pt-3 mt-1 border-t-[0.5px] border-line-subtle">
              <span className="flex-1 text-[12px] font-medium text-foreground">Total</span>
              <span className="w-[88px] text-[12px] font-medium tabular-nums text-right text-foreground">
                {fmtWhole(categories.reduce((s, c) => s + c.expected, 0))}
              </span>
              <span className="w-[88px] text-[12px] font-medium tabular-nums text-right text-foreground">
                {fmtWhole(categories.reduce((s, c) => s + c.actual, 0))}
              </span>
              <span className="w-5" />
            </div>
          </div>
        )}

        {/* Add category */}
        <div className="mt-4 pt-4 border-t-[0.5px] border-line-subtle">
          <form
            onSubmit={e => { e.preventDefault(); handleAddCategory(newName) }}
            className="flex gap-2"
          >
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Category name"
              className={`flex-1 min-w-0 ${inputCls}`}
              autoComplete="off"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              intent="finance"
              disabled={!newName.trim() || addingCat}
            >
              Add
            </Button>
          </form>

          {/* Quick-add defaults */}
          <div className="flex flex-wrap gap-1 mt-2">
            {DEFAULT_CATEGORIES.filter(n =>
              !categories.find(c => c.name.toLowerCase() === n.toLowerCase())
            ).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => handleAddCategory(n)}
                className="px-2 py-[3px] rounded-md text-[11px] bg-finance-subtle text-finance-on-subtle hover:opacity-80 transition-opacity"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

function BudgetCategoryRow({
  category, recurringTotal, onUpdate, onDelete,
}: {
  category: BudgetCategory
  recurringTotal: number
  onUpdate: (id: string, field: 'expected' | 'actual', raw: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [exp, setExp] = useState(String(category.expected))
  const [act, setAct] = useState(String(category.actual))

  useEffect(() => { setExp(String(category.expected)) }, [category.expected])
  useEffect(() => { setAct(String(category.actual))   }, [category.actual])

  const isRecurring = recurringTotal > 0
  const isOver      = category.expected > 0 && category.actual > category.expected
  const overBy      = isOver ? category.actual - category.expected : 0

  return (
    <div className="flex flex-col border-b-[0.5px] border-line-subtle last:border-b-0 group">
      <div className="flex items-center gap-2 py-[8px]">
        <span className="flex-1 text-[13px] text-foreground truncate">
          {category.name}
          {isRecurring && (
            <span className="ml-1 text-[11px] text-foreground-tertiary">(={fmtWhole(recurringTotal)})</span>
          )}
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={exp}
          onChange={e => setExp(e.target.value)}
          onBlur={e => onUpdate(category.id, 'expected', e.target.value)}
          className="w-[88px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={act}
          onChange={e => setAct(e.target.value)}
          onBlur={e => onUpdate(category.id, 'actual', e.target.value)}
          className={
            'w-[88px] h-7 px-2 rounded-md border-[0.5px] bg-background text-[12px] tabular-nums text-right focus:outline-none transition-colors ' +
            (isOver
              ? 'border-finance text-finance font-medium focus:border-finance'
              : 'border-line focus:border-finance')
          }
        />
        <button
          type="button"
          onClick={() => onDelete(category.id)}
          className="w-5 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity"
        >×</button>
      </div>
      {isOver && (
        <div className="flex items-center justify-end pb-[6px] -mt-[2px]">
          <span className="text-[11px] text-finance tabular-nums">
            +{fmtWhole(overBy)} over budget
          </span>
        </div>
      )}
    </div>
  )
}

// ── Income tab ────────────────────────────────────────────────────────────────

function IncomeTab({
  month, setMonth, incomes, setIncomes, owners,
}: {
  month: string
  setMonth: (m: string) => void
  incomes: IncomeSource[]
  setIncomes: React.Dispatch<React.SetStateAction<IncomeSource[]>>
  owners: string[]
}) {
  const [newOwner, setNewOwner] = useState<string>('')
  useEffect(() => {
    if (owners.length > 0 && !newOwner) setNewOwner(owners[0])
  }, [owners, newOwner])
  const [newName,  setNewName]  = useState('')
  const [adding,   setAdding]   = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      const created = await createIncomeSource({ owner: newOwner, name: newName.trim(), month, expected: 0, actual: 0 })
      setIncomes(prev => [...prev, created])
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  async function handleUpdateField(id: string, field: 'expected' | 'actual', raw: string) {
    const val = parseFloat(raw)
    if (isNaN(val) || val < 0) return
    const updated = await updateIncomeSource(id, { [field]: val })
    setIncomes(prev => prev.map(i => i.id === id ? updated : i))
  }

  async function handleDelete(id: string) {
    setIncomes(prev => prev.filter(i => i.id !== id))
    await deleteIncomeSource(id)
  }

  const householdExpected = incomes.reduce((s, i) => s + i.expected, 0)
  const householdActual   = incomes.reduce((s, i) => s + i.actual, 0)

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center gap-2 mb-5">
        <Button size="sm" variant="ghost" intent="neutral" onClick={() => setMonth(shiftMonth(month, -1))}>←</Button>
        <span className="text-[13px] text-foreground-secondary min-w-[140px] text-center">{formatMonthLabel(month)}</span>
        <Button size="sm" variant="ghost" intent="neutral" onClick={() => setMonth(shiftMonth(month, 1))}>→</Button>
      </div>

      {/* Per-owner sections */}
      <div className="flex flex-col gap-4 mb-4">
        {owners.map(owner => {
          const ownerIncomes = incomes.filter(i => i.owner === owner)
          const ownerExpected = ownerIncomes.reduce((s, i) => s + i.expected, 0)
          const ownerActual   = ownerIncomes.reduce((s, i) => s + i.actual, 0)
          return (
            <Card key={owner}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-medium text-foreground">{owner}</p>
              </div>

              {/* Column header */}
              <div className="flex items-center gap-2 pb-2 border-b-[0.5px] border-line-subtle mb-1">
                <span className="flex-1 text-[11px] text-foreground-tertiary">Source</span>
                <span className="w-[88px] text-[11px] text-foreground-tertiary text-right">Expected</span>
                <span className="w-[88px] text-[11px] text-foreground-tertiary text-right">Actual</span>
                <span className="w-5" />
              </div>

              {ownerIncomes.length === 0 ? (
                <p className="text-[13px] text-foreground-tertiary py-2">No income sources.</p>
              ) : (
                ownerIncomes.map(inc => (
                  <IncomeSourceRow
                    key={inc.id}
                    source={inc}
                    onUpdate={handleUpdateField}
                    onDelete={handleDelete}
                  />
                ))
              )}

              {/* Subtotal */}
              {ownerIncomes.length > 0 && (
                <div className="flex items-center gap-2 pt-3 mt-1 border-t-[0.5px] border-line-subtle">
                  <span className="flex-1 text-[12px] font-medium text-foreground">{owner} total</span>
                  <span className="w-[88px] text-[12px] font-medium tabular-nums text-right text-foreground">{fmtWhole(ownerExpected)}</span>
                  <span className="w-[88px] text-[12px] font-medium tabular-nums text-right text-foreground">{fmtWhole(ownerActual)}</span>
                  <span className="w-5" />
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Household combined */}
      <div className="bg-background-secondary rounded-xl px-5 py-4 mb-4">
        <p className="text-[12px] text-foreground-secondary mb-2">Household combined</p>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[11px] text-foreground-tertiary">Expected</p>
            <p className="text-[18px] font-medium tabular-nums text-foreground">{fmtWhole(householdExpected)}</p>
          </div>
          <div className="w-[0.5px] h-8 bg-line-subtle" />
          <div>
            <p className="text-[11px] text-foreground-tertiary">Actual</p>
            <p className="text-[18px] font-medium tabular-nums text-foreground">{fmtWhole(householdActual)}</p>
          </div>
        </div>
      </div>

      {/* Add income source */}
      <Card>
        <p className="text-[13px] font-medium text-foreground mb-3">Add income source</p>
        <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
          <select
            value={newOwner}
            onChange={e => setNewOwner(e.target.value)}
            className={`w-[96px] ${inputCls}`}
          >
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Source name"
            className={`flex-1 min-w-0 ${inputCls}`}
            autoComplete="off"
          />
          <Button type="submit" size="sm" variant="primary" intent="finance" disabled={!newName.trim() || adding}>
            Add
          </Button>
        </form>
      </Card>
    </div>
  )
}

function IncomeSourceRow({
  source, onUpdate, onDelete,
}: {
  source: IncomeSource
  onUpdate: (id: string, field: 'expected' | 'actual', raw: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [exp, setExp] = useState(String(source.expected))
  const [act, setAct] = useState(String(source.actual))

  useEffect(() => { setExp(String(source.expected)) }, [source.expected])
  useEffect(() => { setAct(String(source.actual))   }, [source.actual])

  return (
    <div className="flex items-center gap-2 py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0 group">
      <span className="flex-1 text-[13px] text-foreground truncate">{source.name}</span>
      <input
        type="number" min="0" step="0.01"
        value={exp}
        onChange={e => setExp(e.target.value)}
        onBlur={e => onUpdate(source.id, 'expected', e.target.value)}
        className="w-[88px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
      />
      <input
        type="number" min="0" step="0.01"
        value={act}
        onChange={e => setAct(e.target.value)}
        onBlur={e => onUpdate(source.id, 'actual', e.target.value)}
        className="w-[88px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
      />
      <button
        type="button"
        onClick={() => onDelete(source.id)}
        className="w-5 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity"
      >×</button>
    </div>
  )
}

// ── Recurring tab ─────────────────────────────────────────────────────────────

function RecurringTab({
  recurrings, setRecurrings, recurringTotal,
}: {
  recurrings: RecurringPayment[]
  setRecurrings: React.Dispatch<React.SetStateAction<RecurringPayment[]>>
  recurringTotal: number
}) {
  const [newName,   setNewName]   = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [adding,    setAdding]    = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(newAmount)
    if (!newName.trim() || !(amount > 0)) return
    setAdding(true)
    try {
      const created = await createRecurringPayment({ name: newName.trim(), amount })
      setRecurrings(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewAmount('')
    } finally {
      setAdding(false)
    }
  }

  async function handleUpdateAmount(id: string, raw: string) {
    const val = parseFloat(raw)
    if (isNaN(val) || val <= 0) return
    const updated = await updateRecurringPayment(id, { amount: val })
    setRecurrings(prev => prev.map(r => r.id === id ? updated : r))
  }

  async function handleDelete(id: string) {
    setRecurrings(prev => prev.filter(r => r.id !== id))
    await deleteRecurringPayment(id)
  }

  return (
    <div>
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-foreground">Recurring payments</p>
          <span className="text-[13px] font-medium tabular-nums text-finance">
            {fmt(recurringTotal)}/mo
          </span>
        </div>

        {/* Column header */}
        <div className="flex items-center gap-2 pb-2 border-b-[0.5px] border-line-subtle mb-1">
          <span className="flex-1 text-[11px] text-foreground-tertiary">Name</span>
          <span className="w-[96px] text-[11px] text-foreground-tertiary text-right">Monthly</span>
          <span className="w-5" />
        </div>

        {recurrings.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-2">No recurring payments.</p>
        ) : (
          <div>
            {recurrings.map(r => (
              <RecurringRow key={r.id} payment={r} onUpdate={handleUpdateAmount} onDelete={handleDelete} />
            ))}
            <div className="flex items-center gap-2 pt-3 mt-1 border-t-[0.5px] border-line-subtle">
              <span className="flex-1 text-[12px] font-medium text-foreground">Total</span>
              <span className="w-[96px] text-[12px] font-medium tabular-nums text-right text-foreground">
                {fmt(recurringTotal)}
              </span>
              <span className="w-5" />
            </div>
          </div>
        )}
      </Card>

      {/* Add form */}
      <Card>
        <p className="text-[13px] font-medium text-foreground mb-3">Add recurring payment</p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name (e.g. Spotify)"
            className={`flex-1 min-w-0 ${inputCls}`}
            autoComplete="off"
          />
          <input
            type="number" min="0.01" step="0.01"
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            placeholder="Amount"
            className={numInputCls}
          />
          <Button type="submit" size="sm" variant="primary" intent="finance" disabled={!newName.trim() || !(parseFloat(newAmount) > 0) || adding}>
            Add
          </Button>
        </form>
      </Card>
    </div>
  )
}

function RecurringRow({
  payment, onUpdate, onDelete,
}: {
  payment: RecurringPayment
  onUpdate: (id: string, raw: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [amount, setAmount] = useState(String(payment.amount))
  useEffect(() => { setAmount(String(payment.amount)) }, [payment.amount])

  return (
    <div className="flex items-center gap-2 py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0 group">
      <span className="flex-1 text-[13px] text-foreground truncate">{payment.name}</span>
      <input
        type="number" min="0.01" step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        onBlur={e => onUpdate(payment.id, e.target.value)}
        className="w-[96px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
      />
      <button
        type="button"
        onClick={() => onDelete(payment.id)}
        className="w-5 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity"
      >×</button>
    </div>
  )
}

// ── Savings pods tab ──────────────────────────────────────────────────────────

const DEFAULT_PODS = ['Emergency fund', 'Down payment', 'Hosting', 'Adventures', 'General savings']

function SavingsTab({
  pods, setPods, totalAllotted, totalPodGoal, savingsBalance,
}: {
  pods: SavingsPod[]
  setPods: React.Dispatch<React.SetStateAction<SavingsPod[]>>
  totalAllotted: number
  totalPodGoal: number
  savingsBalance: number
}) {
  const [newName, setNewName] = useState('')
  const [adding,  setAdding]  = useState(false)

  async function handleAdd(name: string) {
    if (!name.trim()) return
    setAdding(true)
    try {
      const created = await createSavingsPod({ name: name.trim(), allotted: 0, goal: 0 })
      setPods(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  async function handleUpdate(id: string, field: 'allotted' | 'goal', raw: string) {
    const val = parseFloat(raw)
    if (isNaN(val) || val < 0) return
    const updated = await updateSavingsPod(id, { [field]: val })
    setPods(prev => prev.map(p => p.id === id ? updated : p))
  }

  async function handleDelete(id: string) {
    setPods(prev => prev.filter(p => p.id !== id))
    await deleteSavingsPod(id)
  }

  const unallocated = savingsBalance - totalAllotted

  return (
    <div>
      {/* Summary banner */}
      <div className="bg-background-secondary rounded-xl px-5 py-4 mb-4">
        <p className="text-[12px] text-foreground-secondary mb-2">Savings overview</p>
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-[11px] text-foreground-tertiary">Balance</p>
            <p className="text-[18px] font-medium tabular-nums text-foreground">{fmtWhole(savingsBalance)}</p>
          </div>
          <div>
            <p className="text-[11px] text-foreground-tertiary">Allotted</p>
            <p className="text-[18px] font-medium tabular-nums text-foreground">{fmtWhole(totalAllotted)}</p>
          </div>
          <div>
            <p className="text-[11px] text-foreground-tertiary">{unallocated >= 0 ? 'Unallocated' : 'Over-allotted'}</p>
            <p className={`text-[18px] font-medium tabular-nums ${unallocated < 0 ? 'text-finance' : 'text-foreground'}`}>
              {fmtWhole(Math.abs(unallocated))}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-foreground-tertiary">Total goal</p>
            <p className="text-[18px] font-medium tabular-nums text-foreground">{fmtWhole(totalPodGoal)}</p>
          </div>
        </div>
      </div>

      {/* Pod table */}
      <Card className="mb-4">
        <p className="text-[13px] font-medium text-foreground mb-3">Savings pods</p>

        {/* Column header */}
        <div className="flex items-center gap-2 pb-2 border-b-[0.5px] border-line-subtle mb-1">
          <span className="flex-1 text-[11px] text-foreground-tertiary">Pod</span>
          <span className="w-[80px] text-[11px] text-foreground-tertiary text-right">Allotted</span>
          <span className="w-[80px] text-[11px] text-foreground-tertiary text-right">Goal</span>
          <span className="w-[80px] text-[11px] text-foreground-tertiary text-right">Remaining</span>
          <span className="w-5" />
        </div>

        {pods.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-2">No pods. Add one below.</p>
        ) : (
          <div>
            {pods.map(p => (
              <SavingsPodRow key={p.id} pod={p} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
            <div className="flex items-center gap-2 pt-3 mt-1 border-t-[0.5px] border-line-subtle">
              <span className="flex-1 text-[12px] font-medium text-foreground">Total</span>
              <span className="w-[80px] text-[12px] font-medium tabular-nums text-right text-foreground">{fmtWhole(totalAllotted)}</span>
              <span className="w-[80px] text-[12px] font-medium tabular-nums text-right text-foreground">{fmtWhole(totalPodGoal)}</span>
              <span className="w-[80px]" />
              <span className="w-5" />
            </div>
          </div>
        )}
      </Card>

      {/* Add pod */}
      <Card>
        <p className="text-[13px] font-medium text-foreground mb-3">Add pod</p>
        <form onSubmit={e => { e.preventDefault(); handleAdd(newName) }} className="flex gap-2 mb-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Pod name"
            className={`flex-1 min-w-0 ${inputCls}`}
            autoComplete="off"
          />
          <Button type="submit" size="sm" variant="primary" intent="finance" disabled={!newName.trim() || adding}>
            Add
          </Button>
        </form>
        <div className="flex flex-wrap gap-1">
          {DEFAULT_PODS.filter(n => !pods.find(p => p.name.toLowerCase() === n.toLowerCase())).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => handleAdd(n)}
              className="px-2 py-[3px] rounded-md text-[11px] bg-finance-subtle text-finance-on-subtle hover:opacity-80 transition-opacity"
            >
              {n}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SavingsPodRow({
  pod, onUpdate, onDelete,
}: {
  pod: SavingsPod
  onUpdate: (id: string, field: 'allotted' | 'goal', raw: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [allotted, setAllotted] = useState(String(pod.allotted))
  const [goal,     setGoal]     = useState(String(pod.goal))

  useEffect(() => { setAllotted(String(pod.allotted)) }, [pod.allotted])
  useEffect(() => { setGoal(String(pod.goal))         }, [pod.goal])

  const remaining = pod.goal - pod.allotted

  return (
    <div className="flex items-center gap-2 py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0 group">
      <span className="flex-1 text-[13px] text-foreground truncate">{pod.name}</span>
      <input
        type="number" min="0" step="0.01"
        value={allotted}
        onChange={e => setAllotted(e.target.value)}
        onBlur={e => onUpdate(pod.id, 'allotted', e.target.value)}
        className="w-[80px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
      />
      <input
        type="number" min="0" step="0.01"
        value={goal}
        onChange={e => setGoal(e.target.value)}
        onBlur={e => onUpdate(pod.id, 'goal', e.target.value)}
        className="w-[80px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
      />
      <span className={`w-[80px] text-[12px] tabular-nums text-right ${remaining < 0 ? 'text-habits' : remaining > 0 ? 'text-foreground-secondary' : 'text-foreground-tertiary'}`}>
        {remaining === 0 ? '—' : (remaining < 0 ? '+' : '') + fmtWhole(Math.abs(remaining))}
      </span>
      <button
        type="button"
        onClick={() => onDelete(pod.id)}
        className="w-5 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity"
      >×</button>
    </div>
  )
}

// ── Net worth tab ─────────────────────────────────────────────────────────────

function NetWorthTab({
  assets, setAssets, debts, setDebts, recurrings, setRecurrings,
  snapshots, setSnapshots, totalAssets, totalDebt, netWorth, month, savingSnap, setSavingSnap, owners,
}: {
  assets: Asset[]
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
  debts: Debt[]
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>
  recurrings: RecurringPayment[]
  setRecurrings: React.Dispatch<React.SetStateAction<RecurringPayment[]>>
  snapshots: NetWorthSnapshot[]
  setSnapshots: React.Dispatch<React.SetStateAction<NetWorthSnapshot[]>>
  totalAssets: number
  totalDebt: number
  netWorth: number
  month: string
  savingSnap: boolean
  setSavingSnap: (v: boolean) => void
  owners: string[]
}) {
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetRef,  setNewAssetRef]  = useState('')
  const [newAssetType, setNewAssetType] = useState('checking')
  const [addingAsset,  setAddingAsset]  = useState(false)

  const [newDebtOwner, setNewDebtOwner] = useState<string>('')
  useEffect(() => {
    if (owners.length > 0 && !newDebtOwner) setNewDebtOwner(owners[0])
  }, [owners, newDebtOwner])
  const [newDebtName,  setNewDebtName]  = useState('')
  const [addingDebt,   setAddingDebt]   = useState(false)

  async function handleAddAsset(e: React.FormEvent) {
    e.preventDefault()
    if (!newAssetName.trim()) return
    setAddingAsset(true)
    try {
      const created = await createAsset({ name: newAssetName.trim(), account_ref: newAssetRef.trim() || null, balance: 0, type: newAssetType })
      setAssets(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      setNewAssetName('')
      setNewAssetRef('')
    } finally {
      setAddingAsset(false)
    }
  }

  async function handleUpdateAssetBalance(id: string, raw: string) {
    const val = parseFloat(raw)
    if (isNaN(val)) return
    const updated = await updateAsset(id, { balance: val })
    setAssets(prev => prev.map(a => a.id === id ? updated : a))
  }

  async function handleDeleteAsset(id: string) {
    setAssets(prev => prev.filter(a => a.id !== id))
    await deleteAsset(id)
  }

  async function handleAddDebt(e: React.FormEvent) {
    e.preventDefault()
    if (!newDebtName.trim()) return
    setAddingDebt(true)
    try {
      const created = await createDebt({ owner: newDebtOwner, name: newDebtName.trim(), amount_owed: 0 })
      setDebts(prev => [...prev, created])
      setNewDebtName('')
    } finally {
      setAddingDebt(false)
    }
  }

  async function handleUpdateDebt(id: string, field: 'amount_owed' | 'due_date', raw: string) {
    if (field === 'amount_owed') {
      const val = parseFloat(raw)
      if (isNaN(val) || val < 0) return
      const updated = await updateDebt(id, { amount_owed: val })
      setDebts(prev => prev.map(d => d.id === id ? updated : d))
    } else {
      const updated = await updateDebt(id, { due_date: raw || null })
      setDebts(prev => prev.map(d => d.id === id ? updated : d))
    }
  }

  async function handleDeleteDebt(id: string) {
    setDebts(prev => prev.filter(d => d.id !== id))
    await deleteDebt(id)
  }

  async function handleSetPayment(debtName: string, amount: number) {
    const existing = recurrings.find(r => r.name.toLowerCase() === debtName.toLowerCase())
    if (existing) {
      const updated = await updateRecurringPayment(existing.id, { amount })
      setRecurrings(prev => prev.map(r => r.id === existing.id ? updated : r))
    } else {
      const created = await createRecurringPayment({ name: debtName, amount })
      setRecurrings(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  async function handleRemovePayment(recurringId: string) {
    setRecurrings(prev => prev.filter(r => r.id !== recurringId))
    await deleteRecurringPayment(recurringId)
  }

  async function handleSnapshot() {
    setSavingSnap(true)
    try {
      const snap = await createNetWorthSnapshot({
        month,
        total_assets: totalAssets,
        total_debt:   totalDebt,
        net_worth:    netWorth,
      })
      setSnapshots(prev => [...prev, snap].sort((a, b) => a.month.localeCompare(b.month)))
    } finally {
      setSavingSnap(false)
    }
  }

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] mb-5">
        <div className="bg-background-secondary rounded-lg p-[14px]">
          <p className="text-[12px] text-foreground-secondary mb-1">Total assets</p>
          <p className="text-[20px] font-medium tabular-nums text-foreground">{fmtWhole(totalAssets)}</p>
        </div>
        <div className="bg-background-secondary rounded-lg p-[14px]">
          <p className="text-[12px] text-foreground-secondary mb-1">Total debt</p>
          <p className="text-[20px] font-medium tabular-nums text-foreground">{fmtWhole(totalDebt)}</p>
        </div>
        <div className="bg-background-secondary rounded-lg p-[14px]">
          <p className="text-[12px] text-foreground-secondary mb-1">Net worth</p>
          <p className={`text-[20px] font-medium tabular-nums ${netWorth < 0 ? 'text-finance' : 'text-foreground'}`}>
            {netWorth < 0 ? '−' : ''}{fmtWhole(Math.abs(netWorth))}
          </p>
        </div>
      </div>

      {/* Assets */}
      <Card className="mb-4">
        <p className="text-[13px] font-medium text-foreground mb-3">Assets</p>

        <div className="flex items-center gap-2 pb-2 border-b-[0.5px] border-line-subtle mb-1">
          <span className="flex-1 text-[11px] text-foreground-tertiary">Account</span>
          <span className="w-[80px] text-[11px] text-foreground-tertiary">Type</span>
          <span className="w-[100px] text-[11px] text-foreground-tertiary text-right">Balance</span>
          <span className="w-5" />
        </div>

        {assets.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-2">No assets yet.</p>
        ) : (
          <div>
            {assets.map(a => (
              <AssetRow key={a.id} asset={a} onUpdate={handleUpdateAssetBalance} onDelete={handleDeleteAsset} />
            ))}
            <div className="flex items-center gap-2 pt-3 mt-1 border-t-[0.5px] border-line-subtle">
              <span className="flex-1 text-[12px] font-medium text-foreground">Total</span>
              <span className="w-[80px]" />
              <span className="w-[100px] text-[12px] font-medium tabular-nums text-right text-foreground">{fmt(totalAssets)}</span>
              <span className="w-5" />
            </div>
          </div>
        )}

        {/* Add asset form */}
        <form onSubmit={handleAddAsset} className="flex gap-2 flex-wrap mt-4 pt-4 border-t-[0.5px] border-line-subtle">
          <input
            value={newAssetName}
            onChange={e => setNewAssetName(e.target.value)}
            placeholder="Account name"
            className={`flex-1 min-w-[120px] ${inputCls}`}
            autoComplete="off"
          />
          <input
            value={newAssetRef}
            onChange={e => setNewAssetRef(e.target.value)}
            placeholder="Acct # (optional)"
            className={`w-[130px] ${inputCls}`}
            autoComplete="off"
          />
          <select
            value={newAssetType}
            onChange={e => setNewAssetType(e.target.value)}
            className={`w-[100px] ${inputCls}`}
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="other">Other</option>
          </select>
          <Button type="submit" size="sm" variant="primary" intent="finance" disabled={!newAssetName.trim() || addingAsset}>
            Add
          </Button>
        </form>
      </Card>

      {/* Debts */}
      <Card className="mb-4">
        <p className="text-[13px] font-medium text-foreground mb-3">Debts</p>

        <div className="flex items-center gap-2 pb-2 border-b-[0.5px] border-line-subtle mb-1">
          <span className="w-[60px] text-[11px] text-foreground-tertiary">Owner</span>
          <span className="flex-1 text-[11px] text-foreground-tertiary">Name</span>
          <span className="w-[96px] text-[11px] text-foreground-tertiary text-right">Amount owed</span>
          <span className="w-[100px] text-[11px] text-foreground-tertiary">Due date</span>
          <span className="w-5" />
        </div>

        {debts.length === 0 ? (
          <p className="text-[13px] text-foreground-tertiary py-2">No debts tracked.</p>
        ) : (
          <div>
            {owners.map(owner => {
              const ownerDebts = debts.filter(d => d.owner === owner)
              if (ownerDebts.length === 0) return null
              return (
                <div key={owner}>
                  {ownerDebts.map(d => (
                    <DebtRow
                      key={d.id}
                      debt={d}
                      linkedPayment={recurrings.find(r => r.name.toLowerCase() === d.name.toLowerCase())}
                      onUpdate={handleUpdateDebt}
                      onDelete={handleDeleteDebt}
                      onSetPayment={handleSetPayment}
                      onRemovePayment={handleRemovePayment}
                    />
                  ))}
                  <div className="flex items-center gap-2 py-[6px] border-b-[0.5px] border-line-subtle bg-background-secondary -mx-[1px] px-[1px]">
                    <span className="w-[60px] text-[11px] text-foreground-tertiary">{owner}</span>
                    <span className="flex-1 text-[11px] font-medium text-foreground">Subtotal</span>
                    <span className="w-[96px] text-[11px] font-medium tabular-nums text-right text-foreground">
                      {fmt(ownerDebts.reduce((s, d) => s + d.amount_owed, 0))}
                    </span>
                    <span className="w-[100px]" />
                    <span className="w-5" />
                  </div>
                </div>
              )
            })}
            <div className="flex items-center gap-2 pt-3 mt-1 border-t-[0.5px] border-line-subtle">
              <span className="w-[60px]" />
              <span className="flex-1 text-[12px] font-medium text-foreground">Total debt</span>
              <span className="w-[96px] text-[12px] font-medium tabular-nums text-right text-finance">{fmt(totalDebt)}</span>
              <span className="w-[100px]" />
              <span className="w-5" />
            </div>
          </div>
        )}

        {/* Add debt form */}
        <form onSubmit={handleAddDebt} className="flex gap-2 flex-wrap mt-4 pt-4 border-t-[0.5px] border-line-subtle">
          <select
            value={newDebtOwner}
            onChange={e => setNewDebtOwner(e.target.value)}
            className={`w-[96px] ${inputCls}`}
          >
            {owners.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input
            value={newDebtName}
            onChange={e => setNewDebtName(e.target.value)}
            placeholder="Debt name"
            className={`flex-1 min-w-0 ${inputCls}`}
            autoComplete="off"
          />
          <Button type="submit" size="sm" variant="primary" intent="finance" disabled={!newDebtName.trim() || addingDebt}>
            Add
          </Button>
        </form>
      </Card>

      {/* Net worth history */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium text-foreground">Net worth history</p>
          <Button
            size="sm"
            variant="secondary"
            intent="finance"
            onClick={handleSnapshot}
            disabled={savingSnap}
          >
            {savingSnap ? 'Saving…' : 'Record snapshot'}
          </Button>
        </div>
        <NetWorthChart snapshots={snapshots} />
        {snapshots.length > 0 && (
          <div className="mt-3 border-t-[0.5px] border-line-subtle pt-3">
            {snapshots.slice(-6).reverse().map(s => {
              const nw = s.net_worth ?? 0
              const isNeg = nw < 0
              return (
                <div key={s.id} className="flex items-center gap-3 py-[5px] text-[12px]">
                  <span className="text-foreground-tertiary w-[60px]">{s.month}</span>
                  <span className={`flex-1 tabular-nums font-medium ${isNeg ? 'text-finance' : 'text-habits'}`}>
                    {isNeg ? '−' : '+'}{fmt(Math.abs(nw))}
                  </span>
                  <span className="text-foreground-tertiary tabular-nums">Assets: {fmt(s.total_assets ?? 0)}</span>
                  <span className="text-foreground-tertiary tabular-nums">Debt: {fmt(s.total_debt ?? 0)}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

function AssetRow({
  asset, onUpdate, onDelete,
}: {
  asset: Asset
  onUpdate: (id: string, raw: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [balance, setBalance] = useState(String(asset.balance))
  useEffect(() => { setBalance(String(asset.balance)) }, [asset.balance])

  return (
    <div className="flex items-center gap-2 py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0 group">
      <span className="flex-1 text-[13px] text-foreground truncate">
        {asset.name}
        {asset.account_ref && (
          <span className="ml-1 text-[11px] text-foreground-tertiary">···{asset.account_ref.slice(-4)}</span>
        )}
      </span>
      <span className="w-[80px] text-[11px] text-foreground-tertiary capitalize">{asset.type}</span>
      <input
        type="number" step="0.01"
        value={balance}
        onChange={e => setBalance(e.target.value)}
        onBlur={e => onUpdate(asset.id, e.target.value)}
        className="w-[100px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
      />
      <button
        type="button"
        onClick={() => onDelete(asset.id)}
        className="w-5 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity"
      >×</button>
    </div>
  )
}

function DebtRow({
  debt, linkedPayment, onUpdate, onDelete, onSetPayment, onRemovePayment,
}: {
  debt: Debt
  linkedPayment?: RecurringPayment
  onUpdate: (id: string, field: 'amount_owed' | 'due_date', raw: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onSetPayment: (debtName: string, amount: number) => Promise<void>
  onRemovePayment: (recurringId: string) => Promise<void>
}) {
  const [amount,        setAmount]        = useState(String(debt.amount_owed))
  const [dueDate,       setDueDate]       = useState(debt.due_date ?? '')
  const [showPayment,   setShowPayment]   = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  useEffect(() => { setAmount(String(debt.amount_owed)) }, [debt.amount_owed])
  useEffect(() => { setDueDate(debt.due_date ?? '')     }, [debt.due_date])

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault()
    const val = parseFloat(paymentAmount)
    if (!(val > 0)) return
    setSavingPayment(true)
    try {
      await onSetPayment(debt.name, val)
      setShowPayment(false)
      setPaymentAmount('')
    } finally {
      setSavingPayment(false)
    }
  }

  return (
    <div className="py-[8px] border-b-[0.5px] border-line-subtle last:border-b-0 group">
      {/* Main row */}
      <div className="flex items-center gap-2">
        <span className="w-[60px] text-[11px] text-foreground-tertiary">{debt.owner}</span>
        <span className="flex-1 text-[13px] text-foreground truncate">{debt.name}</span>
        <input
          type="number" min="0" step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onBlur={e => onUpdate(debt.id, 'amount_owed', e.target.value)}
          className="w-[96px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[12px] tabular-nums text-right focus:outline-none focus:border-finance transition-colors"
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          onBlur={e => onUpdate(debt.id, 'due_date', e.target.value)}
          className="w-[100px] h-7 px-2 rounded-md border-[0.5px] border-line bg-background text-[11px] text-foreground-secondary focus:outline-none focus:border-finance transition-colors"
        />
        <button
          type="button"
          onClick={() => onDelete(debt.id)}
          className="w-5 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary opacity-0 group-hover:opacity-100 transition-opacity"
        >×</button>
      </div>

      {/* Payment section */}
      <div className="ml-[60px] mt-[4px]">
        {linkedPayment ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-tertiary">Monthly payment:</span>
            <span className="text-[11px] text-habits tabular-nums font-medium">{fmt(linkedPayment.amount)}/mo</span>
            <span className="text-[11px] text-foreground-tertiary">· in recurring</span>
            <button
              type="button"
              onClick={() => onRemovePayment(linkedPayment.id)}
              className="text-[11px] text-foreground-tertiary hover:text-finance transition-colors ml-1"
            >
              Remove
            </button>
          </div>
        ) : showPayment ? (
          <form onSubmit={handleSavePayment} className="flex items-center gap-2">
            <input
              type="number" min="0.01" step="0.01"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              placeholder="Monthly payment"
              autoFocus
              className="w-[120px] h-6 px-2 rounded-md border-[0.5px] border-line bg-background text-[11px] tabular-nums focus:outline-none focus:border-finance transition-colors"
            />
            <button
              type="submit"
              disabled={!(parseFloat(paymentAmount) > 0) || savingPayment}
              className="text-[11px] text-finance hover:opacity-75 transition-opacity disabled:opacity-40"
            >
              Add to recurring
            </button>
            <button
              type="button"
              onClick={() => { setShowPayment(false); setPaymentAmount('') }}
              className="text-[11px] text-foreground-tertiary hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowPayment(true)}
            className="text-[11px] text-foreground-tertiary hover:text-finance transition-colors opacity-0 group-hover:opacity-100"
          >
            + Set monthly payment
          </button>
        )}
      </div>
    </div>
  )
}
