import express from 'express'
import cookieParser from 'cookie-parser'
import './db.js'
import { requireAuth } from './auth.js'
import { rateLimit } from './rateLimit.js'
import { authRouter } from './routes/auth.js'
import { expensesRouter } from './routes/expenses.js'
import { recurringRouter } from './routes/recurring.js'
import { settingsRouter } from './routes/settings.js'
import { bootstrapRouter } from './routes/bootstrap.js'

const app = express()

// Runs behind nginx on the same box — trust its X-Forwarded-For so
// rate limiting keys on the real client IP, not 127.0.0.1.
app.set('trust proxy', 1)

app.use(express.json({ limit: '256kb' }))
app.use(cookieParser())

app.use(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
)
app.use(
  '/api/auth/register',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }),
)
app.use('/api/auth', authRouter)

app.use('/api/bootstrap', requireAuth, bootstrapRouter)
app.use('/api/expenses', requireAuth, expensesRouter)
app.use('/api/recurring', requireAuth, recurringRouter)
app.use('/api/settings', requireAuth, settingsRouter)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, '127.0.0.1', () => {
  console.log(`pfw-server listening on 127.0.0.1:${PORT}`)
})
