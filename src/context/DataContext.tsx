import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import type { MonthEntry, YearConfig, AppState } from '../types';
import { seedMonths2026, seedYearConfigs } from '../data/seed';

const STORAGE_KEY = 'wealth_data';

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: 'UPDATE_MONTH'; payload: MonthEntry }
  | { type: 'UPDATE_YEAR_CONFIG'; payload: YearConfig }
  | { type: 'RESET' };

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'UPDATE_MONTH': {
      const exists = state.months.find((m) => m.id === action.payload.id);
      const months = exists
        ? state.months.map((m) =>
            m.id === action.payload.id ? action.payload : m
          )
        : [...state.months, action.payload];
      return { ...state, months };
    }
    case 'UPDATE_YEAR_CONFIG': {
      const exists = state.yearConfigs.find(
        (c) => c.year === action.payload.year
      );
      const yearConfigs = exists
        ? state.yearConfigs.map((c) =>
            c.year === action.payload.year ? action.payload : c
          )
        : [...state.yearConfigs, action.payload];
      return { ...state, yearConfigs };
    }
    case 'RESET':
      return getInitialState();
    default:
      return state;
  }
}

// ─── Initial State ───────────────────────────────────────────────────────────

function getInitialState(): AppState {
  return {
    months: seedMonths2026,
    yearConfigs: seedYearConfigs,
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.months && parsed.yearConfigs) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return getInitialState();
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface DataContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  updateMonth: (month: MonthEntry) => void;
  updateYearConfig: (config: YearConfig) => void;
  getMonthsForYear: (year: number) => MonthEntry[];
  getYearConfig: (year: number) => YearConfig;
  getAvailableYears: () => number[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const updateMonth = (month: MonthEntry) =>
    dispatch({ type: 'UPDATE_MONTH', payload: month });

  const updateYearConfig = (config: YearConfig) =>
    dispatch({ type: 'UPDATE_YEAR_CONFIG', payload: config });

  const getMonthsForYear = (year: number): MonthEntry[] =>
    state.months.filter((m) => m.year === year);

  const getYearConfig = (year: number): YearConfig => {
    return (
      state.yearConfigs.find((c) => c.year === year) ?? {
        year,
        initialBalance: 0,
      }
    );
  };

  const getAvailableYears = (): number[] => {
    const years = new Set<number>();
    state.months.forEach((m) => years.add(m.year));
    state.yearConfigs.forEach((c) => years.add(c.year));
    return Array.from(years).sort((a, b) => b - a);
  };

  return (
    <DataContext.Provider
      value={{
        state,
        dispatch,
        updateMonth,
        updateYearConfig,
        getMonthsForYear,
        getYearConfig,
        getAvailableYears,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
