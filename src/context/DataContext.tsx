import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import type { MonthMeta, LineItem, YearConfig, AppState } from '../types';
import { seedMonths, seedIncome, seedExpenses, seedInvestments, seedYearConfigs } from '../data/seed';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'UPDATE_MONTH_META'; payload: MonthMeta }
  | { type: 'UPSERT_LINE_ITEM'; table: 'income' | 'expenses' | 'investments'; payload: LineItem }
  | { type: 'DELETE_LINE_ITEM'; table: 'income' | 'expenses' | 'investments'; id: string }
  | { type: 'UPDATE_YEAR_CONFIG'; payload: YearConfig };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'UPDATE_MONTH_META': {
      const exists = state.months.find(m => m.id === action.payload.id);
      const months = exists
        ? state.months.map(m => m.id === action.payload.id ? action.payload : m)
        : [...state.months, action.payload];
      return { ...state, months };
    }
    case 'UPSERT_LINE_ITEM': {
      const tbl = action.table;
      const existing = state[tbl].find(i => i.id === action.payload.id);
      const updated = existing
        ? state[tbl].map(i => i.id === action.payload.id ? action.payload : i)
        : [...state[tbl], action.payload];
      return { ...state, [tbl]: updated };
    }
    case 'DELETE_LINE_ITEM': {
      const tbl = action.table;
      return { ...state, [tbl]: state[tbl].filter(i => i.id !== action.id) };
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

// Map DB row → LineItem
function rowToLineItem(row: Record<string, unknown>): LineItem {
  return {
    id: row.id as string,
    year: row.year as number,
    month: row.month as number,
    name: row.name as string,
    amount: Number(row.amount),
    note: row.note ? (row.note as string) : undefined,
    sortOrder: row.sort_order ? (row.sort_order as number) : 0,
  };
}

// Map DB row → MonthMeta
function rowToMonthMeta(row: Record<string, unknown>): MonthMeta {
  return {
    id: row.id as string,
    year: row.year as number,
    month: row.month as number,
    confirmed: row.confirmed as boolean,
    gastosExOverride: row.gastos_ex_override as number | null,
  };
}

interface DataContextValue {
  state: AppState;
  loading: boolean;
  updateMonthMeta: (meta: MonthMeta) => Promise<void>;
  upsertLineItem: (table: 'income' | 'expenses' | 'investments', item: LineItem) => Promise<void>;
  deleteLineItem: (table: 'income' | 'expenses' | 'investments', id: string) => Promise<void>;
  addLineItem: (table: 'income' | 'expenses' | 'investments', year: number, month: number, name: string) => Promise<void>;
  updateYearConfig: (config: YearConfig) => Promise<void>;
  getMonthsForYear: (year: number) => MonthMeta[];
  getYearConfig: (year: number) => YearConfig;
  getAvailableYears: () => number[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    months: [], income: [], expenses: [], investments: [], yearConfigs: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [monthsRes, configsRes, incomeRes, expensesRes, investmentsRes] = await Promise.all([
        supabase.from('months').select('*').eq('user_id', user!.id),
        supabase.from('year_configs').select('*').eq('user_id', user!.id),
        supabase.from('income').select('*').eq('user_id', user!.id),
        supabase.from('expenses').select('*').eq('user_id', user!.id),
        supabase.from('investments').select('*').eq('user_id', user!.id),
      ]);

      if (cancelled) return;

      if (monthsRes.error) console.error('[load] months error:', monthsRes.error);
      if (configsRes.error) console.error('[load] year_configs error:', configsRes.error);
      if (incomeRes.error) console.error('[load] income error:', incomeRes.error);
      if (expensesRes.error) console.error('[load] expenses error:', expensesRes.error);
      if (investmentsRes.error) console.error('[load] investments error:', investmentsRes.error);

      const months: MonthMeta[] = (monthsRes.data || []).map(rowToMonthMeta);
      const yearConfigs: YearConfig[] = (configsRes.data || []).map(r => ({
        year: r.year,
        initialBalance: r.initial_balance,
      }));
      const income: LineItem[] = (incomeRes.data || []).map(rowToLineItem);
      const expenses: LineItem[] = (expensesRes.data || []).map(rowToLineItem);
      const investments: LineItem[] = (investmentsRes.data || []).map(rowToLineItem);

      // If no data exists, seed it
      if (months.length === 0) {
        const monthRows = seedMonths.map(m => ({
          id: m.id,
          user_id: user!.id,
          year: m.year,
          month: m.month,
          confirmed: m.confirmed,
          gastos_ex_override: m.gastosExOverride,
        }));
        const configRows = seedYearConfigs.map(c => ({
          user_id: user!.id,
          year: c.year,
          initial_balance: c.initialBalance,
        }));
        const incomeRows = seedIncome.map(i => ({ ...i, user_id: user!.id }));
        const expenseRows = seedExpenses.map(e => ({ ...e, user_id: user!.id }));
        const investmentRows = seedInvestments.map(i => ({ ...i, user_id: user!.id }));

        const [mRes, cRes, iRes, eRes, invRes] = await Promise.all([
          supabase.from('months').insert(monthRows),
          supabase.from('year_configs').insert(configRows),
          supabase.from('income').insert(incomeRows),
          supabase.from('expenses').insert(expenseRows),
          supabase.from('investments').insert(investmentRows),
        ]);
        if (mRes.error) console.error('[seed] months error:', mRes.error);
        if (cRes.error) console.error('[seed] year_configs error:', cRes.error);
        if (iRes.error) console.error('[seed] income error:', iRes.error);
        if (eRes.error) console.error('[seed] expenses error:', eRes.error);
        if (invRes.error) console.error('[seed] investments error:', invRes.error);

        // Re-fetch after seeding to get server-generated IDs
        const [iRes2, eRes2, invRes2] = await Promise.all([
          supabase.from('income').select('*').eq('user_id', user!.id),
          supabase.from('expenses').select('*').eq('user_id', user!.id),
          supabase.from('investments').select('*').eq('user_id', user!.id),
        ]);
        dispatch({
          type: 'SET_STATE',
          payload: {
            months: seedMonths,
            yearConfigs: seedYearConfigs,
            income: (iRes2.data || []).map(rowToLineItem),
            expenses: (eRes2.data || []).map(rowToLineItem),
            investments: (invRes2.data || []).map(rowToLineItem),
          },
        });
      } else {
        dispatch({ type: 'SET_STATE', payload: { months, yearConfigs, income, expenses, investments } });
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const updateMonthMeta = async (meta: MonthMeta) => {
    if (!user) return;
    dispatch({ type: 'UPDATE_MONTH_META', payload: meta });
    const { error } = await supabase.from('months').upsert({
      id: meta.id,
      user_id: user.id,
      year: meta.year,
      month: meta.month,
      confirmed: meta.confirmed,
      gastos_ex_override: meta.gastosExOverride,
    });
    if (error) console.error('[updateMonthMeta] Supabase error:', error.message, error.details);
  };

  const upsertLineItem = async (table: 'income' | 'expenses' | 'investments', item: LineItem) => {
    if (!user) return;
    dispatch({ type: 'UPSERT_LINE_ITEM', table, payload: item });
    const { error } = await supabase.from(table).upsert({
      id: item.id,
      user_id: user.id,
      year: item.year,
      month: item.month,
      name: item.name,
      amount: item.amount,
      note: item.note ?? null,
      sort_order: item.sortOrder ?? 0,
    }, { onConflict: 'id' });
    if (error) console.error(`[upsertLineItem:${table}] Supabase error:`, error.message, error.details);
  };

  const deleteLineItem = async (table: 'income' | 'expenses' | 'investments', id: string) => {
    if (!user) return;
    dispatch({ type: 'DELETE_LINE_ITEM', table, id });
    const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
    if (error) console.error(`[deleteLineItem:${table}] Supabase error:`, error.message, error.details);
  };

  const addLineItem = async (
    table: 'income' | 'expenses' | 'investments',
    year: number,
    month: number,
    name: string
  ) => {
    if (!user) return;
    // Insert for all 12 months of the year
    const monthMetas = state.months.filter(m => m.year === year);
    const rows = monthMetas.map(m => ({
      user_id: user.id,
      year: m.year,
      month: m.month,
      name,
      amount: 0,
      sort_order: 99,
    }));
    if (rows.length === 0) return;
    const { data, error } = await supabase.from(table).upsert(rows, { onConflict: 'user_id,year,month,name' }).select('*');
    if (error) {
      console.error(`[addLineItem:${table}] Supabase error:`, error.message, error.details);
      return;
    }
    (data || []).forEach(row => {
      dispatch({ type: 'UPSERT_LINE_ITEM', table, payload: rowToLineItem(row) });
    });
  };

  const updateYearConfig = async (config: YearConfig) => {
    if (!user) return;
    dispatch({ type: 'UPDATE_YEAR_CONFIG', payload: config });
    const { error } = await supabase.from('year_configs').upsert({
      user_id: user.id,
      year: config.year,
      initial_balance: config.initialBalance,
    }, { onConflict: 'user_id,year' });
    if (error) console.error('[updateYearConfig] Supabase error:', error.message, error.details);
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
    <DataContext.Provider value={{
      state, loading,
      updateMonthMeta, upsertLineItem, deleteLineItem, addLineItem,
      updateYearConfig, getMonthsForYear, getYearConfig, getAvailableYears,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
