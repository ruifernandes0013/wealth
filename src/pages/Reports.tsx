import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
  Star,
  Percent,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { calcYearMonths } from '../utils/calculations';
import { formatCurrency, formatPct } from '../utils/format';
import StatCard from '../components/StatCard';
import { MONTH_NAMES_PT, MONTH_NAMES_FULL_PT } from '../types';

// ─── Color Palettes ───────────────────────────────────────────────────────────

const INCOME_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

const EXPENSE_COLORS = [
  '#ef4444',  // prestacao - red
  '#f97316',  // condObras - orange
  '#eab308',  // agua - yellow
  '#84cc16',  // luz - lime
  '#10b981',  // internet - emerald
  '#06b6d4',  // gasoleo - cyan
  '#3b82f6',  // alimentacao - blue
  '#8b5cf6',  // mecanico - violet
  '#ec4899',  // netflix - pink
  '#14b8a6',  // telefone - teal
  '#f43f5e',  // gymNutri - rose
  '#a855f7',  // saidas - purple
  '#6366f1',  // outros - indigo
];

const SAVINGS_COLORS = [
  '#8b5cf6',  // contas - violet
  '#06b6d4',  // ferias - cyan
  '#10b981',  // t1Felgueiras - emerald
  '#f59e0b',  // t1Esposende - amber
  '#ef4444',  // t1Fradelos - red
  '#ec4899',  // casamento - pink
  '#3b82f6',  // stockMarket - blue
  '#f97316',  // ouro - orange
];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function CurrencyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{formatCurrency(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

function PctTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{formatPct(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

interface DonutProps {
  data: { name: string; value: number }[];
  colors: string[];
  title: string;
}

function DonutChart({ data, colors, title }: DonutProps) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No data</p>
      ) : (
        <div className="flex gap-4 flex-col">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={filtered}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {filtered.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => formatCurrency(val)}
                contentStyle={{ borderRadius: '8px', fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {filtered.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  />
                  <span className="text-gray-600">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">
                    {total > 0 ? formatPct((d.value / total) * 100) : '—'}
                  </span>
                  <span className="font-bold text-gray-800">
                    {formatCurrency(d.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mt-2">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Savings Rate Gauge ───────────────────────────────────────────────────────

function SavingsGauge({ pct }: { pct: number }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const fill = clamped >= 60 ? '#10b981' : clamped >= 40 ? '#f59e0b' : '#ef4444';
  const data = [{ value: clamped, fill }];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center justify-center">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Avg. Savings Rate</h3>
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart innerRadius="65%" outerRadius="90%" data={data} startAngle={180} endAngle={0} barSize={18}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: '#f3f4f6' }} dataKey="value" cornerRadius={8} />
          <text x="50%" y="72%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fontWeight: 800, fill: fill }}>
            {clamped.toFixed(1)}%
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-gray-400 mt-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ≥60% great</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> ≥40% ok</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;40% low</span>
      </div>
    </div>
  );
}

// ─── Top Expense Categories ───────────────────────────────────────────────────

function TopExpenses({ data }: { data: {name: string; value: number; color: string}[] }) {
  const sorted = [...data].filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Expense Categories</h3>
      {sorted.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No data</p> : (
        <ResponsiveContainer width="100%" height={Math.max(sorted.length * 32, 200)}>
          <BarChart data={sorted} layout="vertical" barSize={14} margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
            <XAxis type="number" hide tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: (v: number) => formatCurrency(v), fontSize: 11, fill: '#6b7280' }}>
              {sorted.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

const MONTH_NAMES_FULL = MONTH_NAMES_FULL_PT;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reports() {
  const { state, getMonthsForYear, getYearConfig, getAvailableYears, loading } = useData();
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);

  const months = getMonthsForYear(selectedYear);
  const yearConfig = getYearConfig(selectedYear);
  const allComputed = calcYearMonths(months, state.income, state.expenses, state.investments, yearConfig.initialBalance);

  // Dynamic column names sorted by sortOrder
  function getUniqueNames(items: { year: number; name: string; sortOrder?: number }[], year: number): string[] {
    const map = new Map<string, number>();
    items.filter(i => i.year === year).forEach(i => {
      const cur = map.get(i.name) ?? Infinity;
      if ((i.sortOrder ?? 99) < cur) map.set(i.name, i.sortOrder ?? 99);
    });
    return Array.from(map.entries()).sort((a, b) => a[1] - b[1]).map(([n]) => n);
  }
  const incomeNames = getUniqueNames(state.income, selectedYear);
  const expenseNames = getUniqueNames(state.expenses, selectedYear);
  const investmentNames = getUniqueNames(state.investments, selectedYear);

  // Filter by month range
  const computed = allComputed.filter(m => m.month >= fromMonth && m.month <= toMonth);

  // Also use filteredMonths alias for clarity
  const filteredMonths = computed;

  const handleCurrentMonth = () => {
    const now = new Date();
    setFromMonth(now.getMonth() + 1);
    setToMonth(now.getMonth() + 1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── YTD aggregates ──────────────────────────────────────────────────────────
  const totalIncome = computed.reduce((s, m) => s + m.calc.cashIn, 0);
  const totalExpenses = computed.reduce((s, m) => s + m.calc.gastosEx, 0);
  const totalSaved = computed.reduce((s, m) => s + m.calc.guardado, 0);
  const avgSavingsRate =
    computed.length > 0
      ? computed.reduce((s, m) => s + m.calc.savingsPct, 0) / computed.length
      : 0;
  const avgMonthlyIncome = computed.length > 0 ? totalIncome / computed.length : 0;
  const avgMonthlyExpenses = computed.length > 0 ? totalExpenses / computed.length : 0;
  const avgMonthlySavings = computed.length > 0 ? totalSaved / computed.length : 0;

  const lastBalance =
    computed.length > 0
      ? computed[computed.length - 1].totalBalance
      : yearConfig.initialBalance;

  const totalInvestments = computed.reduce((s, m) => s + m.calc.savingsTotal, 0);
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const investmentRate = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  const runway = avgMonthlyExpenses > 0 ? lastBalance / avgMonthlyExpenses : 0;
  const coverageRatio = avgMonthlyExpenses > 0 ? avgMonthlyIncome / avgMonthlyExpenses : 0;

  const bestMonth = computed.reduce(
    (best, m) => (m.calc.savingsPct > best.calc.savingsPct ? m : best),
    computed[0] ?? { calc: { savingsPct: 0 }, month: 0 }
  );

  const monthsAbove60 = computed.filter((m) => m.calc.savingsPct >= 60).length;

  // Biggest expense category (across filtered months)
  const expenseSumByName: Record<string, number> = {};
  computed.forEach((m) => {
    m.expenseItems.forEach(item => {
      expenseSumByName[item.name] = (expenseSumByName[item.name] ?? 0) + item.amount;
    });
  });
  const biggestExpenseName = Object.keys(expenseSumByName).sort(
    (a, b) => expenseSumByName[b] - expenseSumByName[a]
  )[0];

  // ── Chart Data ──────────────────────────────────────────────────────────────

  const monthlyChartData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    Income: m.calc.cashIn,
    Expenses: m.calc.gastosEx,
    Extraordinary: m.calc.savingsTotal,
    Saved: m.calc.guardado,
  }));

  const savingsRateData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    'Savings Rate': m.calc.savingsPct,
  }));

  const balanceData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    'Bank Balance': m.totalBalance,
  }));

  const anoData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    Saved: m.ano,
  }));

  // Income sources donut
  const incomeSources = incomeNames.map(name => ({
    name,
    value: computed.reduce((s, m) => s + (m.incomeItems.find(i => i.name === name)?.amount ?? 0), 0),
  }));

  // Expense categories donut
  const expenseCategories = expenseNames.map(name => ({
    name,
    value: computed.reduce((s, m) => s + (m.expenseItems.find(i => i.name === name)?.amount ?? 0), 0),
  }));

  // Investments allocations donut
  const investmentAllocations = investmentNames.map(name => ({
    name,
    value: computed.reduce((s, m) => s + (m.investmentItems.find(i => i.name === name)?.amount ?? 0), 0),
  }));

  // Income stacked bar (dynamic)
  const propertyData = computed.map(m => {
    const entry: Record<string, string | number> = { name: MONTH_NAMES_PT[m.month - 1] };
    incomeNames.forEach(name => {
      entry[name] = m.incomeItems.find(i => i.name === name)?.amount ?? 0;
    });
    return entry;
  });

  // Expense breakdown stacked bar (dynamic)
  const expenseBreakdownData = computed.map(m => {
    const entry: Record<string, string | number> = { name: MONTH_NAMES_PT[m.month - 1] };
    expenseNames.forEach(name => {
      entry[name] = m.expenseItems.find(i => i.name === name)?.amount ?? 0;
    });
    return entry;
  });

  // Investment allocation over time (dynamic)
  const investmentTimeData = filteredMonths.map(m => {
    const entry: Record<string, string | number> = { name: MONTH_NAMES_PT[m.month - 1] };
    investmentNames.forEach(name => {
      entry[name] = m.investmentItems.find(i => i.name === name)?.amount ?? 0;
    });
    return entry;
  });

  // Cumulative cash flow data
  let cumIncome = 0, cumExpenses = 0, cumNet = 0;
  const cumulativeData = computed.map(m => {
    cumIncome += m.calc.cashIn;
    cumExpenses += m.calc.gastosEx;
    cumNet += m.calc.guardado;
    return { name: MONTH_NAMES_PT[m.month - 1], 'Income': cumIncome, 'Expenses': cumExpenses, 'Net': cumNet };
  });

  // Month-over-month delta for savings rate
  const momDeltas = computed.map((m, i) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    rate: m.calc.savingsPct,
    delta: i > 0 ? m.calc.savingsPct - computed[i - 1].calc.savingsPct : 0,
    guardado: m.calc.guardado,
    cashIn: m.calc.cashIn,
    confirmed: m.confirmed,
  }));

  // ── Extraordinary metrics ────────────────────────────────────────────────
  const totalExtraordinary = computed.reduce((s, m) => s + m.calc.savingsTotal, 0);
  const extraordinaryPctOfIncome = totalIncome > 0 ? (totalExtraordinary / totalIncome) * 100 : 0;
  const avgExtraordinaryPerMonth = computed.length > 0 ? totalExtraordinary / computed.length : 0;
  const activeExtraordinaryMonths = computed.filter(m => m.calc.savingsTotal > 0).length;
  const peakExtraordinaryMonth = computed.reduce(
    (best, m) => m.calc.savingsTotal > best.calc.savingsTotal ? m : best,
    computed[0] ?? { calc: { savingsTotal: 0 }, month: 0 }
  );
  const extraordinarySumByName: Record<string, number> = {};
  computed.forEach(m => {
    m.investmentItems.forEach(item => {
      extraordinarySumByName[item.name] = (extraordinarySumByName[item.name] ?? 0) + item.amount;
    });
  });
  const biggestExtraordinaryName = Object.keys(extraordinarySumByName).sort(
    (a, b) => extraordinarySumByName[b] - extraordinarySumByName[a]
  )[0];

  // Top expenses data for horizontal bar (dynamic)
  const topExpensesData = expenseNames.map((name, i) => ({
    name,
    value: filteredMonths.reduce((s, m) => s + (m.expenseItems.find(item => item.name === name)?.amount ?? 0), 0),
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));

  // Confirmed months table
  const confirmedMonths = computed.filter((m) => m.confirmed);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Detailed financial analysis
          </p>
        </div>
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          {/* From month */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500">From:</span>
            <select
              value={fromMonth}
              onChange={(e) => {
                const v = Number(e.target.value);
                setFromMonth(v);
                if (v > toMonth) setToMonth(v);
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
            >
              {MONTH_NAMES_FULL.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          {/* To month */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500">To:</span>
            <select
              value={toMonth}
              onChange={(e) => {
                const v = Number(e.target.value);
                setToMonth(v);
                if (v < fromMonth) setFromMonth(v);
              }}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
            >
              {MONTH_NAMES_FULL.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
          {/* Current month shortcut */}
          <button
            onClick={handleCurrentMonth}
            className="px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors"
          >
            Current Month
          </button>
          {/* Reset to full year */}
          <button
            onClick={() => { setFromMonth(1); setToMonth(12); }}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            Full Year
          </button>
        </div>
      </div>

      {/* ── Summary Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Income"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          colorClass="text-emerald-600"
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          colorClass="text-red-600"
        />
        <StatCard
          title="Saved"
          value={formatCurrency(totalSaved)}
          icon={<PiggyBank className="w-5 h-5 text-violet-600" />}
          colorClass="text-violet-600"
        />
        <StatCard
          title="Avg. Savings Rate"
          value={formatPct(avgSavingsRate)}
          icon={<Percent className="w-5 h-5 text-blue-500" />}
          colorClass="text-blue-600"
        />
        <StatCard
          title="Best Month"
          value={
            bestMonth
              ? `${MONTH_NAMES_PT[(bestMonth.month ?? 1) - 1]} ${formatPct(bestMonth.calc.savingsPct)}`
              : '—'
          }
          icon={<Star className="w-5 h-5 text-yellow-500" />}
          colorClass="text-yellow-600"
        />
        <StatCard
          title="Bank Balance"
          value={formatCurrency(lastBalance)}
          icon={<Landmark className="w-5 h-5 text-blue-600" />}
          colorClass={lastBalance >= 0 ? 'text-blue-600' : 'text-red-600'}
        />
      </div>

      {/* ── Additional Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Avg. Monthly Income"
          value={formatCurrency(avgMonthlyIncome)}
          colorClass="text-emerald-600"
          subtitle="Simple average all months"
        />
        <StatCard
          title="Avg. Monthly Expenses"
          value={formatCurrency(avgMonthlyExpenses)}
          colorClass="text-red-600"
          subtitle="Simple average all months"
        />
        <StatCard
          title="Avg. Monthly Extraordinary"
          value={formatCurrency(avgExtraordinaryPerMonth)}
          colorClass="text-violet-600"
          subtitle="Avg. extraordinary spend/month"
        />
        <StatCard
          title="Months with >60% Rate"
          value={String(monthsAbove60)}
          colorClass="text-emerald-600"
          subtitle={`of ${computed.length} months`}
        />
        <StatCard
          title="Biggest Expense Category"
          value={biggestExpenseName ?? '—'}
          colorClass="text-red-600"
          subtitle={biggestExpenseName ? formatCurrency(expenseSumByName[biggestExpenseName]) : ''}
        />
        <StatCard
          title="Confirmed Months"
          value={`${confirmedMonths.length} / ${computed.length}`}
          colorClass="text-emerald-600"
          subtitle="Real data vs projection"
        />
        <StatCard
          title="Opening Balance"
          value={formatCurrency(yearConfig.initialBalance)}
          colorClass="text-blue-600"
          subtitle={`Start of ${selectedYear}`}
        />
        <StatCard
          title="Balance Change"
          value={formatCurrency(lastBalance - yearConfig.initialBalance)}
          colorClass={
            lastBalance - yearConfig.initialBalance >= 0
              ? 'text-emerald-600'
              : 'text-red-600'
          }
          subtitle="Final balance - opening balance"
        />
      </div>

      {/* ── Extraordinary ─────────────────────────────────────────────────── */}
      <SectionHeader title="Extraordinary" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Extraordinary"
          value={formatCurrency(totalExtraordinary)}
          colorClass="text-violet-600"
          subtitle={`${activeExtraordinaryMonths} active month${activeExtraordinaryMonths !== 1 ? 's' : ''}`}
        />
        <StatCard
          title="% of Income"
          value={formatPct(extraordinaryPctOfIncome)}
          colorClass={extraordinaryPctOfIncome > 30 ? 'text-red-600' : 'text-violet-600'}
          subtitle="Extraordinary ÷ total income"
        />
        <StatCard
          title="Biggest Category"
          value={biggestExtraordinaryName ?? '—'}
          colorClass="text-violet-600"
          subtitle={biggestExtraordinaryName ? formatCurrency(extraordinarySumByName[biggestExtraordinaryName]) : ''}
        />
        <StatCard
          title="Peak Month"
          value={peakExtraordinaryMonth && peakExtraordinaryMonth.calc.savingsTotal > 0
            ? `${MONTH_NAMES_PT[(peakExtraordinaryMonth.month ?? 1) - 1]} ${formatCurrency(peakExtraordinaryMonth.calc.savingsTotal)}`
            : '—'}
          colorClass="text-violet-600"
          subtitle="Highest extraordinary spend"
        />
      </div>

      {/* ── Distribution Donuts ───────────────────────────────────────────── */}
      <SectionHeader title="Distribution" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChart
          title="Income Sources"
          data={incomeSources}
          colors={INCOME_COLORS}
        />
        <DonutChart
          title="Expense Categories"
          data={expenseCategories}
          colors={EXPENSE_COLORS}
        />
        <DonutChart
          title="Extraordinary Allocation"
          data={investmentAllocations}
          colors={SAVINGS_COLORS}
        />
      </div>

      {/* ── Savings Gauge & Top Spending ──────────────────────────────────── */}
      <SectionHeader title="Savings Gauge & Top Spending" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SavingsGauge pct={avgSavingsRate} />
        <TopExpenses data={topExpensesData} />
      </div>

      {/* ── Income vs Expenses Bar Chart ─────────────────────────────────── */}
      <SectionHeader title="Income vs. Expenses by Month" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyChartData} barSize={18} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Extraordinary" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Monthly Savings Amount ────────────────────────────────────────── */}
      <SectionHeader title="Monthly Savings (Guardado)" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyChartData} barSize={22} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={2} />
            <Bar dataKey="Saved" radius={[4, 4, 0, 0]}>
              {monthlyChartData.map((entry, i) => (
                <Cell key={i} fill={(entry['Saved'] as number) >= 0 ? '#8b5cf6' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Extraordinary Over Time ───────────────────────────────────────── */}
      <SectionHeader title="Extraordinary Over Time" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={investmentTimeData} barSize={28} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v/1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {investmentNames.map((name, i, arr) => (
              <Bar key={name} dataKey={name} stackId="inv"
                fill={SAVINGS_COLORS[i % SAVINGS_COLORS.length]}
                radius={i === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Property Income Stacked Bar ──────────────────────────────────── */}
      <SectionHeader title="Property Income by Month" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={propertyData} barSize={28} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {incomeNames.map((name, i, arr) => (
              <Bar key={name} dataKey={name} stackId="a"
                fill={INCOME_COLORS[i % INCOME_COLORS.length]}
                radius={i === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Expense Breakdown Stacked Bar ───────────────────────────────── */}
      <SectionHeader title="Expense Breakdown by Month" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={expenseBreakdownData} barSize={32} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {expenseNames.map((name, i, arr) => (
              <Bar key={name} dataKey={name} stackId="b"
                fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]}
                radius={i === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Savings Rate Line ────────────────────────────────────────────── */}
      <SectionHeader title="Savings Rate by Month" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={savingsRateData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 100]} />
            <Tooltip content={<PctTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line
              type="monotone"
              dataKey="Savings Rate"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#8b5cf6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Financial Health Ratios ───────────────────────────────────────── */}
      <SectionHeader title="Financial Health Ratios" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Emergency Runway */}
        {(() => {
          const months = Math.max(0, runway);
          const color = months >= 12 ? '#10b981' : months >= 6 ? '#f59e0b' : '#ef4444';
          const label = months >= 12 ? 'Excellent' : months >= 6 ? 'Adequate' : 'Low';
          const pct = Math.min((months / 24) * 100, 100);
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Emergency Runway</p>
              <p className="text-3xl font-black tabular-nums" style={{ color }}>{months.toFixed(1)}<span className="text-base font-semibold text-gray-400 ml-1">mo</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Bank balance ÷ avg monthly expenses</p>
              <p className="text-xs text-gray-300 tabular-nums mt-0.5 mb-3">{formatCurrency(lastBalance)} ÷ {formatCurrency(avgMonthlyExpenses)}/mo</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <p className="text-xs font-medium mt-1.5" style={{ color }}>{label} · target ≥ 12 months</p>
            </div>
          );
        })()}
        {/* Expense Ratio */}
        {(() => {
          const color = expenseRatio <= 40 ? '#10b981' : expenseRatio <= 60 ? '#f59e0b' : '#ef4444';
          const label = expenseRatio <= 40 ? 'Excellent' : expenseRatio <= 60 ? 'Watch' : 'High';
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Expense Ratio</p>
              <p className="text-3xl font-black tabular-nums" style={{ color }}>{expenseRatio.toFixed(1)}<span className="text-base font-semibold text-gray-400 ml-0.5">%</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Total expenses ÷ total income</p>
              <p className="text-xs text-gray-300 tabular-nums mt-0.5 mb-3">{formatCurrency(totalExpenses)} ÷ {formatCurrency(totalIncome)}</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(expenseRatio, 100)}%`, backgroundColor: color }} />
              </div>
              <p className="text-xs font-medium mt-1.5" style={{ color }}>{label} · target ≤ 40%</p>
            </div>
          );
        })()}
        {/* Capital Outflow Rate */}
        {(() => {
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Capital Outflow</p>
              <p className="text-3xl font-black tabular-nums text-violet-600">{investmentRate.toFixed(1)}<span className="text-base font-semibold text-gray-400 ml-0.5">%</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Extraordinary column ÷ total income</p>
              <p className="text-xs text-gray-300 tabular-nums mt-0.5 mb-3">{formatCurrency(totalInvestments)} ÷ {formatCurrency(totalIncome)}</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all bg-violet-400" style={{ width: `${Math.min(investmentRate * 2, 100)}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">One-off, non-recurring capital events</p>
            </div>
          );
        })()}
        {/* Income Coverage Ratio */}
        {(() => {
          const color = coverageRatio >= 2.5 ? '#10b981' : coverageRatio >= 1.5 ? '#f59e0b' : '#ef4444';
          const label = coverageRatio >= 2.5 ? 'Strong' : coverageRatio >= 1.5 ? 'Moderate' : 'Tight';
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Coverage Ratio</p>
              <p className="text-3xl font-black tabular-nums" style={{ color }}>{coverageRatio.toFixed(2)}<span className="text-base font-semibold text-gray-400 ml-1">×</span></p>
              <p className="text-xs text-gray-400 mt-0.5">Avg income ÷ avg expenses</p>
              <p className="text-xs text-gray-300 tabular-nums mt-0.5 mb-3">{formatCurrency(avgMonthlyIncome)}/mo ÷ {formatCurrency(avgMonthlyExpenses)}/mo</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((coverageRatio / 3) * 100, 100)}%`, backgroundColor: color }} />
              </div>
              <p className="text-xs font-medium mt-1.5" style={{ color }}>{label} · target ≥ 2.5×</p>
            </div>
          );
        })()}
      </div>

      {/* ── Financial Goals & Action Plan ────────────────────────────────── */}
      <SectionHeader title="Financial Goals & Action Plan" />
      {computed.length > 0 && (() => {
        interface Goal {
          status: 'achieved' | 'on-track' | 'improve' | 'urgent';
          title: string;
          description: string;
          action: string;
          current: string;
          target: string;
        }

        const goals: Goal[] = [];

        // 1. Emergency Runway
        if (runway >= 12) {
          goals.push({ status: 'achieved', title: 'Emergency Runway', current: `${runway.toFixed(1)} months`, target: '≥ 12 months', description: `You have ${runway.toFixed(1)} months of expenses covered — excellent safety net.`, action: 'Consider moving excess reserves into higher-yield investments.' });
        } else if (runway >= 6) {
          const needed = avgMonthlyExpenses * 12 - lastBalance;
          goals.push({ status: 'on-track', title: 'Emergency Runway', current: `${runway.toFixed(1)} months`, target: '12 months', description: `Good buffer, but target is 12 months.`, action: `Save ${formatCurrency(needed)} more to reach a full 12-month safety net.` });
        } else {
          const needed = avgMonthlyExpenses * 6 - lastBalance;
          goals.push({ status: 'urgent', title: 'Emergency Runway', current: `${runway.toFixed(1)} months`, target: '≥ 6 months', description: `Your runway is critically low — a job loss or emergency could be serious.`, action: `Build ${formatCurrency(Math.max(needed, 0))} in reserves to reach the 6-month minimum.` });
        }

        // 2. Savings Rate
        if (avgSavingsRate >= 60) {
          goals.push({ status: 'achieved', title: 'Savings Rate', current: formatPct(avgSavingsRate), target: '≥ 60%', description: 'Outstanding savings discipline — you are in wealth-building territory.', action: 'Direct surplus into diversified investments to compound returns.' });
        } else if (avgSavingsRate >= 40) {
          const extraNeeded = (60 - avgSavingsRate) / 100 * avgMonthlyIncome;
          goals.push({ status: 'on-track', title: 'Savings Rate', current: formatPct(avgSavingsRate), target: '60%', description: 'Good rate, but 60%+ is where serious wealth is built.', action: `Find ${formatCurrency(extraNeeded)}/month more to save through small cuts or income growth.` });
        } else if (avgSavingsRate >= 20) {
          const extraNeeded = (40 - avgSavingsRate) / 100 * avgMonthlyIncome;
          goals.push({ status: 'improve', title: 'Savings Rate', current: formatPct(avgSavingsRate), target: '40%', description: 'Acceptable but there is significant room to improve.', action: `Increase savings by ${formatCurrency(extraNeeded)}/month — review top expense categories.` });
        } else {
          const extraNeeded = (20 - avgSavingsRate) / 100 * avgMonthlyIncome;
          goals.push({ status: 'urgent', title: 'Savings Rate', current: formatPct(avgSavingsRate), target: '20%', description: 'Savings rate is below the minimum recommended level.', action: `Start by saving ${formatCurrency(extraNeeded)}/month more. Cut discretionary spending first.` });
        }

        // 3. Expense Ratio
        if (expenseRatio <= 40) {
          goals.push({ status: 'achieved', title: 'Expense Ratio', current: `${expenseRatio.toFixed(1)}%`, target: '≤ 40%', description: 'Expenses are well under control relative to income.', action: 'Maintain discipline and watch for lifestyle inflation.' });
        } else if (expenseRatio <= 60) {
          const overBy = (expenseRatio - 40) / 100 * totalIncome;
          goals.push({ status: 'improve', title: 'Expense Ratio', current: `${expenseRatio.toFixed(1)}%`, target: '40%', description: 'Expenses are eating a large share of income.', action: `Reduce total expenses by ${formatCurrency(overBy / Math.max(computed.length, 1))}/month to hit the 40% target.` });
        } else {
          const overBy = (expenseRatio - 40) / 100 * totalIncome;
          goals.push({ status: 'urgent', title: 'Expense Ratio', current: `${expenseRatio.toFixed(1)}%`, target: '≤ 40%', description: 'Most of your income goes to expenses — very little room to build wealth.', action: `Cut ${formatCurrency(overBy / Math.max(computed.length, 1))}/month in expenses. Start with the biggest category.` });
        }

        // 4. Coverage Ratio
        if (coverageRatio >= 2.5) {
          goals.push({ status: 'achieved', title: 'Income Coverage', current: `${coverageRatio.toFixed(2)}×`, target: '≥ 2.5×', description: 'Income comfortably covers expenses with strong headroom.', action: 'Use the surplus to accelerate debt paydown or investment.' });
        } else if (coverageRatio >= 1.5) {
          goals.push({ status: 'improve', title: 'Income Coverage', current: `${coverageRatio.toFixed(2)}×`, target: '2.5×', description: 'Income covers expenses but the margin is thin.', action: `Grow income or cut expenses to reach ${formatCurrency(avgMonthlyExpenses * 2.5)}/month income target.` });
        } else {
          goals.push({ status: 'urgent', title: 'Income Coverage', current: `${coverageRatio.toFixed(2)}×`, target: '≥ 1.5×', description: 'Income barely covers expenses — you are financially exposed.', action: 'Prioritise increasing income streams. Look for rental, freelance, or raise opportunities.' });
        }

        // 5. Biggest expense category
        if (biggestExpenseName) {
          const biggestTotal = expenseSumByName[biggestExpenseName];
          const biggestPct = totalExpenses > 0 ? (biggestTotal / totalExpenses) * 100 : 0;
          if (biggestPct > 40) {
            goals.push({ status: 'improve', title: 'Expense Concentration', current: `${biggestExpenseName} = ${biggestPct.toFixed(0)}% of expenses`, target: '< 40% in any category', description: `"${biggestExpenseName}" dominates your spending at ${formatCurrency(biggestTotal)}.`, action: `Audit "${biggestExpenseName}". Even a 10% reduction saves ${formatCurrency(biggestTotal * 0.1 / Math.max(computed.length, 1))}/month.` });
          } else {
            goals.push({ status: 'achieved', title: 'Expense Diversification', current: `${biggestExpenseName} = ${biggestPct.toFixed(0)}%`, target: '< 40% any category', description: 'No single expense dominates your budget — well balanced.', action: 'Continue monitoring for any category that starts to grow disproportionately.' });
          }
        }

        // 6. Consistency: months with low savings rate
        const lowMonths = computed.filter(m => m.confirmed && m.calc.savingsPct < 20).length;
        const confirmedTotal = computed.filter(m => m.confirmed).length;
        if (confirmedTotal > 0 && lowMonths === 0) {
          goals.push({ status: 'achieved', title: 'Consistency', current: '0 low months', target: 'No months below 20%', description: 'Every confirmed month has been above 20% savings rate.', action: 'Aim to eliminate months below 40% next.' });
        } else if (lowMonths > 0) {
          goals.push({ status: lowMonths >= 3 ? 'urgent' : 'improve', title: 'Consistency', current: `${lowMonths} month${lowMonths > 1 ? 's' : ''} below 20%`, target: '0 months below 20%', description: `${lowMonths} confirmed month${lowMonths > 1 ? 's' : ''} had a savings rate under 20%.`, action: 'Identify what happened in those months and set a monthly spending budget to prevent it.' });
        }

        const colors = {
          achieved: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', label: 'text-emerald-700', icon: '✓' },
          'on-track': { bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-400', label: 'text-sky-700', icon: '→' },
          improve: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-400', label: 'text-amber-700', icon: '△' },
          urgent: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-400', label: 'text-red-700', icon: '!' },
        };
        const labels = { achieved: 'Achieved', 'on-track': 'On Track', improve: 'Needs Work', urgent: 'Urgent' };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g, i) => {
              const c = colors[g.status];
              return (
                <div key={i} className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-gray-800">{g.title}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${c.badge} whitespace-nowrap`}>
                      {c.icon} {labels[g.status]}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className={`text-lg font-black tabular-nums ${c.label}`}>{g.current}</span>
                    <span className="text-xs text-gray-400">target {g.target}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{g.description}</p>
                  <div className="border-t border-black/5 pt-2">
                    <p className="text-xs font-semibold text-gray-700">Action: <span className="font-normal text-gray-600">{g.action}</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Cumulative Cash Flow ──────────────────────────────────────────── */}
      <SectionHeader title="Cumulative Cash Flow" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <p className="text-xs text-gray-400 mb-4">Running totals over the period — the gap between Income and Expenses is your accumulated net savings.</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cumulativeData}>
            <defs>
              <linearGradient id="cumIncGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cumExpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#cumIncGrad)" dot={false} />
            <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#cumExpGrad)" dot={false} />
            <Line type="monotone" dataKey="Net" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#8b5cf6' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Monthly Scorecard ─────────────────────────────────────────────── */}
      <SectionHeader title="Monthly Scorecard" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {momDeltas.map((m, i) => {
          const color = m.rate >= 60 ? { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-500' }
            : m.rate >= 40 ? { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-400' }
            : m.rate >= 20 ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-400' }
            : { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-400' };
          const deltaSign = m.delta > 0 ? '+' : '';
          return (
            <div key={i} className={`rounded-xl border p-3 ${color.bg} ${color.border} ${!m.confirmed ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700">{m.name}</span>
                <span className={`w-2 h-2 rounded-full ${m.confirmed ? color.badge : 'bg-gray-300'}`} />
              </div>
              <p className={`text-xl font-black tabular-nums ${color.text}`}>{m.rate.toFixed(0)}<span className="text-xs font-semibold">%</span></p>
              <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{formatCurrency(m.guardado)}</p>
              {i > 0 && (
                <p className={`text-xs font-semibold mt-1 tabular-nums ${m.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {deltaSign}{m.delta.toFixed(1)}pp
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
