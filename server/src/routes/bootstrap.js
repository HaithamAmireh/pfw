import { Router } from 'express'
import { db } from '../db.js'
import { ensureRecurringGenerated } from '../recurring.js'
import { expenseToJson, recurringToJson, settingsToJson } from '../serialize.js'

export const bootstrapRouter = Router()

const listExpenses = db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC')
const listRecurring = db.prepare('SELECT * FROM recurring_expenses WHERE user_id = ? ORDER BY day_of_month ASC')
const getSettings = db.prepare('SELECT * FROM settings WHERE user_id = ?')

// Single call on app load: generates this month's missing recurring entries,
// then returns everything the client needs to render — replaces the old
// localStorage hydration path.
bootstrapRouter.get('/', (req, res) => {
  ensureRecurringGenerated(req.userId)

  res.json({
    expenses: listExpenses.all(req.userId).map(expenseToJson),
    recurring: listRecurring.all(req.userId).map(recurringToJson),
    settings: settingsToJson(getSettings.get(req.userId)),
  })
})
