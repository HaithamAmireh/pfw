import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { Trash2, X } from 'lucide-react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Card — the base "sticker" surface: flat fill, thick ink border, offset shadow
// ---------------------------------------------------------------------------

type ShadowVariant = 'ink' | 'cash' | 'alert' | 'none'

export function Card({
  children,
  className,
  shadow = 'ink',
  padding = 'md',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  shadow?: ShadowVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'section' | 'article'
}) {
  const shadowClass = {
    ink: 'shadow-brut',
    cash: 'shadow-brut-cash',
    alert: 'shadow-brut-alert',
    none: '',
  }[shadow]
  const padClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding]
  return (
    <Tag className={cx('rounded border-3 bg-paper', shadowClass, padClass, className)}>
      {children}
    </Tag>
  )
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'cash' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: 'bg-volt text-ink border-3 shadow-brut',
  secondary: 'bg-paper text-ink border-3 shadow-brut',
  danger: 'bg-alert text-paper border-3 shadow-brut',
  cash: 'bg-cash text-paper border-3 shadow-brut',
  ghost: 'bg-transparent text-ink border-3 border-ink/30 shadow-none hover:border-ink',
}

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-base gap-2',
  lg: 'px-6 py-4 text-lg gap-2.5',
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    size?: ButtonSize
    full?: boolean
  }
>(function Button({ variant = 'primary', size = 'md', full, className, children, ...rest }, ref) {
  const pressable = variant !== 'ghost'
  return (
    <button
      ref={ref}
      className={cx(
        'inline-flex items-center justify-center rounded font-display font-bold transition-transform duration-75 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-40 disabled:pointer-events-none',
        pressable && 'active:shadow-none',
        buttonVariantClass[variant],
        buttonSizeClass[size],
        full && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cx(
          'w-full rounded border-3 bg-paper px-3.5 py-2.5 font-mono text-base text-ink placeholder:text-ink/35',
          className,
        )}
        {...rest}
      />
    )
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cx(
          'w-full appearance-none rounded border-3 bg-paper px-3.5 py-2.5 font-display font-medium text-ink',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    )
  },
)

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  )
}

// ---------------------------------------------------------------------------
// Badge / chip
// ---------------------------------------------------------------------------

export function Badge({
  children,
  hex,
  textOn = 'ink',
  className,
}: {
  children: ReactNode
  hex?: string
  textOn?: 'ink' | 'paper'
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded border-2 border-ink px-2 py-0.5 text-xs font-bold',
        !hex && 'bg-canvas text-ink',
        textOn === 'paper' ? 'text-paper' : 'text-ink',
        className,
      )}
      style={hex ? { backgroundColor: hex } : undefined}
    >
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Progress bar — used for budgets & savings goals
// ---------------------------------------------------------------------------

export function ProgressBar({
  pct,
  state = 'ok',
  className,
}: {
  pct: number
  state?: 'ok' | 'warning' | 'over'
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, pct))
  const fillClass = {
    ok: 'bg-cash',
    warning: 'bg-volt',
    over: 'bg-alert',
  }[state]
  return (
    <div className={cx('h-5 w-full overflow-hidden rounded border-3 bg-canvas', className)}>
      <div
        className={cx('h-full transition-[width] duration-300', fillClass)}
        style={{
          width: `${clamped}%`,
          backgroundImage:
            state === 'over'
              ? 'repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(21,19,15,0.25) 6px, rgba(21,19,15,0.25) 12px)'
              : undefined,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section heading — plain, no eyebrow label, no decorative rules
// ---------------------------------------------------------------------------

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('mb-3 flex items-center justify-between', className)}>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode
  title: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded border-3 border-dashed border-ink/30 bg-paper/60 px-6 py-10 text-center">
      {icon && <div className="text-ink/40">{icon}</div>}
      <div>
        <p className="font-display text-base font-bold text-ink">{title}</p>
        {message && <p className="mt-1 text-sm text-ink/55">{message}</p>}
      </div>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm-delete — icon trigger that swaps to an inline Confirm/Cancel pair,
// so destructive actions (deleting an expense, bill, budget, goal) never
// fire on a single accidental tap.
// ---------------------------------------------------------------------------

export function ConfirmDeleteButton({
  onConfirm,
  label = 'Delete',
  className,
}: {
  onConfirm: () => void
  label?: string
  className?: string
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded border-2 border-alert bg-alert px-2.5 py-1.5 text-xs font-bold text-paper"
        >
          Confirm
        </button>
        <button
          type="button"
          aria-label="Cancel delete"
          onClick={() => setConfirming(false)}
          className="flex h-8 w-8 items-center justify-center rounded border-2 border-ink/30 text-ink/60"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => setConfirming(true)}
      className={cx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-ink/30 text-ink/60 hover:border-alert hover:text-alert',
        className,
      )}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Stat tile — big number + label, used across dashboard/analytics
// ---------------------------------------------------------------------------

export function StatTile({
  label,
  value,
  sub,
  tone = 'ink',
  className,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'ink' | 'cash' | 'alert'
  className?: string
}) {
  const toneClass = { ink: 'text-ink', cash: 'text-cash', alert: 'text-alert' }[tone]
  return (
    <div className={className}>
      <p className="text-sm font-bold text-ink/55">{label}</p>
      <p className={cx('tnum font-display text-3xl font-bold leading-tight', toneClass)}>{value}</p>
      {sub && <p className="mt-0.5 text-sm text-ink/55">{sub}</p>}
    </div>
  )
}
