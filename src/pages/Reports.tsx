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
import { MONTH_NAMES_PT, EXPENSE_LABELS, INCOME_LABELS, SAVINGS_LABELS } from '../types';
import type { ExpenseData, IncomeData, SavingsAllocation } from '../types';

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
        <p className="text-sm text-gray-400 text-center py-8">Sem dados</p>
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

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reports() {
  const { getMonthsForYear, getYearConfig, getAvailableYears, loading } = useData();
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(12);

  const months = getMonthsForYear(selectedYear);
  const yearConfig = getYearConfig(selectedYear);
  const allComputed = calcYearMonths(months, yearConfig.initialBalance);

  // Filter by month range
  const computed = allComputed.filter(m => m.month >= fromMonth && m.month <= toMonth);

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

  const bestMonth = computed.reduce(
    (best, m) => (m.calc.savingsPct > best.calc.savingsPct ? m : best),
    computed[0] ?? { calc: { savingsPct: 0 }, month: 0 }
  );

  const monthsAbove60 = computed.filter((m) => m.calc.savingsPct >= 60).length;

  // Biggest expense category (across filtered months)
  const expenseSumByKey: Record<string, number> = {};
  computed.forEach((m) => {
    (Object.keys(EXPENSE_LABELS) as (keyof ExpenseData)[]).forEach((k) => {
      expenseSumByKey[k] = (expenseSumByKey[k] ?? 0) + m.expenses[k];
    });
  });
  const biggestExpenseKey = Object.keys(expenseSumByKey).sort(
    (a, b) => expenseSumByKey[b] - expenseSumByKey[a]
  )[0] as keyof ExpenseData | undefined;

  // ── Chart Data ──────────────────────────────────────────────────────────────

  const monthlyChartData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    Receitas: m.calc.cashIn,
    Despesas: m.calc.gastosEx,
    Investimentos: m.calc.savingsTotal,
  }));

  const savingsRateData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    'Taxa de Poupança': m.calc.savingsPct,
  }));

  const balanceData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    'Saldo Bancário': m.totalBalance,
  }));

  const anoData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    Guardado: m.ano,
  }));

  // Income sources donut
  const incomeSources = (Object.keys(INCOME_LABELS) as (keyof IncomeData)[]).map(
    (k) => ({
      name: INCOME_LABELS[k],
      value: computed.reduce((s, m) => s + m.income[k], 0),
    })
  );

  // Expense categories donut
  const expenseCategories = (Object.keys(EXPENSE_LABELS) as (keyof ExpenseData)[]).map(
    (k) => ({
      name: EXPENSE_LABELS[k],
      value: computed.reduce((s, m) => s + m.expenses[k], 0),
    })
  );

  // Investments allocations donut
  const investmentAllocations = (
    Object.keys(SAVINGS_LABELS) as (keyof SavingsAllocation)[]
  ).map((k) => ({
    name: SAVINGS_LABELS[k],
    value: computed.reduce((s, m) => s + m.savings[k], 0),
  }));

  // Property income stacked bar
  const propertyData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    Esposende: m.income.esposende,
    Felgueiras: m.income.felgueiras,
    Fradelos: m.income.fradelos,
    DocBay: m.income.docbay,
    Receita: m.income.receita,
  }));

  // Expense breakdown stacked bar
  const expenseBreakdownData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    Prestação: m.expenses.prestacao,
    'Cond/Obras': m.expenses.condObras,
    Água: m.expenses.agua,
    Luz: m.expenses.luz,
    Internet: m.expenses.internet,
    Gasóleo: m.expenses.gasoleo,
    Alimentação: m.expenses.alimentacao,
    Mecânico: m.expenses.mecanico,
    Netflix: m.expenses.netflix,
    Telefone: m.expenses.telefone,
    'Gym/Nutri': m.expenses.gymNutri,
    Saídas: m.expenses.saidas,
    Outros: m.expenses.outros,
  }));

  // Confirmed months table
  const confirmedMonths = computed.filter((m) => m.confirmed);

  // Check if any month has custom investments
  const hasCustomInvestments = computed.some(m => (m.customInvestments || []).length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">
            Análise detalhada das finanças
          </p>
        </div>
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
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
            <span className="text-sm text-gray-500">De:</span>
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
            <span className="text-sm text-gray-500">Até:</span>
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
            Mês actual
          </button>
          {/* Reset to full year */}
          <button
            onClick={() => { setFromMonth(1); setToMonth(12); }}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            Ano completo
          </button>
        </div>
      </div>

      {/* ── Summary Stat Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Receitas"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          colorClass="text-emerald-600"
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          colorClass="text-red-600"
        />
        <StatCard
          title="Guardado"
          value={formatCurrency(totalSaved)}
          icon={<PiggyBank className="w-5 h-5 text-violet-600" />}
          colorClass="text-violet-600"
        />
        <StatCard
          title="Taxa de Poupança Média"
          value={formatPct(avgSavingsRate)}
          icon={<Percent className="w-5 h-5 text-blue-500" />}
          colorClass="text-blue-600"
        />
        <StatCard
          title="Melhor Mês"
          value={
            bestMonth
              ? `${MONTH_NAMES_PT[(bestMonth.month ?? 1) - 1]} ${formatPct(bestMonth.calc.savingsPct)}`
              : '—'
          }
          icon={<Star className="w-5 h-5 text-yellow-500" />}
          colorClass="text-yellow-600"
        />
        <StatCard
          title="Saldo Bancário"
          value={formatCurrency(lastBalance)}
          icon={<Landmark className="w-5 h-5 text-blue-600" />}
          colorClass={lastBalance >= 0 ? 'text-blue-600' : 'text-red-600'}
        />
      </div>

      {/* ── Additional Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Receita Mensal Média"
          value={formatCurrency(avgMonthlyIncome)}
          colorClass="text-emerald-600"
          subtitle="Média simples todos os meses"
        />
        <StatCard
          title="Despesa Mensal Média"
          value={formatCurrency(avgMonthlyExpenses)}
          colorClass="text-red-600"
          subtitle="Média simples todos os meses"
        />
        <StatCard
          title="Investimento Mensal Médio"
          value={formatCurrency(avgMonthlySavings)}
          colorClass="text-violet-600"
          subtitle="Guardado médio por mês"
        />
        <StatCard
          title="Meses com >60% Taxa"
          value={String(monthsAbove60)}
          colorClass="text-emerald-600"
          subtitle={`de ${computed.length} meses`}
        />
        <StatCard
          title="Maior Categoria de Despesa"
          value={
            biggestExpenseKey
              ? EXPENSE_LABELS[biggestExpenseKey]
              : '—'
          }
          colorClass="text-red-600"
          subtitle={
            biggestExpenseKey
              ? formatCurrency(expenseSumByKey[biggestExpenseKey])
              : ''
          }
        />
        <StatCard
          title="Meses Confirmados"
          value={`${confirmedMonths.length} / ${computed.length}`}
          colorClass="text-emerald-600"
          subtitle="Dados reais vs projecção"
        />
        <StatCard
          title="Saldo Inicial"
          value={formatCurrency(yearConfig.initialBalance)}
          colorClass="text-blue-600"
          subtitle={`Início de ${selectedYear}`}
        />
        <StatCard
          title="Variação de Saldo"
          value={formatCurrency(lastBalance - yearConfig.initialBalance)}
          colorClass={
            lastBalance - yearConfig.initialBalance >= 0
              ? 'text-emerald-600'
              : 'text-red-600'
          }
          subtitle="Saldo final - saldo inicial"
        />
      </div>

      {/* ── Income vs Expenses Bar Chart ─────────────────────────────────── */}
      <SectionHeader title="Receitas vs. Despesas por Mês" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyChartData} barSize={18} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Investimentos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Savings Rate Line ────────────────────────────────────────────── */}
      <SectionHeader title="Taxa de Poupança por Mês" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={savingsRateData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 100]} />
            <Tooltip content={<PctTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line
              type="monotone"
              dataKey="Taxa de Poupança"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#8b5cf6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bank Balance Line ─────────────────────────────────────────────── */}
      <SectionHeader title="Evolução do Saldo Bancário (TOTAL)" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={balanceData}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Area
              type="monotone"
              dataKey="Saldo Bancário"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#balanceGrad)"
              dot={{ r: 4, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Cumulative Savings Area ───────────────────────────────────────── */}
      <SectionHeader title="Poupança Acumulada no Ano (ANO)" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={anoData}>
            <defs>
              <linearGradient id="anoGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Area
              type="monotone"
              dataKey="Guardado"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#anoGrad)"
              dot={{ r: 4, fill: '#8b5cf6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Donut Charts ────────────────────────────────────────────────────── */}
      <SectionHeader title="Distribuição" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChart
          title="Fontes de Rendimento"
          data={incomeSources}
          colors={INCOME_COLORS}
        />
        <DonutChart
          title="Categorias de Despesa"
          data={expenseCategories}
          colors={EXPENSE_COLORS}
        />
        <DonutChart
          title="Alocação de Investimentos"
          data={investmentAllocations}
          colors={SAVINGS_COLORS}
        />
      </div>

      {/* ── Property Income Stacked Bar ──────────────────────────────────── */}
      <SectionHeader title="Rendimentos por Propriedade por Mês" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={propertyData} barSize={28} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="Esposende" stackId="a" fill="#10b981" />
            <Bar dataKey="Felgueiras" stackId="a" fill="#3b82f6" />
            <Bar dataKey="Fradelos" stackId="a" fill="#f59e0b" />
            <Bar dataKey="DocBay" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="Receita" stackId="a" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Expense Breakdown Stacked Bar ───────────────────────────────── */}
      <SectionHeader title="Decomposição de Despesas por Mês" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={expenseBreakdownData} barSize={32} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {[
              { key: 'Prestação', color: '#ef4444' },
              { key: 'Cond/Obras', color: '#f97316' },
              { key: 'Água', color: '#eab308' },
              { key: 'Luz', color: '#84cc16' },
              { key: 'Internet', color: '#10b981' },
              { key: 'Gasóleo', color: '#06b6d4' },
              { key: 'Alimentação', color: '#3b82f6' },
              { key: 'Mecânico', color: '#8b5cf6' },
              { key: 'Netflix', color: '#ec4899' },
              { key: 'Telefone', color: '#14b8a6' },
              { key: 'Gym/Nutri', color: '#f43f5e' },
              { key: 'Saídas', color: '#a855f7' },
              { key: 'Outros', color: '#6366f1' },
            ].map(({ key, color }, i, arr) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="b"
                fill={color}
                radius={i === arr.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Custom Investments Breakdown ─────────────────────────────────── */}
      {hasCustomInvestments && (
        <>
          <SectionHeader title="Investimentos Adicionais por Mês" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mês</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {computed.flatMap(m =>
                    (m.customInvestments || []).map(item => (
                      <tr key={`${m.id}-${item.id}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                          {MONTH_NAMES_PT[m.month - 1]} {m.year}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{item.name || '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-violet-600 whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Confirmed Months Summary Table ──────────────────────────────── */}
      {confirmedMonths.length > 0 && (
        <>
          <SectionHeader title="Resumo — Meses Confirmados" />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[
                      'Mês',
                      'Receita',
                      'G.R.',
                      'G.EX.',
                      'Investimentos',
                      'Cash Out',
                      'Guardado',
                      '(%)',
                      'ANO',
                      'Saldo',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {confirmedMonths.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        {MONTH_NAMES_PT[m.month - 1]} {m.year}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 whitespace-nowrap">
                        {formatCurrency(m.calc.cashIn)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600 whitespace-nowrap">
                        {formatCurrency(m.calc.gastosR)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-500 whitespace-nowrap">
                        {formatCurrency(m.calc.gastosEx)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-violet-600 whitespace-nowrap">
                        {formatCurrency(m.calc.savingsTotal)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600 whitespace-nowrap">
                        {formatCurrency(m.calc.cashOut)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-bold whitespace-nowrap ${
                          m.calc.guardado >= 0 ? 'text-violet-700' : 'text-red-700'
                        }`}
                      >
                        {formatCurrency(m.calc.guardado)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${
                          m.calc.savingsPct >= 50
                            ? 'text-emerald-600'
                            : m.calc.savingsPct >= 30
                            ? 'text-yellow-600'
                            : 'text-red-500'
                        }`}
                      >
                        {formatPct(m.calc.savingsPct)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-violet-600 whitespace-nowrap">
                        {formatCurrency(m.ano)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${
                          m.totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(m.totalBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals */}
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                    <td className="px-4 py-3 text-gray-800 whitespace-nowrap">TOTAL</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 whitespace-nowrap">
                      {formatCurrency(confirmedMonths.reduce((s, m) => s + m.calc.cashIn, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                      {formatCurrency(confirmedMonths.reduce((s, m) => s + m.calc.gastosR, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600 whitespace-nowrap">
                      {formatCurrency(confirmedMonths.reduce((s, m) => s + m.calc.gastosEx, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-violet-700 whitespace-nowrap">
                      {formatCurrency(confirmedMonths.reduce((s, m) => s + m.calc.savingsTotal, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-700 whitespace-nowrap">
                      {formatCurrency(confirmedMonths.reduce((s, m) => s + m.calc.cashOut, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-violet-700 whitespace-nowrap">
                      {formatCurrency(confirmedMonths.reduce((s, m) => s + m.calc.guardado, 0))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600 whitespace-nowrap">
                      {formatPct(
                        confirmedMonths.reduce((s, m) => s + m.calc.savingsPct, 0) /
                          confirmedMonths.length
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-gray-400">—</td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-700 whitespace-nowrap">
                      {formatCurrency(confirmedMonths[confirmedMonths.length - 1]?.totalBalance ?? 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
