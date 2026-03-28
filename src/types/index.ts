export interface LineItem {
  id: string;
  year: number;
  month: number;
  name: string;
  amount: number;
  note?: string;
  sortOrder?: number;
}

export interface MonthMeta {
  id: string;
  year: number;
  month: number;
  confirmed: boolean;
  gastosExOverride: number | null;
}

export interface YearConfig {
  year: number;
  initialBalance: number;
}

export interface AppState {
  months: MonthMeta[];
  income: LineItem[];
  expenses: LineItem[];
  investments: LineItem[];
  savings: LineItem[];
  yearConfigs: YearConfig[];
}

export interface MonthCalculations {
  cashIn: number;
  gastosR: number;
  gastosEx: number;
  saldo: number;
  savingsTotal: number;
  savingsDeposits: number;
  cashOut: number;
  guardado: number;
  savingsPct: number;
  netBankChange: number;
}

export interface MonthWithCalc extends MonthMeta {
  calc: MonthCalculations;
  incomeItems: LineItem[];
  expenseItems: LineItem[];
  investmentItems: LineItem[];
  savingsItems: LineItem[];
  ano: number;
  totalBalance: number;
  totalSavingsBalance: number;
}

export const MONTH_NAMES_PT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export const MONTH_NAMES_FULL_PT = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
