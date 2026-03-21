import type { MonthMeta, MonthWithCalc, MonthCalculations, LineItem } from '../types';

export function calcMonthFromItems(
  meta: MonthMeta,
  incomeItems: LineItem[],
  expenseItems: LineItem[],
  investmentItems: LineItem[]
): MonthCalculations {
  const cashIn = incomeItems.reduce((s, i) => s + i.amount, 0);
  const gastosR = expenseItems.reduce((s, e) => s + e.amount, 0);
  const gastosEx = meta.gastosExOverride != null ? meta.gastosExOverride : gastosR;
  const saldo = gastosEx - gastosR;
  const savingsTotal = investmentItems.reduce((s, i) => s + i.amount, 0);
  const cashOut = gastosEx + savingsTotal;
  const guardado = cashIn - gastosEx;
  const savingsPct = cashIn > 0 ? (guardado / cashIn) * 100 : 0;
  const netBankChange = cashIn - cashOut;
  return { cashIn, gastosR, gastosEx, saldo, savingsTotal, cashOut, guardado, savingsPct, netBankChange };
}

export function calcYearMonths(
  months: MonthMeta[],
  income: LineItem[],
  expenses: LineItem[],
  investments: LineItem[],
  initialBalance: number
): MonthWithCalc[] {
  const sorted = [...months].sort((a, b) => a.month - b.month);
  let runningAno = 0;
  let runningBalance = initialBalance;
  return sorted.map(meta => {
    const incomeItems = income.filter(i => i.year === meta.year && i.month === meta.month);
    const expenseItems = expenses.filter(e => e.year === meta.year && e.month === meta.month);
    const investmentItems = investments.filter(i => i.year === meta.year && i.month === meta.month);
    const calc = calcMonthFromItems(meta, incomeItems, expenseItems, investmentItems);
    runningAno += calc.guardado;
    runningBalance += calc.netBankChange;
    return { ...meta, calc, incomeItems, expenseItems, investmentItems, ano: runningAno, totalBalance: runningBalance };
  });
}
