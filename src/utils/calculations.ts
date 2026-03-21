import type {
  MonthEntry,
  MonthCalculations,
  MonthWithCalc,
  IncomeData,
  ExpenseData,
  SavingsAllocation,
} from '../types';

export function sumObject(obj: Record<string, number>): number {
  return Object.values(obj).reduce((acc, v) => acc + (v || 0), 0);
}

export function calcMonth(entry: MonthEntry): MonthCalculations {
  const cashIn = sumObject(entry.income as unknown as Record<string, number>);
  const fixedExpenses = sumObject(entry.expenses as unknown as Record<string, number>);
  const customExpSum = (entry.customExpenses || []).reduce((s, i) => s + i.amount, 0);
  const gastosR = fixedExpenses + customExpSum;
  const gastosEx = entry.gastosExOverride != null ? entry.gastosExOverride : gastosR;
  const saldo = gastosEx - gastosR;
  const fixedSavings = sumObject(entry.savings as unknown as Record<string, number>);
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

export function sumIncome(income: IncomeData): number {
  return (
    income.esposende +
    income.felgueiras +
    income.fradelos +
    income.docbay +
    income.receita
  );
}

export function sumExpenses(expenses: ExpenseData): number {
  return (
    expenses.prestacao +
    expenses.condObras +
    expenses.agua +
    expenses.luz +
    expenses.internet +
    expenses.gasoleo +
    expenses.alimentacao +
    expenses.mecanico +
    expenses.netflix +
    expenses.telefone +
    expenses.gymNutri +
    expenses.saidas +
    expenses.outros
  );
}

export function sumSavings(savings: SavingsAllocation): number {
  return (
    savings.contas +
    savings.ferias +
    savings.t1Felgueiras +
    savings.t1Esposende +
    savings.t1Fradelos +
    savings.casamento +
    savings.stockMarket +
    savings.ouro
  );
}
