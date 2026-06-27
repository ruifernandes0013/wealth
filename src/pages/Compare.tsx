import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, Landmark, ArrowUp, ArrowDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calcYearMonths } from '../utils/calculations';
import { formatCurrency, formatPct } from '../utils/format';
import { MONTH_NAMES_PT } from '../types';

const YEAR_COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4'];

interface YearStats {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalSaved: number;
  avgSavingsRate: number;
  totalExtraordinary: number;
  endBalance: number;
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  confirmedMonths: number;
  monthCount: number;
}

function Delta({ cur, prev }: { cur: number; prev: number | undefined }) {
  if (prev === undefined || prev === 0) return <span className="text-gray-300">—</span>;
  const pct = ((cur - prev) / Math.abs(prev)) * 100;
  const up = pct > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  const color = up ? 'text-emerald-600' : 'text-red-500';
  if (Math.abs(pct) < 0.1) return <span className="text-gray-400 text-xs">~0%</span>;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon className="w-3 h-3" />{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{formatCurrency(p.value)}</strong></p>
      ))}
    </div>
  );
}

function PctTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{formatPct(p.value)}</strong></p>
      ))}
    </div>
  );
}

export default function Compare() {
  const { state, getMonthsForYear, getYearConfig, getAvailableYears } = useData();
  const availableYears = getAvailableYears().sort((a, b) => a - b);
  const [selectedYears, setSelectedYears] = useState<number[]>(availableYears);

  const activeYears = selectedYears.filter(y => availableYears.includes(y)).sort((a, b) => a - b);

  const toggleYear = (y: number) => {
    setSelectedYears(prev =>
      prev.includes(y) ? (prev.length > 1 ? prev.filter(x => x !== y) : prev) : [...prev, y]
    );
  };

  const yearStats: YearStats[] = activeYears.map(year => {
    const months = getMonthsForYear(year);
    const yearConfig = getYearConfig(year);
    const computed = calcYearMonths(months, state.income, state.expenses, state.investments, state.savings, yearConfig.initialBalance, state.savings);
    const n = computed.length;
    const totalIncome = computed.reduce((s, m) => s + m.calc.cashIn, 0);
    const totalExpenses = computed.reduce((s, m) => s + m.calc.gastosEx, 0);
    const totalSaved = computed.reduce((s, m) => s + m.calc.guardado, 0);
    const avgSavingsRate = n > 0 ? computed.reduce((s, m) => s + m.calc.savingsPct, 0) / n : 0;
    const totalExtraordinary = computed.reduce((s, m) => s + m.calc.savingsTotal, 0);
    const endBalance = computed.length > 0 ? computed[computed.length - 1].totalBalance : yearConfig.initialBalance;
    return {
      year, totalIncome, totalExpenses, totalSaved, avgSavingsRate,
      totalExtraordinary, endBalance,
      avgMonthlyIncome: n > 0 ? totalIncome / n : 0,
      avgMonthlyExpenses: n > 0 ? totalExpenses / n : 0,
      confirmedMonths: computed.filter(m => m.confirmed).length,
      monthCount: n,
    };
  });

  const monthlyTrendData = MONTH_NAMES_PT.map((name, idx) => {
    const entry: Record<string, string | number> = { name };
    activeYears.forEach(year => {
      const months = getMonthsForYear(year);
      const yearConfig = getYearConfig(year);
      const computed = calcYearMonths(months, state.income, state.expenses, state.investments, state.savings, yearConfig.initialBalance, state.savings);
      const m = computed.find(c => c.month === idx + 1);
      entry[String(year)] = m ? m.calc.cashIn : 0;
    });
    return entry;
  });

  const savingsRateTrendData = MONTH_NAMES_PT.map((name, idx) => {
    const entry: Record<string, string | number> = { name };
    activeYears.forEach(year => {
      const months = getMonthsForYear(year);
      const yearConfig = getYearConfig(year);
      const computed = calcYearMonths(months, state.income, state.expenses, state.investments, state.savings, yearConfig.initialBalance, state.savings);
      const m = computed.find(c => c.month === idx + 1);
      entry[String(year)] = m ? m.calc.savingsPct : 0;
    });
    return entry;
  });

  const annualData = yearStats.map(s => ({
    name: String(s.year),
    Income: s.totalIncome,
    Expenses: s.totalExpenses,
    Saved: s.totalSaved,
    Extraordinary: s.totalExtraordinary,
  }));

  const avgMonthlyData = yearStats.map(s => ({
    name: String(s.year),
    'Avg Income': s.avgMonthlyIncome,
    'Avg Expenses': s.avgMonthlyExpenses,
  }));

  const savingsRateBarData = yearStats.map((s, i) => ({
    name: String(s.year),
    'Savings Rate': s.avgSavingsRate,
    fill: YEAR_COLORS[i % YEAR_COLORS.length],
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Year Comparison</h1>
          <p className="text-gray-500 text-sm mt-1">Compare financial performance across years</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableYears.map((y, i) => (
            <button key={y} onClick={() => toggleYear(y)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${
                activeYears.includes(y) ? 'text-white border-transparent' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
              }`}
              style={activeYears.includes(y) ? { backgroundColor: YEAR_COLORS[i % YEAR_COLORS.length], borderColor: YEAR_COLORS[i % YEAR_COLORS.length] } : undefined}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Metric</th>
                {activeYears.map((y, i) => (
                  <th key={y} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: YEAR_COLORS[i % YEAR_COLORS.length] }}>{y}</th>
                ))}
                {activeYears.length >= 2 && <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-400">YoY</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {([
                { label: 'Total Income', key: 'totalIncome', fmt: formatCurrency, icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> },
                { label: 'Total Expenses', key: 'totalExpenses', fmt: formatCurrency, icon: <TrendingDown className="w-3.5 h-3.5 text-red-500" /> },
                { label: 'Total Saved', key: 'totalSaved', fmt: formatCurrency, icon: <PiggyBank className="w-3.5 h-3.5 text-violet-500" /> },
                { label: 'Avg Savings Rate', key: 'avgSavingsRate', fmt: formatPct, icon: null },
                { label: 'Extraordinary', key: 'totalExtraordinary', fmt: formatCurrency, icon: null },
                { label: 'Avg Monthly Income', key: 'avgMonthlyIncome', fmt: formatCurrency, icon: null },
                { label: 'Avg Monthly Expenses', key: 'avgMonthlyExpenses', fmt: formatCurrency, icon: null },
                { label: 'End Balance', key: 'endBalance', fmt: formatCurrency, icon: <Landmark className="w-3.5 h-3.5 text-blue-500" /> },
              ] as { label: string; key: keyof YearStats; fmt: (v: number) => string; icon: React.ReactNode }[]).map(row => (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">{row.icon}<span>{row.label}</span></div>
                  </td>
                  {yearStats.map(s => (
                    <td key={s.year} className="px-4 py-2.5 text-right tabular-nums font-semibold text-gray-800">
                      {row.fmt(s[row.key] as number)}
                    </td>
                  ))}
                  {activeYears.length >= 2 && (
                    <td className="px-4 py-2.5 text-right">
                      <Delta cur={yearStats[yearStats.length - 1][row.key] as number} prev={yearStats[yearStats.length - 2][row.key] as number} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Annual totals */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Annual Totals</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={annualData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saved" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Extraordinary" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avg monthly + savings rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Avg Monthly Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={avgMonthlyData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CurrencyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Avg Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Avg Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Avg Savings Rate by Year</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={savingsRateBarData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}%`} domain={[0, 100]} />
              <Tooltip content={<PctTooltip />} />
              <ReferenceLine y={60} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} />
              <Bar dataKey="Savings Rate" radius={[4, 4, 0, 0]}>
                {savingsRateBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly income trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Income Trend by Year</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {activeYears.map((y, i) => (
              <Line key={y} type="monotone" dataKey={String(y)} stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly savings rate trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Savings Rate by Year</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={savingsRateTrendData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(0)}%`} domain={[0, 100]} />
            <Tooltip content={<PctTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={60} stroke="#10b981" strokeDasharray="4 2" strokeWidth={1.5} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} />
            {activeYears.map((y, i) => (
              <Line key={y} type="monotone" dataKey={String(y)} stroke={YEAR_COLORS[i % YEAR_COLORS.length]}
                strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
