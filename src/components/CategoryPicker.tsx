import { CATEGORIES } from '@/lib/categories'
import type { CategoryId } from '@/lib/types'
import { CategoryIcon } from '@/lib/icons'
import { cx } from './ui'

export function CategoryPicker({
  value,
  onChange,
  label = 'Category',
}: {
  value: CategoryId
  onChange: (id: CategoryId) => void
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-2">
      {CATEGORIES.map((cat) => {
        const active = cat.id === value
        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={cat.label}
            onClick={() => onChange(cat.id)}
            className={cx(
              'flex min-h-[68px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-md border-2 px-1 py-2.5 transition-[transform,box-shadow,background-color] duration-75',
              active ? 'border-3 shadow-brut-sm' : 'bg-paper hover:bg-canvas/60',
            )}
            style={active ? { backgroundColor: cat.hex } : undefined}
          >
            <CategoryIcon
              name={cat.icon}
              className={cx('h-5 w-5', active && cat.textOn === 'paper' ? 'text-paper' : 'text-ink')}
            />
            <span
              className={cx(
                'w-full truncate text-center text-xs font-bold leading-tight',
                active && cat.textOn === 'paper' ? 'text-paper' : 'text-ink',
              )}
            >
              <span className="sm:hidden">{cat.shortLabel ?? cat.label}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
