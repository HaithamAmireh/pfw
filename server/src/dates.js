export function monthKeyOf(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function dateForDayInMonth(key, day) {
  const [y, m] = key.split('-').map(Number)
  const clamped = Math.min(day, daysInMonth(key))
  const dd = String(clamped).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}
