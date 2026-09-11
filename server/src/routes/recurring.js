import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { db } from '../db.js'
import { recurringToJson } from '../serialize.js'

export const recurringRouter = Router()

const listStmt = db.prepare('SELECT * FROM recurring_expenses WHERE user_id = ? ORDER BY day_of_month ASC')
const insertStmt = db.prepare(`
  INSERT INTO recurring_expenses (id, user_id, name, category, amount, active, payment_method, day_of_month, amount_history, created_at)
  VALUES (@id, @user_id, @name, @category, @amount, @active, @payment_method, @day_of_month, @amount_history, @created_at)
`)
const getOwnedStmt = db.prepare('SELECT * FROM recurring_expenses WHERE id = ? AND user_id = ?')
const deleteStmt = db.prepare('DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?')

function isValidRecurring(body) {
  return (
    body &&
    typeof body.name === 'string' &&
    body.name.trim() !== '' &&
    typeof body.amount === 'number' &&
    body.amount > 0 &&
    typeof body.category === 'string' &&
    typeof body.paymentMethod === 'string' &&
    Number.isInteger(body.dayOfMonth) &&
    body.dayOfMonth >= 1 &&
    body.dayOfMonth <= 28
  )
}

recurringRouter.get('/', (req, res) => {
  res.json(listStmt.all(req.userId).map(recurringToJson))
})

recurringRouter.post('/', (req, res) => {
  if (!isValidRecurring(req.body)) return res.status(400).json({ error: 'Invalid recurring bill' })
  const now = new Date().toISOString()
  const row = {
    id: randomUUID(),
    user_id: req.userId,
    name: req.body.name,
    category: req.body.category,
    amount: req.body.amount,
    active: 1,
    payment_method: req.body.paymentMethod,
    day_of_month: req.body.dayOfMonth,
    amount_history: JSON.stringify([{ date: now, amount: req.body.amount }]),
    created_at: now,
  }
  insertStmt.run(row)
  res.status(201).json(recurringToJson(row))
})

recurringRouter.patch('/:id', (req, res) => {
  const existing = getOwnedStmt.get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const nextAmount =
    typeof req.body.amount === 'number' && req.body.amount > 0 ? req.body.amount : existing.amount
  let amountHistory = JSON.parse(existing.amount_history)
  if (nextAmount !== existing.amount) {
    amountHistory = [...amountHistory, { date: new Date().toISOString(), amount: nextAmount }]
  }

  const next = {
    ...existing,
    name: typeof req.body.name === 'string' && req.body.name.trim() !== '' ? req.body.name : existing.name,
    category: typeof req.body.category === 'string' ? req.body.category : existing.category,
    amount: nextAmount,
    active: typeof req.body.active === 'boolean' ? (req.body.active ? 1 : 0) : existing.active,
    payment_method:
      typeof req.body.paymentMethod === 'string' ? req.body.paymentMethod : existing.payment_method,
    day_of_month:
      Number.isInteger(req.body.dayOfMonth) && req.body.dayOfMonth >= 1 && req.body.dayOfMonth <= 28
        ? req.body.dayOfMonth
        : existing.day_of_month,
    amount_history: JSON.stringify(amountHistory),
  }
  db.prepare(
    `UPDATE recurring_expenses SET name = @name, category = @category, amount = @amount, active = @active,
     payment_method = @payment_method, day_of_month = @day_of_month, amount_history = @amount_history
     WHERE id = @id AND user_id = @user_id`,
  ).run(next)
  res.json(recurringToJson(next))
})

recurringRouter.delete('/:id', (req, res) => {
  const result = deleteStmt.run(req.params.id, req.userId)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
})
