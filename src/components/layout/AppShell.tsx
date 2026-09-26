import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, Crosshair, Ellipsis, House, Plus, TriangleAlert, X } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { cx } from '../ui'

// Each tab owns the pages reached from it, so the bar keeps its place when you
// drill into Budgets (Plan) or Shopping (More).
const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: House, match: ['/'] },
  { to: '/plan', label: 'Plan', icon: Crosshair, match: ['/plan', '/afford', '/budgets', '/recurring'] },
  { to: '/history', label: 'History', icon: BookOpen, match: ['/history', '/analytics'] },
  { to: '/more', label: 'More', icon: Ellipsis, match: ['/more', '/settings', '/shopping'] },
]

function isActive(pathname: string, match: string[]) {
  return match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)))
}

export function AppShell() {
  const { pathname } = useLocation()

  // HashRouter doesn't reset scroll, so a new page would open wherever the
  // last one was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const [home, plan, history, more] = NAV_ITEMS
  const onAdd = pathname.startsWith('/add')

  return (
    <div className="min-h-dvh md:flex">
      <aside className="hidden w-60 shrink-0 border-r-2 border-ink bg-paper md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <Link to="/" className="flex items-center gap-2.5 border-b-2 border-ink px-5 py-5">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => (
            <SideLink key={item.to} {...item} active={isActive(pathname, item.match)} />
          ))}
        </nav>
        <div className="p-4">
          <Link
            to="/add"
            className={cx(
              'flex min-h-12 items-center justify-center gap-2 rounded-md border-3 bg-volt px-4 font-display font-bold shadow-brut-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
              onAdd && 'translate-x-[2px] translate-y-[2px] shadow-none',
            )}
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
            Add expense
          </Link>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <ErrorBanner />
        <main className="flex-1 pb-28 md:pb-10">
          <div className="mx-auto w-full max-w-2xl px-4 pb-6 pt-[calc(env(safe-area-inset-top)+20px)] md:px-8 md:pt-10">
            <Outlet />
          </div>
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 items-stretch px-1">
          <BottomLink {...home} active={isActive(pathname, home.match)} />
          <BottomLink {...plan} active={isActive(pathname, plan.match)} />
          <Link to="/add" aria-label="Add expense" aria-current={onAdd ? 'page' : undefined} className="flex items-center justify-center py-2">
            <span
              className={cx(
                'flex h-12 w-12 items-center justify-center rounded-md border-3 bg-volt shadow-brut-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                onAdd && 'translate-x-[2px] translate-y-[2px] shadow-none',
              )}
            >
              <Plus className="h-6 w-6 text-ink" strokeWidth={3} />
            </span>
          </Link>
          <BottomLink {...history} active={isActive(pathname, history.match)} />
          <BottomLink {...more} active={isActive(pathname, more.match)} />
        </div>
      </nav>
    </div>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx('flex items-center gap-2', className)}>
      <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-md border-3 bg-volt shadow-brut-sm">
        <span className="font-wide font-display text-base font-extrabold leading-none">L</span>
      </span>
      <span className="font-wide font-display text-xl font-extrabold tracking-[-0.02em]">Ledger</span>
    </span>
  )
}

function ErrorBanner() {
  const error = useWallet((s) => s.error)
  const clearError = useWallet((s) => s.clearError)

  if (!error) return null

  return (
    <div role="alert" className="sticky top-0 z-20 flex items-center gap-2 border-b-2 border-ink bg-alert px-4 py-2.5 text-paper">
      <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      <p className="flex-1 text-sm font-bold">{error}</p>
      <button
        type="button"
        aria-label="Dismiss error"
        onClick={clearError}
        className="hit flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-paper/60 hover:border-paper"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}

type NavProps = { to: string; label: string; icon: typeof House; active: boolean }

function SideLink({ to, label, icon: Icon, active }: NavProps) {
  return (
    <NavLink
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex min-h-11 items-center gap-3 rounded-md border-2 px-3 font-display font-bold transition-colors',
        active ? 'border-ink bg-canvas' : 'border-transparent text-ink/60 hover:text-ink',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2.25} />
      {label}
    </NavLink>
  )
}

function BottomLink({ to, label, icon: Icon, active }: NavProps) {
  return (
    <NavLink
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition-colors',
        active ? 'text-ink' : 'text-ink/60',
      )}
    >
      {active && <span aria-hidden="true" className="absolute inset-x-5 top-0 h-[3px] rounded-b bg-volt" />}
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
      {label}
    </NavLink>
  )
}
