import type {
  MonthEntry,
  MonthCalculations,
  MonthWithCalc,
} from '../types';

export function sumObject(obj: Record<string, number>): number {
  return Object.values(obj).reduce((acc, v) => acc + (v || 0), 0);
}

export function calcMonth(entry: MonthEntry): MonthCalculations {
  const hidden = new Set(entry.hiddenFields || []);

  const customIncomeSum = (entry.customIncome || []).reduce((s, i) => s + i.amount, 0);
  const cashIn = Object.entries(entry.income).reduce(
    (s, [k, v]) => s + (hidden.has(k) ? 0 : (v as number || 0)), 0
  ) + customIncomeSum;
  const fixedExpenses = Object.entries(entry.expenses).reduce(
    (s, [k, v]) => s + (hidden.has(k) ? 0 : (v as number || 0)), 0
  );
  const customExpSum = (entry.customExpenses || []).reduce((s, i) => s + i.amount, 0);
  const gastosR = fixedExpenses + customExpSum;
  const gastosEx = entry.gastosExOverride != null ? entry.gastosExOverride : gastosR;
  const saldo = gastosEx - gastosR;
  const fixedSavings = Object.entries(entry.savings).reduce(
    (s, [k, v]) => s + (hidden.has(k) ? 0 : (v as number || 0)), 0
  );
  const customInvSum = (entry.customInvestments || []).reduce((s, i) => s + i.amount, 0);
  const savingsTotal = fixedSavings + customInvSum;
  const cashOut = gastosEx + savingsTotal;
  const guardado = cashIn - gastosEx;
  const savingsPct = cashIn > 0 ? (guardado / cashIn) * 100 : 0;
  const netBankChange = cashIn - cashOut;
  return { cashIn, gastosR, gastosEx, saldo, savingsTotal, cashOut, guardado, savingsPct, netBankChange };
}

export function calcYearMonths(
  months: MonthEntry[],
  initialBalance: number
): MonthWithCalc[] {
  const sorted = [...months].sort((a, b) => a.month - b.month);

  let runningAno = 0;
  let runningBalance = initialBalance;

  return sorted.map((entry) => {
    const calc = calcMonth(entry);
    runningAno += calc.guardado;
    runningBalance += calc.netBankChange;

    return {
      ...entry,
      calc,
      ano: runningAno,
      totalBalance: runningBalance,
    };
  });
}
