// Jordanian dinar. Officially three decimals (fils), but everyday receipts and
// bank apps show two, so the app does too.
const figureFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const CURRENCY = 'JD'

// A bare figure for ledger columns, where the column header carries the unit.
export function figure(amount: number): string {
  return figureFormatter.format(amount)
}

export function money(amount: number, opts: { sign?: boolean } = {}): string {
  const { sign = false } = opts
  const formatted = `${CURRENCY} ${figure(Math.abs(amount))}`
  const prefix = sign ? (amount < 0 ? '−' : '+') : amount < 0 ? '−' : ''
  return `${prefix}${formatted}`
}

export function pct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function signedPct(value: number, decimals = 0): string {
  const s = value > 0 ? '+' : ''
  return `${s}${value.toFixed(decimals)}%`
}

// Chart axis ticks: whole dinars, compact past 1k (0, 250, 1.2k).
export function moneyAxis(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1000) return `${(abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}k`
  return `${Math.round(abs)}`
}

// Parses what people type into amount fields ("12", "12.5", "12.50").
export function parseAmount(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function cleanAmountInput(raw: string): string {
  const digits = raw.replace(/[^0-9.]/g, '')
  const [whole, ...rest] = digits.split('.')
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole
}
