import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost'
type Intent  = 'lists' | 'habits' | 'goals' | 'finance' | 'neutral'
type Size    = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  intent?:  Intent
  size?:    Size
}

const primaryClasses: Record<Intent, string> = {
  lists:   'bg-lists   text-white',
  habits:  'bg-habits  text-white',
  goals:   'bg-goals   text-white',
  finance: 'bg-finance text-white',
  neutral: 'bg-foreground text-background',
}

const secondaryClasses: Record<Intent, string> = {
  lists:   'bg-lists-subtle   text-lists-on-subtle',
  habits:  'bg-habits-subtle  text-habits-on-subtle',
  goals:   'bg-goals-subtle   text-goals-on-subtle',
  finance: 'bg-finance-subtle text-finance-on-subtle',
  neutral: 'bg-background-secondary text-foreground-secondary',
}

const ghostClasses: Record<Intent, string> = {
  lists:   'text-lists   hover:bg-lists-subtle',
  habits:  'text-habits  hover:bg-habits-subtle',
  goals:   'text-goals   hover:bg-goals-subtle',
  finance: 'text-finance hover:bg-finance-subtle',
  neutral: 'text-foreground-secondary hover:bg-background-secondary',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-3 gap-1.5 text-[12px]',
  md: 'h-8 px-4 gap-2   text-[13px]',
}

export default function Button({
  variant = 'secondary',
  intent  = 'neutral',
  size    = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass =
    variant === 'primary'   ? primaryClasses[intent]   :
    variant === 'secondary' ? secondaryClasses[intent] :
                              ghostClasses[intent]

  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'cursor-pointer select-none',
        'hover:opacity-90 transition-opacity',
        'disabled:opacity-50 disabled:pointer-events-none',
        sizeClasses[size],
        variantClass,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
