import { CATEGORIES } from '@/lib/categories'
import type { CategoryId } from '@/lib/types'
import { CategoryIcon } from '@/lib/icons'
import { cx } from './ui'

export function CategoryPicker({
  value,
  onChange,
}: {
  value: CategoryId
  onChange: (id: CategoryId) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CATEGORIES.map((cat) => {
        const active = cat.id === value
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            aria-pressed={active}
            aria-label={cat.label}
            className={cx(
              'flex min-w-0 flex-col items-center gap-1.5 rounded border-3 px-1 py-3 transition-transform duration-75 active:translate-x-[1px] active:translate-y-[1px]',
              active ? 'shadow-none translate-x-[2px] translate-y-[2px]' : 'shadow-brut-sm',
            )}
            style={{ backgroundColor: active ? cat.hex : '#FFFFFF' }}
          >
            <CategoryIcon
              name={cat.icon}
              className={cx('h-6 w-6', active && cat.textOn === 'paper' ? 'text-paper' : 'text-ink')}
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
