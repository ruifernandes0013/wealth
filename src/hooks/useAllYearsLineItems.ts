import { useEffect, useState } from 'react';
import type { LineItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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

export interface AllYearsLineItems {
  income: LineItem[];
  expenses: LineItem[];
  investments: LineItem[];
  savings: LineItem[];
}

const EMPTY: AllYearsLineItems = { income: [], expenses: [], investments: [], savings: [] };

// Reports and Compare need every year's line items at once for cross-year
// ranges and multi-year charts, unlike the main DataContext which only keeps
// the currently selected year in memory. Fetched fresh on mount / user change.
export function useAllYearsLineItems(): AllYearsLineItems {
  const { user } = useAuth();
  const [data, setData] = useState<AllYearsLineItems>(EMPTY);

  useEffect(() => {
    if (!user) {
      setData(EMPTY);
      return;
    }
    let cancelled = false;

    async function load() {
      const [incomeRes, expensesRes, investmentsRes, savingsRes] = await Promise.all([
        supabase.from('income').select('*').eq('user_id', user!.id),
        supabase.from('expenses').select('*').eq('user_id', user!.id),
        supabase.from('investments').select('*').eq('user_id', user!.id),
        supabase.from('savings').select('*').eq('user_id', user!.id),
      ]);
      if (cancelled) return;

      if (incomeRes.error) console.error('[useAllYearsLineItems] income error:', incomeRes.error);
      if (expensesRes.error) console.error('[useAllYearsLineItems] expenses error:', expensesRes.error);
      if (investmentsRes.error) console.error('[useAllYearsLineItems] investments error:', investmentsRes.error);
      if (savingsRes.error) console.error('[useAllYearsLineItems] savings error:', savingsRes.error);

      setData({
        income: (incomeRes.data || []).map(rowToLineItem),
        expenses: (expensesRes.data || []).map(rowToLineItem),
        investments: (investmentsRes.data || []).map(rowToLineItem),
        savings: (savingsRes.data || []).map(rowToLineItem),
      });
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  return data;
}
