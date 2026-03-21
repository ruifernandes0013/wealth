import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import type { MonthEntry, YearConfig, AppState } from '../types';
import { seedMonths2026, seedYearConfigs } from '../data/seed';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'UPDATE_MONTH'; payload: MonthEntry }
  | { type: 'UPDATE_YEAR_CONFIG'; payload: YearConfig };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'UPDATE_MONTH': {
      const exists = state.months.find(m => m.id === action.payload.id);
      const months = exists
        ? state.months.map(m => m.id === action.payload.id ? action.payload : m)
        : [...state.months, action.payload];
      return { ...state, months };
    }
    case 'UPDATE_YEAR_CONFIG': {
      const exists = state.yearConfigs.find(c => c.year === action.payload.year);
      const yearConfigs = exists
        ? state.yearConfigs.map(c => c.year === action.payload.year ? action.payload : c)
        : [...state.yearConfigs, action.payload];
      return { ...state, yearConfigs };
    }
    default:
      return state;
  }
}

interface DataContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loading: boolean;
  updateMonth: (month: MonthEntry) => Promise<void>;
  updateYearConfig: (config: YearConfig) => Promise<void>;
  getMonthsForYear: (year: number) => MonthEntry[];
  getYearConfig: (year: number) => YearConfig;
  getAvailableYears: () => number[];
}

const DataContext = createContext<DataContextValue | null>(null);

// Map DB row → MonthEntry
function rowToMonth(row: Record<string, unknown>): MonthEntry {
  return {
    id: row.id as string,
    year: row.year as number,
    month: row.month as number,
    confirmed: row.confirmed as boolean,
    income: row.income as MonthEntry['income'],
    expenses: row.expenses as MonthEntry['expenses'],
    gastosExOverride: row.gastos_ex_override as number | null,
    savings: row.savings as MonthEntry['savings'],
    customExpenses: (row.custom_expenses as MonthEntry['customExpenses']) || [],
    customInvestments: (row.custom_investments as MonthEntry['customInvestments']) || [],
    hiddenFields: (row.hidden_fields as string[]) || [],
  };
}

// Map MonthEntry → DB row
function monthToRow(month: MonthEntry, userId: string) {
  return {
    id: month.id,
    user_id: userId,
    year: month.year,
    month: month.month,
    confirmed: month.confirmed,
    income: month.income,
    expenses: month.expenses,
    gastos_ex_override: month.gastosExOverride,
    savings: month.savings,
    custom_expenses: month.customExpenses,
    custom_investments: month.customInvestments,
    hidden_fields: month.hiddenFields || [],
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { months: [], yearConfigs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [monthsRes, configsRes] = await Promise.all([
        supabase.from('months').select('*').eq('user_id', user!.id),
        supabase.from('year_configs').select('*').eq('user_id', user!.id),
      ]);

      if (cancelled) return;

      const months: MonthEntry[] = (monthsRes.data || []).map(rowToMonth);
      const yearConfigs: YearConfig[] = (configsRes.data || []).map(r => ({
        year: r.year,
        initialBalance: r.initial_balance,
      }));

      // If no data exists, seed it
      if (months.length === 0) {
        const seedRows = seedMonths2026.map(m => monthToRow(m, user!.id));
        const configRows = seedYearConfigs.map(c => ({
          user_id: user!.id,
          year: c.year,
          initial_balance: c.initialBalance,
        }));
        await Promise.all([
          supabase.from('months').insert(seedRows),
          supabase.from('year_configs').insert(configRows),
        ]);
        dispatch({ type: 'SET_STATE', payload: { months: seedMonths2026, yearConfigs: seedYearConfigs } });
      } else {
        dispatch({ type: 'SET_STATE', payload: { months, yearConfigs } });
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const updateMonth = async (month: MonthEntry) => {
    if (!user) return;
    dispatch({ type: 'UPDATE_MONTH', payload: month });
    await supabase.from('months').upsert(monthToRow(month, user.id));
  };

  const updateYearConfig = async (config: YearConfig) => {
    if (!user) return;
    dispatch({ type: 'UPDATE_YEAR_CONFIG', payload: config });
    await supabase.from('year_configs').upsert({
      user_id: user.id,
      year: config.year,
      initial_balance: config.initialBalance,
    }, { onConflict: 'user_id,year' });
  };

  const getMonthsForYear = (year: number) => state.months.filter(m => m.year === year);

  const getYearConfig = (year: number): YearConfig =>
    state.yearConfigs.find(c => c.year === year) ?? { year, initialBalance: 0 };

  const getAvailableYears = (): number[] => {
    const years = new Set<number>();
    state.months.forEach(m => years.add(m.year));
    state.yearConfigs.forEach(c => years.add(c.year));
    return Array.from(years).sort((a, b) => b - a);
  };

  return (
    <DataContext.Provider value={{ state, dispatch, loading, updateMonth, updateYearConfig, getMonthsForYear, getYearConfig, getAvailableYears }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
