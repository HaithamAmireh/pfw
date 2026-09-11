import { useState } from 'react'
import { WalletCards } from 'lucide-react'
import { useAuth } from '@/lib/authStore'
import { apiErrorMessage } from '@/lib/api'
import { Button, Field, Input, cx } from '@/components/ui'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const login = useAuth((s) => s.login)
  const register = useAuth((s) => s.register)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupCode, setSignupCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, signupCode)
      }
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded border-3 bg-volt shadow-brut">
            <WalletCards className="h-7 w-7 text-ink" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold">Ledger</h1>
        </div>

        <div className="mb-5 flex rounded border-3 bg-paper p-1 shadow-brut-sm">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError('')
            }}
            className={cx(
              'flex-1 rounded px-3 py-2 font-display text-sm font-bold transition-colors',
              mode === 'login' ? 'bg-volt text-ink' : 'text-ink/50',
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError('')
            }}
            className={cx(
              'flex-1 rounded px-3 py-2 font-display text-sm font-bold transition-colors',
              mode === 'register' ? 'bg-volt text-ink' : 'text-ink/50',
            )}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded border-3 bg-paper p-5 shadow-brut">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" hint={mode === 'register' ? 'At least 8 characters' : undefined}>
            <Input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'register' ? 8 : undefined}
              required
            />
          </Field>
          {mode === 'register' && (
            <Field label="Invite code" hint="Ask the account owner if you don't have one">
              <Input
                autoComplete="off"
                value={signupCode}
                onChange={(e) => setSignupCode(e.target.value)}
              />
            </Field>
          )}

          {error && <p className="text-sm font-bold text-alert">{error}</p>}

          <Button type="submit" size="lg" full disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
