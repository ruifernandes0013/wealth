# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Vite, http://localhost:5173)
npm run build    # Type-check + production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Architecture

Single-page React + TypeScript app (Vite) with Tailwind CSS, React Router v6, and Recharts.

**State**: `src/context/DataContext.tsx` — React Context + `useReducer`. Persisted to `localStorage` under the key `wealth_data`. On first load (no localStorage), it seeds from `src/data/seed.ts`. The context exposes `state`, `dispatch`, and a `getYearEntries(year)` helper.

**Routing**: Three pages — `/` (Dashboard), `/monthly` (Monthly table), `/reports` (Reports). Layout with sticky navbar wraps all pages via React Router `Outlet`.

## Key Formulas (src/utils/calculations.ts)

All derived values come from `calcMonth()` and `calcYearMonths()`:

```
cashIn       = sum of all 5 income fields
gastosR      = sum of all 13 expense category fields
gastosEx     = gastosR + extraExpenses
savingsTotal = sum of all 8 savings allocation fields
cashOut      = gastosEx + savingsTotal
guardado     = cashIn - gastosEx          // monthly "saved" amount
savingsPct   = guardado / cashIn * 100
netBankChange= cashIn - cashOut           // = guardado - savingsTotal

// Running (cumulative) per year, sorted by month:
ano          = running sum of guardado
totalBalance = initialBalance + running sum of netBankChange
```

**Critical distinction**: `guardado` (ANO) counts savings allocations as "yours" (not spent). `totalBalance` (TOTAL) reflects the actual bank balance — lower because savings go out as `cashOut`.

## Data Types (src/types/index.ts)

- `MonthEntry`: id (`"2026-01"`), year, month (1–12), confirmed, income, expenses, extraExpenses, savings
- `YearConfig`: year + initialBalance (e.g. 461.78 for 2026)
- `AppData`: `{ entries: MonthEntry[], yearConfigs: YearConfig[] }`

Label maps (`INCOME_LABELS`, `EXPENSE_LABELS`, `SAVINGS_LABELS`) and Portuguese month names (`MONTHS_PT`) are exported from the types file.

## Conventions

- Currency formatted as `€ 1.234,56` via `formatCurrency()` in `src/utils/format.ts`
- Month names: Portuguese abbreviations — JAN, FEV, MAR, ABR, MAI, JUN, JUL, AGO, SET, OUT, NOV, DEZ
- Color scheme: emerald = income/positive, red = expenses, violet = savings, blue = balance
