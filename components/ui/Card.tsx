import { cn } from '@/lib/utils'

interface CardProps {
  title?:    string
  children:  React.ReactNode
  className?: string
}

export default function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-background border-[0.5px] border-line-subtle rounded-xl py-4 px-5',
        className,
      )}
    >
      {title && (
        <p className="text-[13px] font-medium text-foreground mb-3">{title}</p>
      )}
      {children}
    </div>
  )
}
