import {
  Home,
  UtensilsCrossed,
  Car,
  Repeat,
  Zap,
  CreditCard,
  PartyPopper,
  Box,
  type LucideIcon,
} from 'lucide-react'

export const ICONS: Record<string, LucideIcon> = {
  Home,
  UtensilsCrossed,
  Car,
  Repeat,
  Zap,
  CreditCard,
  PartyPopper,
  Box,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Box
  return <Icon className={className} strokeWidth={2.5} />
}
