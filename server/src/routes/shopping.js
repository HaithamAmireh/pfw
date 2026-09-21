import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { db } from '../db.js'
import { shoppingItemToJson, expenseToJson } from '../serialize.js'

export const shoppingRouter = Router()

const listStmt = db.prepare(
  'SELECT * FROM shopping_items WHERE user_id = ? ORDER BY checked ASC, created_at DESC',
)
const getOwnedStmt = db.prepare('SELECT * FROM shopping_items WHERE id = ? AND user_id = ?')
const insertStmt = db.prepare(`
  INSERT INTO shopping_items (id, user_id, name, checked, expense_id, created_at, checked_at)
  VALUES (@id, @user_id, @name, 0, NULL, @created_at, NULL)
`)
const deleteStmt = db.prepare('DELETE FROM shopping_items WHERE id = ? AND user_id = ?')
const insertExpenseStmt = db.prepare(`
  INSERT INTO expenses (id, user_id, date, amount, category, note, is_recurring, recurring_id, payment_method, created_at)
  VALUES (@id, @user_id, @date, @amount, @category, @note, 0, NULL, @payment_method, @created_at)
`)
const deleteExpenseStmt = db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?')
const checkStmt = db.prepare(
  'UPDATE shopping_items SET checked = 1, expense_id = @expense_id, checked_at = @checked_at WHERE id = @id AND user_id = @user_id',
)
const uncheckStmt = db.prepare(
  'UPDATE shopping_items SET checked = 0, expense_id = NULL, checked_at = NULL WHERE id = ? AND user_id = ?',
)

shoppingRouter.get('/', (req, res) => {
  res.json(listStmt.all(req.userId).map(shoppingItemToJson))
})

shoppingRouter.post('/', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const row = {
    id: randomUUID(),
    user_id: req.userId,
    name,
    created_at: new Date().toISOString(),
  }
  insertStmt.run(row)
  res.status(201).json(shoppingItemToJson(getOwnedStmt.get(row.id, req.userId)))
})

shoppingRouter.delete('/:id', (req, res) => {
  const result = deleteStmt.run(req.params.id, req.userId)
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
  res.status(204).end()
})

// Checking an item off logs it as a real expense so it shows up in
// history/analytics/budgets, and links the two so unchecking can undo it.
shoppingRouter.post('/:id/check', (req, res) => {
  const item = getOwnedStmt.get(req.params.id, req.userId)
  if (!item) return res.status(404).json({ error: 'Not found' })

  const { amount, category, paymentMethod, date } = req.body ?? {}
  if (typeof amount !== 'number' || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })
  if (typeof category !== 'string') return res.status(400).json({ error: 'Invalid category' })
  if (typeof paymentMethod !== 'string') return res.status(400).json({ error: 'Invalid payment method' })

  const expenseRow = {
    id: randomUUID(),
    user_id: req.userId,
    date: typeof date === 'string' ? date : new Date().toISOString().slice(0, 10),
    amount,
    category,
    note: item.name,
    payment_method: paymentMethod,
    created_at: new Date().toISOString(),
  }

  const run = db.transaction(() => {
    insertExpenseStmt.run(expenseRow)
    checkStmt.run({ id: item.id, user_id: req.userId, expense_id: expenseRow.id, checked_at: new Date().toISOString() })
  })
  run()

  res.json({
    item: shoppingItemToJson(getOwnedStmt.get(item.id, req.userId)),
    expense: expenseToJson(expenseRow),
  })
})

// Undo: removes the linked expense and puts the item back on the list.
shoppingRouter.post('/:id/uncheck', (req, res) => {
  const item = getOwnedStmt.get(req.params.id, req.userId)
  if (!item) return res.status(404).json({ error: 'Not found' })

  const run = db.transaction(() => {
    if (item.expense_id) deleteExpenseStmt.run(item.expense_id, req.userId)
    uncheckStmt.run(item.id, req.userId)
  })
  run()

  res.json({ item: shoppingItemToJson(getOwnedStmt.get(item.id, req.userId)), deletedExpenseId: item.expense_id })
})
