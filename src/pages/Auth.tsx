import { useState } from 'react'
import { useAuth } from '@/lib/authStore'
import { apiErrorMessage } from '@/lib/api'
import { Button, Field, Input, Segmented } from '@/components/ui'
import { Wordmark } from '@/components/layout/AppShell'

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
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Wordmark className="scale-125" />
          <p className="mt-2 max-w-[18rem] text-[15px] text-ink/70">Your month as a passbook. Log what you spend, see what’s left, and check a purchase before you make it.</p>
        </div>

        <div className="mb-4 flex justify-center">
          <Segmented
            label="Account"
            value={mode}
            onChange={(m) => {
              setMode(m)
              setError('')
            }}
            options={[
              { id: 'login', label: 'Sign in' },
              { id: 'register', label: 'Create account' },
            ]}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border-3 bg-paper p-5 shadow-brut">
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

          {error && (
            <p role="alert" className="text-sm font-bold text-alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" full disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
