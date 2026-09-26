import type { Category, CategoryId } from './types'

export const CATEGORIES: Category[] = [
  { id: 'housing', label: 'Housing', icon: 'Home', color: 'cat-housing', hex: '#3D5AFE', textOn: 'paper', group: 'essential' },
  { id: 'food', label: 'Food', icon: 'UtensilsCrossed', color: 'cat-food', hex: '#FF9F1C', textOn: 'ink', group: 'essential' },
  { id: 'transport', label: 'Transport', icon: 'Car', color: 'cat-transport', hex: '#06B6D4', textOn: 'ink', group: 'essential' },
  { id: 'subscription', label: 'Subscriptions', shortLabel: 'Subs', icon: 'Repeat', color: 'cat-subscription', hex: '#8338EC', textOn: 'paper', group: 'subscription' },
  { id: 'utilities', label: 'Utilities', icon: 'Zap', color: 'cat-utilities', hex: '#FF5DA2', textOn: 'ink', group: 'essential' },
  { id: 'debt', label: 'Debt', icon: 'CreditCard', color: 'cat-debt', hex: '#FF4D4D', textOn: 'paper', group: 'essential' },
  { id: 'entertainment', label: 'Entertainment', shortLabel: 'Fun', icon: 'PartyPopper', color: 'cat-entertainment', hex: '#FFD400', textOn: 'ink', group: 'discretionary' },
  { id: 'other', label: 'Other', icon: 'Box', color: 'cat-other', hex: '#6B7280', textOn: 'paper', group: 'discretionary' },
]

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<CategoryId, Category>,
)

export function getCategory(id: CategoryId): Category {
  return CATEGORY_MAP[id]
}

export const GROUP_LABELS: Record<Category['group'], string> = {
  essential: 'Essentials',
  subscription: 'Subscriptions',
  discretionary: 'Discretionary',
}

export const GROUP_COLORS: Record<Category['group'], string> = {
  essential: '#3D5AFE',
  subscription: '#8338EC',
  discretionary: '#FF9F1C',
}
