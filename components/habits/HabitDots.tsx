import { cn } from '@/lib/utils'

export type DotKind = 'done' | 'miss' | 'today-done' | 'today-pending' | 'future' | 'skip'

export interface DotState {
  date:  string
  kind:  DotKind
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface HabitDotsProps {
  dots: DotState[]
}

export default function HabitDots({ dots }: HabitDotsProps) {
  return (
    <div className="flex items-center gap-[4px]">
      {dots.map((dot, i) => (
        <div key={dot.date} className="flex flex-col items-center gap-[3px]">
          <div
            className={cn(
              'w-[18px] h-[18px] rounded-[4px]',
              dot.kind === 'done'         && 'bg-habits',
              dot.kind === 'today-done'   && 'bg-habits',
              dot.kind === 'miss'         && 'bg-background-secondary border-[0.5px] border-line-subtle',
              dot.kind === 'today-pending'&& 'bg-background-secondary border-[1.5px] border-habits',
              dot.kind === 'future'       && 'bg-background-secondary border-[0.5px] border-line-subtle opacity-40',
              dot.kind === 'skip'         && 'opacity-0 pointer-events-none',
            )}
          />
          <span className="text-[9px] text-foreground-tertiary leading-none">
            {DAY_LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  )
}
