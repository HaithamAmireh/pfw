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

export function moneyCompact(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1000) {
    return `${amount < 0 ? '-' : ''}$${(abs / 1000).toFixed(1)}k`
  }
  return money(amount)
}

export function pct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function signedPct(value: number, decimals = 0): string {
  const s = value > 0 ? '+' : ''
  return `${s}${value.toFixed(decimals)}%`
}
