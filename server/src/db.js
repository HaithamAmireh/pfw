import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

// Kept outside the deploy path (which gets wiped and re-copied on every
// deploy) — see DB_PATH in the systemd env file on the server.
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite')
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurring_id TEXT,
    payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);

  CREATE TABLE IF NOT EXISTS recurring_expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    payment_method TEXT NOT NULL,
    amount_history TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_expenses(user_id);

  CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_income REAL NOT NULL DEFAULT 0,
    budgets TEXT NOT NULL DEFAULT '[]',
    savings_goals TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS shopping_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    expense_id TEXT REFERENCES expenses(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    checked_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_shopping_items_user ON shopping_items(user_id);
`)

// Bills used to only generate on their billing day; now they generate as
// soon as the month starts, so the column no longer means anything —
// dropped here for databases created before this change.
const hasDayOfMonth = db
  .prepare("SELECT 1 FROM pragma_table_info('recurring_expenses') WHERE name = 'day_of_month'")
  .get()
if (hasDayOfMonth) {
  db.exec('ALTER TABLE recurring_expenses DROP COLUMN day_of_month')
}
