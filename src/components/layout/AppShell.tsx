import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  BarChart3,
  CircleHelp,
  ListOrdered,
  Repeat,
  Settings,
  ShoppingCart,
  Plus,
  Target,
  WalletCards,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useWallet } from '@/lib/store'
import { cx } from '../ui'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/add', label: 'Add', icon: Plus, end: false, isAction: true },
  { to: '/history', label: 'History', icon: ListOrdered, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

// Desktop has room for the tools that live behind Settings on mobile.
const TOOL_ITEMS = [
  { to: '/afford', label: 'Can I afford it?', icon: CircleHelp, end: false },
  { to: '/budgets', label: 'Budgets & goals', icon: Target, end: false },
  { to: '/recurring', label: 'Recurring bills', icon: Repeat, end: false },
  { to: '/shopping', label: 'Shopping list', icon: ShoppingCart, end: false },
]

export function AppShell() {
  const { pathname } = useLocation()

  // HashRouter doesn't reset scroll, so a new page would open wherever the
  // last one was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden w-60 shrink-0 border-r-3 border-ink bg-paper md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <div className="flex items-center gap-2 border-b-3 border-ink px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded border-3 bg-volt shadow-brut-sm">
            <WalletCards className="h-5 w-5 text-ink" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold">Ledger</span>
        </div>
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {NAV_ITEMS.filter((i) => !i.isAction).map((item) => (
            <SideLink key={item.to} {...item} />
          ))}
          <p className="mt-4 px-3 text-xs font-bold uppercase tracking-wide text-ink/40">Tools</p>
          {TOOL_ITEMS.map((item) => (
            <SideLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="p-4">
          <NavLink to="/add">
            {({ isActive }) => (
              <div
                className={cx(
                  'flex items-center justify-center gap-2 rounded border-3 bg-volt px-4 py-3 font-display font-bold shadow-brut transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                  isActive && 'translate-x-[2px] translate-y-[2px] shadow-none',
                )}
              >
                <Plus className="h-5 w-5" strokeWidth={3} />
                Add expense
              </div>
            )}
          </NavLink>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        <ErrorBanner />
        <main className="flex-1 pb-24 md:pb-8">
          <div className="mx-auto w-full max-w-4xl px-4 py-5 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-3 border-ink bg-paper md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) =>
            item.isAction ? (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label="Add expense"
                className="relative flex flex-1 items-center justify-center"
              >
                <div className="-mt-6 flex h-14 w-14 items-center justify-center rounded border-3 bg-volt shadow-brut">
                  <Plus className="h-7 w-7 text-ink" strokeWidth={3} />
                </div>
              </NavLink>
            ) : (
              <BottomLink key={item.to} {...item} />
            ),
          )}
        </div>
      </nav>
    </div>
  )
}

function ErrorBanner() {
  const error = useWallet((s) => s.error)
  const clearError = useWallet((s) => s.clearError)

  if (!error) return null

  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b-3 border-ink bg-alert px-4 py-2.5 text-paper">
      <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      <p className="flex-1 text-sm font-bold">{error}</p>
      <button
        type="button"
        aria-label="Dismiss error"
        onClick={clearError}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-paper/60 hover:border-paper"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function SideLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutGrid
  end: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex items-center gap-3 rounded border-3 px-3 py-2.5 font-display font-bold transition-colors',
          isActive ? 'border-ink bg-canvas shadow-brut-sm' : 'border-transparent text-ink/60 hover:text-ink',
        )
      }
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} />
      {label}
    </NavLink>
  )
}

function BottomLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof LayoutGrid
  end: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors',
          isActive ? 'text-ink' : 'text-ink/40',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.75 : 2.25} />
          {label}
        </>
      )}
    </NavLink>
  )
}
