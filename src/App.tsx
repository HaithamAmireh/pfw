import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useWallet } from '@/lib/store'
import { useAuth } from '@/lib/authStore'
import { AppShell, Wordmark } from '@/components/layout/AppShell'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import AddExpense from '@/pages/AddExpense'
import Analytics from '@/pages/Analytics'
import History from '@/pages/History'
import More from '@/pages/Settings'
import Plan from '@/pages/Plan'
import Recurring from '@/pages/Recurring'
import Budgets from '@/pages/Budgets'
import Shopping from '@/pages/Shopping'
import Afford from '@/pages/Afford'

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <div className="flex flex-col items-center gap-3 motion-safe:animate-pulse">
        <Wordmark />
        <p className="text-sm font-bold text-ink/60">{label}</p>
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
    return <LoadingScreen label="Opening your passbook…" />
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
          <Route path="/plan" element={<Plan />} />
          <Route path="/more" element={<More />} />
          <Route path="/settings" element={<Navigate to="/more" replace />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/afford" element={<Afford />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
