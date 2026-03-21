import type { MonthMeta, LineItem, YearConfig } from '../types';

// ── Seed month metas ─────────────────────────────────────────────────────────

export const seedMonths: MonthMeta[] = [
  { id: '2026-01', year: 2026, month: 1,  confirmed: true,  gastosExOverride: null },
  { id: '2026-02', year: 2026, month: 2,  confirmed: true,  gastosExOverride: null },
  { id: '2026-03', year: 2026, month: 3,  confirmed: false, gastosExOverride: 3100.00 },
  { id: '2026-04', year: 2026, month: 4,  confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-05', year: 2026, month: 5,  confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-06', year: 2026, month: 6,  confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-07', year: 2026, month: 7,  confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-08', year: 2026, month: 8,  confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-09', year: 2026, month: 9,  confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-10', year: 2026, month: 10, confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-11', year: 2026, month: 11, confirmed: false, gastosExOverride: 2400.00 },
  { id: '2026-12', year: 2026, month: 12, confirmed: false, gastosExOverride: 2400.00 },
];

// ── Income seed rows ─────────────────────────────────────────────────────────

const incomeNames = ['Esposende', 'Felgueiras', 'Fradelos', 'DocBay', 'Salary'];

// JAN values
const janIncome: Record<string, number> = {
  Esposende: 0, Felgueiras: 680, Fradelos: 600, DocBay: 1100, Salary: 4256.39,
};
// FEB values
const febIncome: Record<string, number> = {
  Esposende: 872.70, Felgueiras: 680, Fradelos: 600, DocBay: 1100, Salary: 4246.40,
};
// MAR values
const marIncome: Record<string, number> = {
  Esposende: 1239.57, Felgueiras: 680, Fradelos: 600, DocBay: 1100, Salary: 4246.39,
};
// APR-DEC projection values
const projIncome: Record<string, number> = {
  Esposende: 800, Felgueiras: 680, Fradelos: 600, DocBay: 1100, Salary: 4400,
};

function makeIncomeRows(year: number, month: number, values: Record<string, number>): Omit<LineItem, 'id'>[] {
  return incomeNames.map((name, idx) => ({
    year, month, name, amount: values[name] ?? 0, sortOrder: idx,
  }));
}

export const seedIncome: Omit<LineItem, 'id'>[] = [
  ...makeIncomeRows(2026, 1, janIncome),
  ...makeIncomeRows(2026, 2, febIncome),
  ...makeIncomeRows(2026, 3, marIncome),
  ...[4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap(m => makeIncomeRows(2026, m, projIncome)),
];

// ── Expense seed rows ────────────────────────────────────────────────────────

const expenseNames = [
  'Mortgage', 'Condo/Works', 'Water', 'Electricity', 'Internet',
  'Diesel', 'Food', 'Mechanic', 'Netflix', 'Phone', 'Gym/Nutrition',
  'Going Out', 'Other',
];

const janExpenses: Record<string, number> = {
  Mortgage: 1375.83, 'Condo/Works': 0, Water: 37.26, Electricity: 29.02, Internet: 25,
  Diesel: 293.06, Food: 542.68, Mechanic: 0, Netflix: 12.99, Phone: 0,
  'Gym/Nutrition': 34.90, 'Going Out': 189.90, Other: 223.92,
};
const febExpenses: Record<string, number> = {
  Mortgage: 1375.83, 'Condo/Works': 0, Water: 16.47, Electricity: 33.62, Internet: 25.58,
  Diesel: 278.94, Food: 600.11, Mechanic: 0, Netflix: 12.99, Phone: 13,
  'Gym/Nutrition': 91.80, 'Going Out': 161.58, Other: 654.67,
};
const marExpenses: Record<string, number> = {
  Mortgage: 1367.97, 'Condo/Works': 0, Water: 20, Electricity: 47.17, Internet: 25,
  Diesel: 223.17, Food: 518.20, Mechanic: 269.93, Netflix: 17.98, Phone: 0,
  'Gym/Nutrition': 91.80, 'Going Out': 282.77, Other: 203.94,
};
const projExpenses: Record<string, number> = {
  Mortgage: 1367.97, 'Condo/Works': 0, Water: 20, Electricity: 30, Internet: 25,
  Diesel: 0, Food: 500, Mechanic: 0, Netflix: 0, Phone: 0,
  'Gym/Nutrition': 25.90, 'Going Out': 0, Other: 0,
};

function makeExpenseRows(year: number, month: number, values: Record<string, number>): Omit<LineItem, 'id'>[] {
  return expenseNames.map((name, idx) => ({
    year, month, name, amount: values[name] ?? 0, sortOrder: idx,
  }));
}

export const seedExpenses: Omit<LineItem, 'id'>[] = [
  ...makeExpenseRows(2026, 1, janExpenses),
  ...makeExpenseRows(2026, 2, febExpenses),
  ...makeExpenseRows(2026, 3, marExpenses),
  ...[4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap(m => makeExpenseRows(2026, m, projExpenses)),
];

// ── Investment seed rows ─────────────────────────────────────────────────────

const investmentNames = [
  'Savings Acc.', 'Holidays', 'T1 Felgueiras', 'T1 Esposende',
  'T1 Fradelos', 'Wedding', 'Stock Market', 'Gold',
];

const janInvestments: Record<string, number> = {
  'Savings Acc.': 11.33, Holidays: 179.85, 'T1 Felgueiras': 605.74, 'T1 Esposende': 31.98,
  'T1 Fradelos': 0, Wedding: 250, 'Stock Market': 10, Gold: 240,
};
const febInvestments: Record<string, number> = {
  'Savings Acc.': 11.33, Holidays: 155.12, 'T1 Felgueiras': 0, 'T1 Esposende': 492.65,
  'T1 Fradelos': 0, Wedding: 1156.01, 'Stock Market': 0, Gold: 0,
};
const marInvestments: Record<string, number> = {
  'Savings Acc.': 11.33, Holidays: 1449.26, 'T1 Felgueiras': 0, 'T1 Esposende': 672.75,
  'T1 Fradelos': 0, Wedding: 1287.21, 'Stock Market': 0, Gold: 0,
};
const projInvestments: Record<string, number> = {
  'Savings Acc.': 0, Holidays: 0, 'T1 Felgueiras': 0, 'T1 Esposende': 0,
  'T1 Fradelos': 0, Wedding: 0, 'Stock Market': 0, Gold: 0,
};

function makeInvestmentRows(year: number, month: number, values: Record<string, number>): Omit<LineItem, 'id'>[] {
  return investmentNames.map((name, idx) => ({
    year, month, name, amount: values[name] ?? 0, sortOrder: idx,
  }));
}

export const seedInvestments: Omit<LineItem, 'id'>[] = [
  ...makeInvestmentRows(2026, 1, janInvestments),
  ...makeInvestmentRows(2026, 2, febInvestments),
  ...makeInvestmentRows(2026, 3, marInvestments),
  ...[4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap(m => makeInvestmentRows(2026, m, projInvestments)),
];

// ── Year configs ─────────────────────────────────────────────────────────────

export const seedYearConfigs: YearConfig[] = [
  { year: 2026, initialBalance: 461.78 },
];
