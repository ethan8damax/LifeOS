import { cn } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import type { Budget } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BudgetRowProps {
  budget: Budget
  spent:  number
}

export default function BudgetRow({ budget, spent }: BudgetRowProps) {
  const pct      = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0
  const overBudget = spent > budget.limit_amount

  return (
    <div className="flex flex-col gap-[6px] py-[10px] border-b-[0.5px] border-line-subtle last:border-b-0">

      {/* Category + amounts */}
      <div className="flex items-center">
        <span className="text-[13px] text-foreground flex-1">
          {budget.category}
        </span>
        <span className={cn(
          'text-[12px] tabular-nums',
          overBudget ? 'text-finance font-medium' : 'text-foreground-secondary',
        )}>
          {fmt(spent)}
        </span>
        <span className="text-[12px] text-foreground-tertiary tabular-nums">
          &nbsp;/ {fmt(budget.limit_amount)}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar value={pct} intent="finance" />

    </div>
  )
}
