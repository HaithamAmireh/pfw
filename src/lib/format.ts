const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function money(amount: number, opts: { sign?: boolean } = {}): string {
  const { sign = false } = opts
  const formatted = currencyFormatter.format(Math.abs(amount))
  const prefix = sign ? (amount < 0 ? '-' : '+') : amount < 0 ? '-' : ''
  return `${prefix}${formatted}`
}

export function pct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function signedPct(value: number, decimals = 0): string {
  const s = value > 0 ? '+' : ''
  return `${s}${value.toFixed(decimals)}%`
}

// Chart axis ticks: whole units, compact past 1k ($0, $250, $1.2k).
export function moneyAxis(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1000) return `$${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k`
  return `$${Math.round(abs)}`
}
