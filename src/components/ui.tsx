import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Trash2, X } from 'lucide-react'
import { figure } from '@/lib/format'
import { getCategory } from '@/lib/categories'
import type { CategoryId } from '@/lib/types'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Card — a plain ruled surface. Only the one thing per screen that matters
// earns the hard offset shadow (and the heavier border that goes with it).
// ---------------------------------------------------------------------------

type ShadowVariant = 'ink' | 'cash' | 'alert' | 'none'

export function Card({
  children,
  className,
  shadow = 'none',
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
    ink: 'border-3 shadow-brut',
    cash: 'border-3 shadow-brut-cash',
    alert: 'border-3 shadow-brut-alert',
    none: 'border-2',
  }[shadow]
  const padClass = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  }[padding]
  return <Tag className={cx('rounded-md bg-paper', shadowClass, padClass, className)}>{children}</Tag>
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'cash' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary: 'bg-volt text-ink border-3 shadow-brut-sm hover:bg-[#ff8a1f]',
  secondary: 'bg-paper text-ink border-3 shadow-brut-sm hover:bg-canvas',
  danger: 'bg-alert text-paper border-3 shadow-brut-sm',
  cash: 'bg-cash text-paper border-3 shadow-brut-sm',
  ghost: 'bg-transparent text-ink border-2 border-ink/25 hover:border-ink',
}

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-sm gap-1.5',
  md: 'min-h-11 px-4 py-2.5 text-base gap-2',
  lg: 'min-h-14 px-6 py-3.5 text-lg gap-2.5',
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
        'inline-flex items-center justify-center rounded-md font-display font-bold transition-[transform,background-color,box-shadow] duration-75 disabled:pointer-events-none disabled:opacity-40',
        pressable && 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
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

// Small square icon control (back, close, edit). The visual box is 36px; the
// `hit` utility grows its touch target to ~48px.
export function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        'hit flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 bg-paper transition-colors hover:bg-canvas',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page header — one pattern for every screen: optional back, title, action.
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  back,
  sub,
  action,
}: {
  title: string
  back?: boolean
  sub?: ReactNode
  action?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 items-center gap-3">
        {back && (
          <IconButton label="Back" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" strokeWidth={2.75} />
          </IconButton>
        )}
        <div className="min-w-0">
          <h1 className="font-wide truncate font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">
            {title}
          </h1>
          {sub && <p className="mt-1.5 text-sm font-semibold text-ink/60">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cx(
          'tnum min-h-11 w-full rounded-md border-2 bg-paper px-3.5 py-2.5 font-display text-base font-medium text-ink placeholder:text-ink/40 focus:border-ink',
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
      <div className="relative">
        <select
          ref={ref}
          className={cx(
            'min-h-11 w-full appearance-none rounded-md border-2 bg-paper py-2.5 pl-3.5 pr-9 font-display text-base font-medium text-ink',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60"
          strokeWidth={2.5}
        />
      </div>
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
    <label className="block min-w-0">
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/60">{hint}</span>}
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

// A category's colour as a small square chip — colour identifies, it doesn't decorate.
export function CategoryChip({ category, className }: { category: CategoryId; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx('inline-block h-3 w-3 shrink-0 rounded-[2px] border-2 border-ink', className)}
      style={{ backgroundColor: getCategory(category).hex }}
    />
  )
}

// ---------------------------------------------------------------------------
// Stamp — the passbook's rubber stamp: state you should notice at a glance.
// ---------------------------------------------------------------------------

export type StampTone = 'blue' | 'red' | 'green'

export function Stamp({
  children,
  tone = 'blue',
  className,
}: {
  children: ReactNode
  tone?: StampTone
  className?: string
}) {
  const toneClass = { blue: 'border-stamp text-stamp', red: 'border-alert text-alert', green: 'border-cash text-cash' }[tone]
  return (
    <span
      className={cx(
        'inline-block shrink-0 -rotate-[4deg] rounded border-2 px-2 py-1 text-center font-display text-[11px] font-extrabold uppercase leading-tight tracking-[0.06em] motion-safe:animate-stamp-in',
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Ledger — ruled rows with a running balance, the app's core surface.
// ---------------------------------------------------------------------------

export function Ledger({
  children,
  caption,
  className,
  showBalance = true,
}: {
  children: ReactNode
  caption: string
  className?: string
  showBalance?: boolean
}) {
  return (
    <div role="table" aria-label={caption} className={cx('overflow-hidden rounded-md border-2 bg-paper', className)}>
      <div role="rowgroup">
        <div
          role="row"
          className={cx(
            'ledger-head grid items-end gap-1.5 px-2.5 sm:gap-2 sm:px-3 pb-1.5 pt-2.5 text-[10px] font-bold uppercase tracking-[0.04em] text-ink/60',
            showBalance ? 'grid-cols-[24px_minmax(84px,1fr)_60px_68px]' : 'grid-cols-[24px_minmax(84px,1fr)_68px]',
          )}
        >
          <span role="columnheader">Day</span>
          <span role="columnheader">Entry</span>
          <span role="columnheader" className="text-right">
            Debit
          </span>
          {showBalance && (
            <span role="columnheader" className="text-right">
              Balance
            </span>
          )}
        </div>
      </div>
      <div role="rowgroup">{children}</div>
    </div>
  )
}

export function LedgerRow({
  day,
  title,
  sub,
  category,
  debit,
  credit,
  balance,
  to,
  pencil,
  muted,
  showBalance = true,
}: {
  day?: string
  title: ReactNode
  sub?: ReactNode
  category?: CategoryId
  debit?: number
  credit?: number
  balance?: number
  to?: string
  pencil?: boolean
  muted?: boolean
  showBalance?: boolean
}) {
  const content = (
    <>
      <span role="cell" className="font-mono text-xs text-ink/60 tnum">
        {day}
      </span>
      <span role="cell" className="min-w-0">
        <span className="flex items-center gap-2">
          {category && <CategoryChip category={category} />}
          <span className={cx('truncate text-[15px] font-semibold', pencil && 'font-mono text-sm font-medium italic')}>
            {title}
          </span>
        </span>
        {sub && <span className="mt-0.5 block truncate text-xs font-medium text-ink/60">{sub}</span>}
      </span>
      <span role="cell" className="text-right font-mono text-[13px] tnum">
        {debit !== undefined ? figure(debit) : credit !== undefined ? `+${figure(credit)}` : ''}
      </span>
      {showBalance && (
        <span
          role="cell"
          className={cx('text-right font-mono text-[13px] font-semibold tnum', balance !== undefined && balance < 0 && 'text-alert')}
        >
          {balance !== undefined ? figure(balance) : ''}
        </span>
      )}
    </>
  )
  const rowClass = cx(
    'grid items-center gap-1.5 border-b border-rule px-2.5 py-2.5 last:border-b-0 sm:gap-2 sm:px-3',
    showBalance ? 'grid-cols-[24px_minmax(84px,1fr)_60px_68px]' : 'grid-cols-[24px_minmax(84px,1fr)_68px]',
    pencil && 'border-b-2 border-dashed border-pencil/60 bg-canvas/50 text-pencil motion-safe:animate-pencil-in',
    muted && 'text-ink/60',
  )
  if (to) {
    return (
      <Link role="row" to={to} className={cx(rowClass, 'transition-colors hover:bg-canvas/60 focus-visible:bg-canvas/60')}>
        {content}
      </Link>
    )
  }
  return (
    <div role="row" className={rowClass}>
      {content}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progress bar — used for the month, budgets & savings goals
// ---------------------------------------------------------------------------

export function ProgressBar({
  pct,
  state = 'ok',
  className,
  label,
}: {
  pct: number
  state?: 'ok' | 'warning' | 'over' | 'ink'
  className?: string
  label?: string
}) {
  const clamped = Math.min(100, Math.max(0, pct))
  const fillClass = {
    ok: 'bg-cash',
    warning: 'bg-volt',
    over: 'bg-alert',
    ink: 'bg-ink',
  }[state]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cx('h-3.5 w-full overflow-hidden rounded-[3px] border-2 bg-canvas', className)}
    >
      <div className={cx('h-full transition-[width] duration-300 ease-out', fillClass)} style={{ width: `${clamped}%` }} />
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
  id,
}: {
  title: string
  action?: ReactNode
  className?: string
  id?: string
}) {
  return (
    <div className={cx('mb-2.5 flex items-end justify-between gap-3', className)}>
      <h2 id={id} className="font-semiwide font-display text-lg font-extrabold tracking-[-0.01em] text-ink">
        {title}
      </h2>
      {action}
    </div>
  )
}

export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-sm font-bold text-ink underline decoration-2 underline-offset-4 hover:decoration-volt">
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Empty state — teaches the next step instead of just saying "nothing here"
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-ink/30 px-6 py-9 text-center">
      {icon && <div className="text-ink/40">{icon}</div>}
      <div className="max-w-xs">
        <p className="font-display text-base font-bold text-ink">{title}</p>
        {message && <p className="mt-1 text-sm text-ink/60">{message}</p>}
      </div>
      {action}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm-delete — icon trigger that swaps to an inline Confirm/Cancel pair,
// so destructive actions never fire on a single accidental tap.
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
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-9 rounded-md border-2 border-alert bg-alert px-3 text-xs font-bold text-paper"
        >
          Delete
        </button>
        <button
          type="button"
          aria-label="Cancel delete"
          onClick={() => setConfirming(false)}
          className="hit flex h-9 w-9 items-center justify-center rounded-md border-2 border-ink/25 text-ink/60"
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
        'hit flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink/25 text-ink/60 hover:border-alert hover:text-alert',
        className,
      )}
    >
      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Segmented control — two or three sibling views of one thing
// ---------------------------------------------------------------------------

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { id: T; label: string; to?: string }[]
  onChange?: (id: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-md border-2 bg-paper p-1">
      {options.map((o) => {
        const active = o.id === value
        const cls = cx(
          'min-h-9 rounded px-3.5 py-1.5 font-display text-sm font-bold transition-colors',
          active ? 'bg-ink text-paper' : 'text-ink/60 hover:text-ink',
        )
        return o.to ? (
          <Link key={o.id} role="tab" aria-selected={active} to={o.to} className={cls}>
            {o.label}
          </Link>
        ) : (
          <button key={o.id} role="tab" aria-selected={active} type="button" onClick={() => onChange?.(o.id)} className={cls}>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
