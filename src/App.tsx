import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { WalletCards } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useAuth } from '@/lib/authStore'
import { AppShell } from '@/components/layout/AppShell'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import AddExpense from '@/pages/AddExpense'
import Analytics from '@/pages/Analytics'
import History from '@/pages/History'
import SettingsPage from '@/pages/Settings'
import Recurring from '@/pages/Recurring'
import Budgets from '@/pages/Budgets'

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded border-3 bg-volt shadow-brut">
          <WalletCards className="h-7 w-7 text-ink" strokeWidth={2.5} />
        </div>
        <p className="font-display font-bold text-ink/60">{label}</p>
      </div>
    </div>
  )
}

export default function App() {
  const authStatus = useAuth((s) => s.status)
  const checkSession = useAuth((s) => s.checkSession)
  const walletLoaded = useWallet((s) => s.loaded)
  const bootstrap = useWallet((s) => s.bootstrap)
  const resetWallet = useWallet((s) => s.reset)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    if (authStatus === 'signed-in') {
      bootstrap()
    } else if (authStatus === 'signed-out') {
      resetWallet()
    }
  }, [authStatus, bootstrap, resetWallet])

  if (authStatus === 'checking') {
    return <LoadingScreen label="Loading…" />
  }

  if (authStatus === 'signed-out') {
    return <Auth />
  }

  if (!walletLoaded) {
    return <LoadingScreen label="Loading your ledger…" />
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
