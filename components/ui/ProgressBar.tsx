import { cn } from '@/lib/utils'

type Intent = 'tasks' | 'habits' | 'goals' | 'finance' | 'neutral'

interface ProgressBarProps {
  value:      number    // 0–100
  intent?:    Intent
  className?: string
}

const fillClasses: Record<Intent, string> = {
  tasks:   'bg-tasks',
  habits:  'bg-habits',
  goals:   'bg-goals',
  finance: 'bg-finance',
  neutral: 'bg-foreground-secondary',
}

export default function ProgressBar({
  value,
  intent = 'neutral',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    // Track: 6px tall, secondary bg, full-radius, clips the fill
    <div className={cn('h-[6px] bg-background-secondary rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full', fillClasses[intent])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
