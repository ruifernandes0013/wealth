import type { MonthMeta, MonthWithCalc, MonthCalculations, LineItem } from '../types';

export function calcMonthFromItems(
  meta: MonthMeta,
  incomeItems: LineItem[],
  expenseItems: LineItem[],
  investmentItems: LineItem[],
  savingsItems: LineItem[]
): MonthCalculations {
  const cashIn = incomeItems.reduce((s, i) => s + i.amount, 0);
  const gastosR = expenseItems.reduce((s, e) => s + e.amount, 0);
  const gastosEx = meta.gastosExOverride != null ? meta.gastosExOverride : gastosR;
  const saldo = gastosEx - gastosR;
  const savingsTotal = investmentItems.reduce((s, i) => s + i.amount, 0);
  const savingsDeposits = savingsItems.reduce((s, i) => s + i.amount, 0);
  const cashOut = gastosEx;
  const guardado = cashIn - gastosEx;
  const savingsPct = cashIn > 0 ? (guardado / cashIn) * 100 : 0;
  const netBankChange = cashIn - cashOut;
  return { cashIn, gastosR, gastosEx, saldo, savingsTotal, savingsDeposits, cashOut, guardado, savingsPct, netBankChange };
}

export function calcYearMonths(
  months: MonthMeta[],
  income: LineItem[],
  expenses: LineItem[],
  investments: LineItem[],
  savings: LineItem[],
  initialBalance: number,
  allSavings: LineItem[] = []
): MonthWithCalc[] {
  const sorted = [...months].sort((a, b) => a.month - b.month);
  let runningAno = 0;
  let runningBalance = initialBalance;
  // Running savings balance includes all deposits across all years up to start of this year
  const year = sorted[0]?.year;
  let runningSavingsBalance = year
    ? allSavings.filter(i => i.year < year).reduce((s, i) => s + i.amount, 0)
    : 0;
  return sorted.map(meta => {
    const incomeItems = income.filter(i => i.year === meta.year && i.month === meta.month);
    const expenseItems = expenses.filter(e => e.year === meta.year && e.month === meta.month);
    const investmentItems = investments.filter(i => i.year === meta.year && i.month === meta.month);
    const savingsItems = savings.filter(i => i.year === meta.year && i.month === meta.month);
    const calc = calcMonthFromItems(meta, incomeItems, expenseItems, investmentItems, savingsItems);
    runningAno += calc.guardado;
    runningBalance += calc.netBankChange;
    runningSavingsBalance += calc.savingsDeposits;
    return { ...meta, calc, incomeItems, expenseItems, investmentItems, savingsItems, ano: runningAno, totalBalance: runningBalance, totalSavingsBalance: runningSavingsBalance };
  });
}
