import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { db } from '../db.js'
import { expenseToJson } from '../serialize.js'

export const expensesRouter = Router()

const listStmt = db.prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC')
const insertStmt = db.prepare(`
  INSERT INTO expenses (id, user_id, date, amount, category, note, is_recurring, recurring_id, payment_method, created_at)
  VALUES (@id, @user_id, @date, @amount, @category, @note, @is_recurring, @recurring_id, @payment_method, @created_at)
`)
const getOwnedStmt = db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
const deleteStmt = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')

function isValidExpense(body) {
  return (
    body &&
    typeof body.date === 'string' &&
    typeof body.amount === 'number' &&
    body.amount > 0 &&
    typeof body.category === 'string' &&
    typeof body.paymentMethod === 'string'
  )
}

expensesRouter.get('/', (req, res) => {
  res.json(listStmt.all(req.userId).map(expenseToJson))
})

expensesRouter.post('/', (req, res) => {
  if (!isValidExpense(req.body)) return res.status(400).json({ error: 'Invalid expense' })
  const row = {
    id: randomUUID(),
    user_id: req.userId,
    date: req.body.date,
    amount: req.body.amount,
    category: req.body.category,
    note: req.body.note ?? '',
    is_recurring: 0,
    recurring_id: null,
    payment_method: req.body.paymentMethod,
    created_at: new Date().toISOString(),
  }
  insertStmt.run(row)
  res.status(201).json(expenseToJson(row))
})

expensesRouter.patch('/:id', (req, res) => {
  const existing = getOwnedStmt.get(req.params.id, req.userId)
  if (!existing) return res.status(404).json({ error: 'Not found' })

  const next = {
    ...existing,
    date: typeof req.body.date === 'string' ? req.body.date : existing.date,
    amount: typeof req.body.amount === 'number' && req.body.amount > 0 ? req.body.amount : existing.amount,
    category: typeof req.body.category === 'string' ? req.body.category : existing.category,
    note: typeof req.body.note === 'string' ? req.body.note : existing.note,
    payment_method: typeof req.body.paymentMethod === 'string' ? req.body.paymentMethod : existing.payment_method,
  }
  db.prepare(
    'UPDATE expenses SET date = @date, amount = @amount, category = @category, note = @note, payment_method = @payment_method WHERE id = @id AND user_id = @user_id',
  ).run(next)
  res.json(expenseToJson(next))
})

expensesRouter.delete('/:id', (req, res) => {
  const result = deleteStmt.run(req.params.id, req.userId)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
})
