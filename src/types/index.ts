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
  expenses: ExpenseData;
  gastosExOverride: number | null; // if set, gastosEx = this value; saldo = gastosEx - gastosR
  customExpenses: CustomItem[];     // dynamic user-added expense lines
  customInvestments: CustomItem[];  // dynamic user-added investment lines
  savings: SavingsAllocation;
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
  receita: 'Receita',
};

export const EXPENSE_LABELS: Record<keyof ExpenseData, string> = {
  prestacao: 'Prestação',
  condObras: 'Cond/Obras',
  agua: 'Água',
  luz: 'Luz',
  internet: 'Internet',
  gasoleo: 'Gasóleo',
  alimentacao: 'Alimentação',
  mecanico: 'Mecânico',
  netflix: 'Netflix',
  telefone: 'Telefone',
  gymNutri: 'Gym/Nutri',
  saidas: 'Saídas',
  outros: 'Outros',
};

export const SAVINGS_LABELS: Record<keyof SavingsAllocation, string> = {
  contas: 'Contas',
  ferias: 'Férias',
  t1Felgueiras: 'T1 Felgueiras',
  t1Esposende: 'T1 Esposende',
  t1Fradelos: 'T1 Fradelos',
  casamento: 'Casamento',
  stockMarket: 'Stock Market',
  ouro: 'Ouro',
};

export const MONTH_NAMES_PT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
];

export const MONTH_NAMES_FULL_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
