import { HashRouter, Route, Routes } from 'react-router-dom'
import { WalletCards } from 'lucide-react'
import { useHydrated } from '@/lib/store'
import { AppShell } from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import AddExpense from '@/pages/AddExpense'
import Analytics from '@/pages/Analytics'
import History from '@/pages/History'
import SettingsPage from '@/pages/Settings'
import Recurring from '@/pages/Recurring'
import Budgets from '@/pages/Budgets'

export default function App() {
  const hydrated = useHydrated()

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded border-3 bg-volt shadow-brut">
            <WalletCards className="h-7 w-7 text-ink" strokeWidth={2.5} />
          </div>
          <p className="font-display font-bold text-ink/60">Loading your ledger…</p>
        </div>
      </div>
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddExpense />} />
          <Route path="/add/:id" element={<AddExpense />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/budgets" element={<Budgets />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
