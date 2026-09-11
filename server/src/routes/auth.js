import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { db } from '../db.js'
import {
  clearAuthCookie,
  hashPassword,
  requireAuth,
  setAuthCookie,
  signToken,
  verifyPassword,
} from '../auth.js'

export const authRouter = Router()

const getUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?')
const insertUser = db.prepare(
  'INSERT INTO users (id, email, password_hash, created_at) VALUES (@id, @email, @password_hash, @created_at)',
)
const insertSettings = db.prepare(
  "INSERT INTO settings (user_id, monthly_income, budgets, savings_goals) VALUES (?, 0, '[]', '[]')",
)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

authRouter.post('/register', (req, res) => {
  const { email, password, signupCode } = req.body ?? {}

  const requiredCode = process.env.SIGNUP_CODE
  if (requiredCode && signupCode !== requiredCode) {
    return res.status(403).json({ error: 'Invalid signup code' })
  }

  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  if (getUserByEmail.get(email.toLowerCase())) {
    return res.status(409).json({ error: 'An account with that email already exists' })
  }

  const id = randomUUID()
  insertUser.run({
    id,
    email: email.toLowerCase(),
    password_hash: hashPassword(password),
    created_at: new Date().toISOString(),
  })
  // New accounts start empty — no recurring bills, no income — so every
  // account holds only what that person actually enters.
  insertSettings.run(id)

  setAuthCookie(res, signToken(id))
  res.status(201).json({ id, email: email.toLowerCase() })
})

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {}
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = getUserByEmail.get(email.toLowerCase())
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' })
  }

  setAuthCookie(res, signToken(user.id))
  res.json({ id: user.id, email: user.email })
})

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

authRouter.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  res.json(user)
})
