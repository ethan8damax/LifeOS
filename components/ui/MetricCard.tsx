import { cn } from '@/lib/utils'

interface MetricCardProps {
  label:      string
  value:      string | number
  // Optional denominator rendered smaller + tertiary beside the main value, e.g. "/ 7"
  valueSub?:  string
  // Optional subtext beneath the value, e.g. "3 remaining"
  sub?:       string
  className?: string
}

export default function MetricCard({
  label,
  value,
  valueSub,
  sub,
  className,
}: MetricCardProps) {
  return (
    // No border — metric cards use secondary bg only (design rule)
    <div className={cn('bg-background-secondary rounded-lg p-[14px]', className)}>
      <p className="text-[12px] text-foreground-secondary mb-[6px]">{label}</p>

      <p className="text-[22px] font-medium text-foreground leading-none">
        {value}
        {valueSub && (
          <span className="text-[14px] font-normal text-foreground-tertiary ml-1">
            {valueSub}
          </span>
        )}
      </p>

      {sub && (
        <p className="text-[12px] text-foreground-tertiary mt-[3px]">{sub}</p>
      )}
    </div>
  )
}
