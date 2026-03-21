export interface IncomeData {
  esposende: number;
  felgueiras: number;
  fradelos: number;
  docbay: number;
  receita: number;
}

export interface ExpenseData {
  prestacao: number;
  condObras: number;
  agua: number;
  luz: number;
  internet: number;
  gasoleo: number;
  alimentacao: number;
  mecanico: number;
  netflix: number;
  telefone: number;
  gymNutri: number;
  saidas: number;
  outros: number;
}

export interface SavingsAllocation {
  contas: number;
  ferias: number;
  t1Felgueiras: number;
  t1Esposende: number;
  t1Fradelos: number;
  casamento: number;
  stockMarket: number;
  ouro: number;
}

export interface CustomItem {
  id: string;
  name: string;
  amount: number;
}

export interface MonthEntry {
  id: string;
  year: number;
  month: number;
  confirmed: boolean;
  income: IncomeData;
  customIncome: CustomItem[];       // dynamic user-added income lines
  expenses: ExpenseData;
  gastosExOverride: number | null; // if set, gastosEx = this value; saldo = gastosEx - gastosR
  customExpenses: CustomItem[];     // dynamic user-added expense lines
  customInvestments: CustomItem[];  // dynamic user-added investment lines
  savings: SavingsAllocation;
  hiddenFields: string[];           // tracks which fixed field keys are hidden/zeroed per month
  notes: Record<string, string>;
}

export interface YearConfig {
  year: number;
  initialBalance: number;
}

export interface AppState {
  months: MonthEntry[];
  yearConfigs: YearConfig[];
}

export interface MonthCalculations {
  cashIn: number;
  gastosR: number;      // sum of fixed expense categories + customExpenses
  gastosEx: number;     // gastosExOverride ?? gastosR
  saldo: number;        // gastosEx - gastosR
  savingsTotal: number; // fixed savings + customInvestments
  cashOut: number;      // gastosEx + savingsTotal
  guardado: number;     // cashIn - gastosEx
  savingsPct: number;
  netBankChange: number;
}

export interface MonthWithCalc extends MonthEntry {
  calc: MonthCalculations;
  ano: number;
  totalBalance: number;
}

export const INCOME_LABELS: Record<keyof IncomeData, string> = {
  esposende: 'Esposende',
  felgueiras: 'Felgueiras',
  fradelos: 'Fradelos',
  docbay: 'DocBay',
  receita: 'Salary',
};

export const EXPENSE_LABELS: Record<keyof ExpenseData, string> = {
  prestacao: 'Mortgage',
  condObras: 'Condo / Works',
  agua: 'Water',
  luz: 'Electricity',
  internet: 'Internet',
  gasoleo: 'Diesel',
  alimentacao: 'Food',
  mecanico: 'Mechanic',
  netflix: 'Netflix',
  telefone: 'Phone',
  gymNutri: 'Gym / Nutrition',
  saidas: 'Going Out',
  outros: 'Other',
};

export const SAVINGS_LABELS: Record<keyof SavingsAllocation, string> = {
  contas: 'Savings Acc.',
  ferias: 'Holidays',
  t1Felgueiras: 'T1 Felgueiras',
  t1Esposende: 'T1 Esposende',
  t1Fradelos: 'T1 Fradelos',
  casamento: 'Wedding',
  stockMarket: 'Stock Market',
  ouro: 'Gold',
};

export const MONTH_NAMES_PT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export const MONTH_NAMES_FULL_PT = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
