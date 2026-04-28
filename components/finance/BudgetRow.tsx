import { cn } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import type { Budget } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface BudgetRowProps {
  budget:    Budget
  spent:     number
  onDelete?: (id: string) => void
}

export default function BudgetRow({ budget, spent, onDelete }: BudgetRowProps) {
  const pct        = budget.limit_amount > 0 ? (spent / budget.limit_amount) * 100 : 0
  const overBudget = spent > budget.limit_amount

  return (
    <div className="group flex flex-col gap-[6px] py-[10px] border-b-[0.5px] border-line-subtle last:border-b-0">

      {/* Category + amounts + delete */}
      <div className="flex items-center gap-1">
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
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(budget.id)}
            aria-label="Delete budget"
            className="opacity-0 group-hover:opacity-100 ml-1 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
          >×</button>
        )}
      </div>

      {/* Progress bar */}
      <ProgressBar value={pct} intent="finance" />

    </div>
  )
}
