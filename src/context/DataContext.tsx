import React, { createContext, useContext, useReducer, useEffect, useState, useRef, ReactNode } from 'react';
import type { MonthMeta, LineItem, YearConfig, AppState } from '../types';
import { seedMonths, seedIncome, seedExpenses, seedInvestments, seedYearConfigs } from '../data/seed';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'SET_CORE'; payload: { months: MonthMeta[]; yearConfigs: YearConfig[] } }
  | { type: 'SET_YEAR_LINE_ITEMS'; payload: { income: LineItem[]; expenses: LineItem[]; investments: LineItem[]; savings: LineItem[] } }
  | { type: 'UPDATE_MONTH_META'; payload: MonthMeta }
  | { type: 'UPSERT_LINE_ITEM'; table: 'income' | 'expenses' | 'investments' | 'savings'; payload: LineItem }
  | { type: 'DELETE_LINE_ITEM'; table: 'income' | 'expenses' | 'investments' | 'savings'; id: string }
  | { type: 'UPDATE_YEAR_CONFIG'; payload: YearConfig }
  | { type: 'DELETE_YEAR'; year: number };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;
    case 'SET_CORE':
      return { ...state, months: action.payload.months, yearConfigs: action.payload.yearConfigs };
    case 'SET_YEAR_LINE_ITEMS':
      return { ...state, ...action.payload };
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
    case 'DELETE_YEAR': {
      return {
        ...state,
        months: state.months.filter(m => m.year !== action.year),
        income: state.income.filter(i => i.year !== action.year),
        expenses: state.expenses.filter(e => e.year !== action.year),
        investments: state.investments.filter(i => i.year !== action.year),
        savings: state.savings.filter(s => s.year !== action.year),
        yearConfigs: state.yearConfigs.filter(c => c.year !== action.year),
      };
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
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  updateMonthMeta: (meta: MonthMeta) => Promise<void>;
  upsertLineItem: (table: 'income' | 'expenses' | 'investments' | 'savings', item: LineItem) => Promise<void>;
  deleteLineItem: (table: 'income' | 'expenses' | 'investments' | 'savings', id: string) => Promise<void>;
  addLineItem: (table: 'income' | 'expenses' | 'investments' | 'savings', year: number, month: number, name: string) => Promise<void>;
  updateYearConfig: (config: YearConfig) => Promise<void>;
  addYear: (year: number) => Promise<void>;
  getMonthsForYear: (year: number) => MonthMeta[];
  getYearConfig: (year: number) => YearConfig;
  getAvailableYears: () => number[];
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (year: number) => Promise<void>;
  setSelectedMonth: (month: number) => Promise<void>;
  reload: () => void;
  pendingYear: number | null;
  setPendingYear: (year: number | null) => void;
  discardPendingYear: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    months: [], income: [], expenses: [], investments: [], savings: [], yearConfigs: [],
  });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey(k => k + 1);

  const [pendingYear, setPendingYearState] = useState<number | null>(null);
  const pendingYearRef = useRef<number | null>(null);
  const setPendingYear = (year: number | null) => {
    setPendingYearState(year);
    pendingYearRef.current = year;
  };

  const _today = new Date();
  const [selectedYear, setSelectedYearState] = useState(_today.getFullYear());
  const [selectedMonth, setSelectedMonthState] = useState(_today.getMonth() + 1);
  // Map of year → selected_month loaded from DB
  const yearPrefsRef = useRef<Map<number, number>>(new Map());
  const selectedYearRef = useRef(_today.getFullYear());
  const selectedMonthRef = useRef(_today.getMonth() + 1);

  // Undo/redo history
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  const historyRef = useRef<{ past: AppState[]; future: AppState[] }>({ past: [], future: [] });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  function pushHistory() {
    const snap: AppState = JSON.parse(JSON.stringify(stateRef.current));
    const h = historyRef.current;
    h.past.push(snap);
    if (h.past.length > 50) h.past.shift();
    h.future = [];
    setCanUndo(true);
    setCanRedo(false);
  }

  async function syncDiff(from: AppState, to: AppState) {
    const u = userRef.current;
    if (!u) return;
    const lineTables = ['income', 'expenses', 'investments', 'savings'] as const;
    for (const tbl of lineTables) {
      const fromItems = from[tbl];
      const toItems = to[tbl];
      const toUpsert = toItems.filter(item => {
        const f = fromItems.find(i => i.id === item.id);
        return !f || JSON.stringify(f) !== JSON.stringify(item);
      });
      const toDelete = fromItems.filter(item => !toItems.find(i => i.id === item.id));
      if (toUpsert.length) {
        await supabase.from(tbl).upsert(
          toUpsert.map(item => ({
            id: item.id, user_id: u.id, year: item.year, month: item.month,
            name: item.name, amount: item.amount, note: item.note ?? null, sort_order: item.sortOrder ?? 0,
          })),
          { onConflict: 'id' }
        );
      }
      for (const item of toDelete) {
        await supabase.from(tbl).delete().eq('id', item.id).eq('user_id', u.id);
      }
    }
    // months — only upsert changes, never delete
    const changedMonths = to.months.filter(m => {
      const f = from.months.find(x => x.id === m.id);
      return !f || JSON.stringify(f) !== JSON.stringify(m);
    });
    for (const m of changedMonths) {
      await supabase.from('months').upsert({
        id: m.id, user_id: u.id, year: m.year, month: m.month,
        confirmed: m.confirmed, gastos_ex_override: m.gastosExOverride,
      });
    }
    // yearConfigs
    const changedConfigs = to.yearConfigs.filter(c => {
      const f = from.yearConfigs.find(x => x.year === c.year);
      return !f || JSON.stringify(f) !== JSON.stringify(c);
    });
    for (const c of changedConfigs) {
      await supabase.from('year_configs').upsert(
        { user_id: u.id, year: c.year, initial_balance: c.initialBalance },
        { onConflict: 'user_id,year' }
      );
    }
  }

  const undo = async () => {
    const h = historyRef.current;
    if (h.past.length === 0) return;
    const prev = h.past.pop()!;
    const current: AppState = JSON.parse(JSON.stringify(stateRef.current));
    h.future.unshift(current);
    dispatch({ type: 'SET_STATE', payload: prev });
    setCanUndo(h.past.length > 0);
    setCanRedo(true);
    await syncDiff(current, prev);
  };

  const redo = async () => {
    const h = historyRef.current;
    if (h.future.length === 0) return;
    const next = h.future.shift()!;
    const current: AppState = JSON.parse(JSON.stringify(stateRef.current));
    h.past.push(current);
    dispatch({ type: 'SET_STATE', payload: next });
    setCanUndo(true);
    setCanRedo(h.future.length > 0);
    await syncDiff(current, next);
  };

  // Core load: months, year configs, prefs, and a slim (year, amount) scan used
  // only to know which years have any non-zero data (for the year selector).
  // The actual income/expenses/investments/savings rows are loaded per-year below.
  const [coreReady, setCoreReady] = useState(false);
  const [availableYearsState, setAvailableYearsState] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setCoreReady(false);
      return;
    }
    let cancelled = false;

    async function loadCore() {
      setLoading(true);
      setCoreReady(false);
      const [monthsRes, configsRes, prefsRes, yiRes, yeRes, yvRes, ysRes] = await Promise.all([
        supabase.from('months').select('*').eq('user_id', user!.id),
        supabase.from('year_configs').select('*').eq('user_id', user!.id),
        supabase.from('user_preferences').select('*').eq('user_id', user!.id),
        supabase.from('income').select('year, amount').eq('user_id', user!.id),
        supabase.from('expenses').select('year, amount').eq('user_id', user!.id),
        supabase.from('investments').select('year, amount').eq('user_id', user!.id),
        supabase.from('savings').select('year, amount').eq('user_id', user!.id),
      ]);

      if (cancelled) return;

      if (monthsRes.error) console.error('[load] months error:', monthsRes.error);
      if (configsRes.error) console.error('[load] year_configs error:', configsRes.error);

      const months: MonthMeta[] = (monthsRes.data || []).map(rowToMonthMeta);
      const yearConfigs: YearConfig[] = (configsRes.data || []).map(r => ({
        year: r.year,
        initialBalance: r.initial_balance,
      }));

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

        dispatch({ type: 'SET_CORE', payload: { months: seedMonths, yearConfigs: seedYearConfigs } });

        const seedYears = new Set<number>();
        [...seedIncome, ...seedExpenses, ...seedInvestments]
          .filter(i => i.amount !== 0)
          .forEach(i => seedYears.add(i.year));
        setAvailableYearsState(seedYears);
      } else {
        dispatch({ type: 'SET_CORE', payload: { months, yearConfigs } });

        if (yiRes.error) console.error('[load] income years error:', yiRes.error);
        if (yeRes.error) console.error('[load] expenses years error:', yeRes.error);
        if (yvRes.error) console.error('[load] investments years error:', yvRes.error);
        if (ysRes.error) console.error('[load] savings years error:', ysRes.error);
        const years = new Set<number>();
        [...(yiRes.data || []), ...(yeRes.data || []), ...(yvRes.data || []), ...(ysRes.data || [])]
          .filter(r => Number(r.amount) !== 0)
          .forEach(r => years.add(r.year as number));
        setAvailableYearsState(years);
      }

      if (prefsRes.data && prefsRes.data.length > 0) {
        const map = new Map<number, number>();
        for (const row of prefsRes.data) {
          map.set(row.year as number, row.selected_month as number);
        }
        yearPrefsRef.current = map;
        // Always default to current year, restore saved month for that year
        const y = _today.getFullYear();
        const m = map.get(y) ?? _today.getMonth() + 1;
        setSelectedYearState(y);
        selectedYearRef.current = y;
        setSelectedMonthState(m);
      }

      setLoading(false);
      setCoreReady(true);
    }

    loadCore();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, reloadKey]);

  // Tracks which year's data is currently reflected in state.income/etc, so the
  // availableYears sync effect below can ignore stale data while a fetch is in flight.
  const loadedYearRef = useRef<number | null>(null);

  // Per-year load: fetches income/expenses/investments/savings for the
  // currently selected year only. Always hits the network (no caching) and
  // re-runs whenever the selected year changes.
  useEffect(() => {
    if (!user || !coreReady) return;
    let cancelled = false;

    async function loadYearLineItems() {
      const year = selectedYear;
      const [incomeRes, expensesRes, investmentsRes, savingsRes] = await Promise.all([
        supabase.from('income').select('*').eq('user_id', user!.id).eq('year', year),
        supabase.from('expenses').select('*').eq('user_id', user!.id).eq('year', year),
        supabase.from('investments').select('*').eq('user_id', user!.id).eq('year', year),
        supabase.from('savings').select('*').eq('user_id', user!.id).eq('year', year),
      ]);

      if (cancelled) return;

      if (incomeRes.error) console.error('[loadYear] income error:', incomeRes.error);
      if (expensesRes.error) console.error('[loadYear] expenses error:', expensesRes.error);
      if (investmentsRes.error) console.error('[loadYear] investments error:', investmentsRes.error);
      if (savingsRes.error) console.error('[loadYear] savings error:', savingsRes.error);

      loadedYearRef.current = year;
      dispatch({
        type: 'SET_YEAR_LINE_ITEMS',
        payload: {
          income: (incomeRes.data || []).map(rowToLineItem),
          expenses: (expensesRes.data || []).map(rowToLineItem),
          investments: (investmentsRes.data || []).map(rowToLineItem),
          savings: (savingsRes.data || []).map(rowToLineItem),
        },
      });
    }

    loadYearLineItems();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedYear, coreReady, reloadKey]);

  // Reset undo/redo history on year change — snapshots are only valid within
  // the year they were taken for, since line-item state is now year-scoped.
  useEffect(() => {
    historyRef.current = { past: [], future: [] };
    setCanUndo(false);
    setCanRedo(false);
  }, [selectedYear]);

  // Keep the "years with data" set in sync with the currently loaded year,
  // without a network round-trip — other years' membership is untouched.
  // Skipped while a fetch for a different year is still in flight, so stale
  // (previous-year) data can't momentarily hide the year being switched to.
  useEffect(() => {
    if (loadedYearRef.current !== selectedYear) return;
    const hasData = [...state.income, ...state.expenses, ...state.investments, ...state.savings]
      .some(i => i.year === selectedYear && i.amount !== 0);
    setAvailableYearsState(prev => {
      const has = prev.has(selectedYear);
      if (hasData === has) return prev;
      const next = new Set(prev);
      if (hasData) next.add(selectedYear); else next.delete(selectedYear);
      return next;
    });
  }, [state.income, state.expenses, state.investments, state.savings, selectedYear]);

  const setSelectedYear = async (year: number) => {
    setSelectedYearState(year);
    selectedYearRef.current = year;
    // Restore saved month for this year, or fall back to current selectedMonth
    const savedMonth = yearPrefsRef.current.get(year);
    const restoredMonth = savedMonth ?? selectedMonthRef.current;
    setSelectedMonthState(restoredMonth);
    selectedMonthRef.current = restoredMonth;
    if (userRef.current) {
      await supabase.from('user_preferences').upsert(
        { user_id: userRef.current.id, year, selected_month: restoredMonth },
        { onConflict: 'user_id,year' }
      );
    }
  };

  const setSelectedMonth = async (month: number) => {
    setSelectedMonthState(month);
    selectedMonthRef.current = month;
    const year = selectedYearRef.current;
    yearPrefsRef.current.set(year, month);
    if (userRef.current) {
      await supabase.from('user_preferences').upsert(
        { user_id: userRef.current.id, year, selected_month: month },
        { onConflict: 'user_id,year' }
      );
    }
  };

  const updateMonthMeta = async (meta: MonthMeta) => {
    if (!user) return;
    pushHistory();
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

  const upsertLineItem = async (table: 'income' | 'expenses' | 'investments' | 'savings', item: LineItem) => {
    if (!user) return;
    pushHistory();
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
    if (pendingYearRef.current === item.year) setPendingYear(null);
  };

  const deleteLineItem = async (table: 'income' | 'expenses' | 'investments' | 'savings', id: string) => {
    if (!user) return;
    pushHistory();
    dispatch({ type: 'DELETE_LINE_ITEM', table, id });
    const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
    if (error) console.error(`[deleteLineItem:${table}] Supabase error:`, error.message, error.details);
  };

  const addLineItem = async (
    table: 'income' | 'expenses' | 'investments' | 'savings',
    year: number,
    month: number,
    name: string
  ) => {
    if (!user) return;
    pushHistory();
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

  const addYear = async (year: number) => {
    if (!user) return;
    const hasMonths = state.months.some(m => m.year === year);
    const hasLineItems = (['income', 'expenses', 'investments', 'savings'] as const).some(
      tbl => state[tbl].some(i => i.year === year)
    );
    if (hasMonths && hasLineItems) return;
    pushHistory();
    const newMonths: MonthMeta[] = Array.from({ length: 12 }, (_, i) => ({
      id: `${year}-${String(i + 1).padStart(2, '0')}`,
      year,
      month: i + 1,
      confirmed: false,
      gastosExOverride: null,
    }));
    if (!hasMonths) {
      const [mRes, cRes] = await Promise.all([
        supabase.from('months').upsert(
          newMonths.map(m => ({ id: m.id, user_id: user.id, year: m.year, month: m.month, confirmed: m.confirmed, gastos_ex_override: null })),
          { onConflict: 'id' }
        ),
        supabase.from('year_configs').upsert(
          { user_id: user.id, year, initial_balance: 0 },
          { onConflict: 'user_id,year' }
        ),
      ]);
      if (mRes.error) console.error('[addYear] months error:', mRes.error);
      if (cRes.error) console.error('[addYear] year_configs error:', cRes.error);
      newMonths.forEach(m => dispatch({ type: 'UPDATE_MONTH_META', payload: m }));
      dispatch({ type: 'UPDATE_YEAR_CONFIG', payload: { year, initialBalance: 0 } });
    }

    // Copy line item structure from nearest previous year (or any available year)
    const allYears = Array.from(new Set(stateRef.current.months.map(m => m.year))).sort((a, b) => b - a);
    const existingYears = allYears.filter(y => y !== year);
    const sourceYear = existingYears.find(y => y < year) ?? existingYears[0];
    if (sourceYear == null) return;
    const lineTables = ['income', 'expenses', 'investments', 'savings'] as const;
    for (const tbl of lineTables) {
      const sourceRes = await supabase.from(tbl).select('name').eq('user_id', user.id).eq('year', sourceYear);
      if (sourceRes.error) {
        console.error(`[addYear:${tbl}] source fetch error:`, sourceRes.error);
        continue;
      }
      const uniqueNames = [...new Set((sourceRes.data || []).map(i => i.name as string))];
      if (uniqueNames.length === 0) continue;
      const rows = newMonths.flatMap(m =>
        uniqueNames.map((name, idx) => ({
          user_id: user.id,
          year: m.year,
          month: m.month,
          name,
          amount: 0,
          sort_order: idx,
        }))
      );
      const { data, error } = await supabase.from(tbl).upsert(rows, { onConflict: 'user_id,year,month,name' }).select('*');
      if (error) {
        console.error(`[addYear:${tbl}] Supabase error:`, error.message, error.details);
        continue;
      }
      (data || []).forEach(row => {
        dispatch({ type: 'UPSERT_LINE_ITEM', table: tbl, payload: rowToLineItem(row) });
      });
    }
  };

  const discardPendingYear = async () => {
    const year = pendingYearRef.current;
    if (!year || !user) { setPendingYear(null); return; }
    await Promise.all([
      supabase.from('months').delete().eq('user_id', user.id).eq('year', year),
      supabase.from('income').delete().eq('user_id', user.id).eq('year', year),
      supabase.from('expenses').delete().eq('user_id', user.id).eq('year', year),
      supabase.from('investments').delete().eq('user_id', user.id).eq('year', year),
      supabase.from('savings').delete().eq('user_id', user.id).eq('year', year),
      supabase.from('year_configs').delete().eq('user_id', user.id).eq('year', year),
    ]);
    dispatch({ type: 'DELETE_YEAR', year });
    setPendingYear(null);
  };

  const updateYearConfig = async (config: YearConfig) => {
    if (!user) return;
    pushHistory();
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
    const years = new Set<number>(availableYearsState);
    if (pendingYearRef.current !== null) years.add(pendingYearRef.current);
    return Array.from(years).sort((a, b) => b - a);
  };

  return (
    <DataContext.Provider value={{
      state, loading,
      canUndo, canRedo, undo, redo,
      updateMonthMeta, upsertLineItem, deleteLineItem, addLineItem,
      updateYearConfig, addYear, getMonthsForYear, getYearConfig, getAvailableYears,
      selectedYear, selectedMonth, setSelectedYear, setSelectedMonth, reload,
      pendingYear, setPendingYear, discardPendingYear,
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
