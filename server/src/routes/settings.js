import { Router } from 'express'
import { db } from '../db.js'
import { settingsToJson } from '../serialize.js'

export const settingsRouter = Router()

const getStmt = db.prepare('SELECT * FROM settings WHERE user_id = ?')
const upsertStmt = db.prepare(`
  INSERT INTO settings (user_id, monthly_income, budgets, savings_goals)
  VALUES (@user_id, @monthly_income, @budgets, @savings_goals)
  ON CONFLICT(user_id) DO UPDATE SET
    monthly_income = excluded.monthly_income,
    budgets = excluded.budgets,
    savings_goals = excluded.savings_goals
`)

function currentOrDefault(userId) {
  return getStmt.get(userId) ?? { user_id: userId, monthly_income: 0, budgets: '[]', savings_goals: '[]' }
}

settingsRouter.get('/', (req, res) => {
  res.json(settingsToJson(getStmt.get(req.userId)))
})

settingsRouter.put('/income', (req, res) => {
  const amount = req.body?.amount
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' })
  }
  const row = currentOrDefault(req.userId)
  row.monthly_income = amount
  upsertStmt.run(row)
  res.json(settingsToJson(row))
})

settingsRouter.put('/budgets', (req, res) => {
  if (!Array.isArray(req.body?.budgets)) {
    return res.status(400).json({ error: 'budgets must be an array' })
  }
  const row = currentOrDefault(req.userId)
  row.budgets = JSON.stringify(req.body.budgets)
  upsertStmt.run(row)
  res.json(settingsToJson(row))
})

settingsRouter.put('/goals', (req, res) => {
  if (!Array.isArray(req.body?.savingsGoals)) {
    return res.status(400).json({ error: 'savingsGoals must be an array' })
  }
  const row = currentOrDefault(req.userId)
  row.savings_goals = JSON.stringify(req.body.savingsGoals)
  upsertStmt.run(row)
  res.json(settingsToJson(row))
})
