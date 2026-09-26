# Ledger design system

**Brutalist passbook.** The month is a bank passbook: income is brought forward on the 1st, and every entry lowers a running balance you can read line by line. The visual language is disciplined neo-brutalism: ink rules, one orange, hard edges, and a hard shadow only on the one thing per screen that matters.

## Principles

1. **The balance is the product.** Every list of money is a ledger with a running balance, not a feed of cards.
2. **Pencil before ink.** Anything not yet spent (an afford check, a shopping item) is drawn in pencil: graphite, italic mono, dashed rule. Logging it "inks" it in.
3. **Stamps for state.** Anything you should notice (on track, tight, over, reached) is a rotated rubber stamp, not a coloured banner.
4. **One slab per screen.** Only the primary surface gets `border-3` and a hard offset shadow (`<Card shadow="ink">`). Everything else is a `border-2` ruled surface with `divide-rule` rows.
5. **Colour identifies, it doesn't decorate.** Category colour appears as a 12px chip, never as a full tile background in lists.

## Tokens (`tailwind.config.js`)

| Token | Value | Role |
|---|---|---|
| `canvas` | `#EEEBE1` | page ground |
| `paper` | `#FFFFFF` | ledger and card surfaces |
| `ink` | `#15130F` | text, borders, hard shadows |
| `volt` | `#FF7A00` | primary action, "Can I afford" bar, current month in charts |
| `cash` | `#00804A` | positive, under budget, reached (AA on white) |
| `alert` | `#D11F24` | over budget, overdrawn, destructive (AA on white) |
| `stamp` | `#2B3A8C` | neutral stamp ink ("Tight", "Close") |
| `pencil` | `#6B675E` | pencilled drafts |
| `rule` | `#D9D4C5` | ledger row hairlines |

Secondary text is `text-ink/60` (≥4.5:1 on paper and canvas). Don't go lighter for text.

## Type

- **Archivo** (variable, `wdth` 62–125) for everything in words. Headings and headline totals use the wide cut: `.font-wide` (125%) for page titles, `.font-semiwide` (112%) for section headings and big numbers.
- **Spline Sans Mono** for figures in ledgers, amount inputs and chart axes only, so columns align like a real passbook. Never for prose.
- Scale: page title 26px/800, headline total 44px/800 (36px under 380px), section 18px/800, body 15–16px/500–700, meta 12–14px.

## Components (`src/components/ui.tsx`)

- `PageHeader`: back button (optional), wide title, sub line, action slot. Every screen uses it.
- `Ledger` + `LedgerRow`: day · entry · debit · balance grid. `pencil` renders a draft row, `muted` renders brought-forward rows, `showBalance={false}` for cross-month search results.
- `Stamp`: `tone` blue/red/green. Lands with the `stamp-in` animation.
- `Card`: `shadow="ink" | "alert"` for the slab, default is a plain ruled surface.
- `Button`: primary (volt), secondary (paper), ghost, danger. All ≥44px tall except `size="sm"` (36px, used next to headings).
- `Segmented`: sibling views (Passbook / Insights, Sign in / Create account).
- `IconButton`, `ConfirmDeleteButton`: 36px visual boxes; the `.hit` utility extends the touch target to ~48px.

## Motion

Two authored moments, both ≤320ms and disabled under `prefers-reduced-motion`:
- `animate-pencil-in`: a pencilled row writes itself in left to right (clip-path).
- `animate-stamp-in`: a stamp lands slightly large, then presses flat.

Buttons press (shadow collapses, 2px shift). Nothing else animates.

## Navigation

Home · Plan · **+** · History · More. Each tab owns its sub-pages so the bar keeps its place: Plan → Afford, Budgets, Recurring; History → Passbook, Insights; More → Shopping list.

## Copy

Plain, from the user's side, in the passbook's vocabulary where it helps ("Write it in", "Pencilled in", "Rub out", "Brought forward"). Currency is JD with two decimals. Controls name their action; errors say what to type.
