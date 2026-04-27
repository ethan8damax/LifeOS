import { cn } from '@/lib/utils'

type Intent = 'tasks' | 'habits' | 'goals' | 'finance' | 'neutral'

interface BadgeProps {
  intent:     Intent
  children:   React.ReactNode
  className?: string
}

// 50-stop background, 800-stop text — per design system tag/badge rule
const intentClasses: Record<Intent, string> = {
  tasks:   'bg-tasks-subtle   text-tasks-on-subtle',
  habits:  'bg-habits-subtle  text-habits-on-subtle',
  goals:   'bg-goals-subtle   text-goals-on-subtle',
  finance: 'bg-finance-subtle text-finance-on-subtle',
  neutral: 'bg-background-secondary text-foreground-secondary',
}

export default function Badge({ intent, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[11px] font-normal px-2 py-0.5 rounded-full',
        intentClasses[intent],
        className,
      )}
    >
      {children}
    </span>
  )
}
