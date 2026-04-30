import { cn } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import type { BudgetCategory } from '@/types'

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface BudgetRowProps {
  category:  BudgetCategory
  onDelete?: (id: string) => void
}

export default function BudgetRow({ category, onDelete }: BudgetRowProps) {
  const pct        = category.expected > 0 ? (category.actual / category.expected) * 100 : 0
  const overBudget = category.actual > category.expected && category.expected > 0

  return (
    <div className="group flex flex-col gap-[6px] py-[10px] border-b-[0.5px] border-line-subtle last:border-b-0">
      <div className="flex items-center gap-1">
        <span className="text-[13px] text-foreground flex-1">{category.name}</span>
        <span className={cn(
          'text-[12px] tabular-nums',
          overBudget ? 'text-finance font-medium' : 'text-foreground-secondary',
        )}>
          {fmt(category.actual)}
        </span>
        <span className="text-[12px] text-foreground-tertiary tabular-nums">
          &nbsp;/ {fmt(category.expected)}
        </span>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            aria-label="Delete budget category"
            className="opacity-0 group-hover:opacity-100 ml-1 text-[16px] leading-none text-foreground-tertiary hover:text-foreground-secondary transition-opacity"
          >×</button>
        )}
      </div>
      <ProgressBar value={pct} intent="finance" />
    </div>
  )
}
