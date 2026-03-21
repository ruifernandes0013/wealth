import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Landmark,
  ChevronDown,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { calcYearMonths } from '../utils/calculations';
import { formatCurrency, formatPct } from '../utils/format';
import StatCard from '../components/StatCard';
import { MONTH_NAMES_PT } from '../types';

export default function Dashboard() {
  const { getMonthsForYear, getYearConfig, getAvailableYears } = useData();
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? 2026);

  const months = getMonthsForYear(selectedYear);
  const yearConfig = getYearConfig(selectedYear);
  const computed = calcYearMonths(months, yearConfig.initialBalance);

  // YTD sums
  const totalIncome = computed.reduce((s, m) => s + m.calc.cashIn, 0);
  const totalExpenses = computed.reduce((s, m) => s + m.calc.gastosEx, 0);
  const totalSaved = computed.reduce((s, m) => s + m.calc.guardado, 0);
  const avgSavingsRate =
    computed.length > 0
      ? computed.reduce((s, m) => s + m.calc.savingsPct, 0) / computed.length
      : 0;
  const lastBalance =
    computed.length > 0
      ? computed[computed.length - 1].totalBalance
      : yearConfig.initialBalance;

  // Chart data
  const chartData = computed.map((m) => ({
    name: MONTH_NAMES_PT[m.month - 1],
    Receitas: parseFloat(m.calc.cashIn.toFixed(2)),
    Despesas: parseFloat(m.calc.gastosEx.toFixed(2)),
  }));

  // Current month (today)
  const today = new Date();
  const currentMonth = today.getFullYear() === selectedYear ? today.getMonth() + 1 : -1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Visão geral das finanças do ano
          </p>
        </div>

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
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Receitas (YTD)"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          colorClass="text-emerald-600"
          subtitle="Soma de todos os rendimentos"
        />
        <StatCard
          title="Total Despesas (YTD)"
          value={formatCurrency(totalExpenses)}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          colorClass="text-red-600"
          subtitle="Gastos efectivos totais"
        />
        <StatCard
          title="Total Guardado (YTD)"
          value={formatCurrency(totalSaved)}
          icon={<PiggyBank className="w-5 h-5 text-violet-600" />}
          colorClass="text-violet-600"
          subtitle="Receita menos despesas"
        />
        <StatCard
          title="Taxa de Poupança"
          value={formatPct(avgSavingsRate)}
          icon={<Percent className="w-5 h-5 text-blue-500" />}
          colorClass="text-blue-600"
          subtitle="Média mensal"
        />
        <StatCard
          title="Saldo Bancário"
          value={formatCurrency(lastBalance)}
          icon={<Landmark className="w-5 h-5 text-blue-600" />}
          colorClass={lastBalance >= 0 ? 'text-blue-600' : 'text-red-600'}
          subtitle={`Saldo inicial: ${formatCurrency(yearConfig.initialBalance)}`}
        />
      </div>

      {/* Charts row */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Receitas vs. Despesas Mensais
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barSize={22} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`}
            />
            <Tooltip
              formatter={(val: number) => formatCurrency(val)}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: 13,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
            />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Progresso Mensal {selectedYear}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
          {Array.from({ length: 12 }, (_, i) => {
            const m = computed.find((x) => x.month === i + 1);
            const isCurrent = i + 1 === currentMonth;
            const isConfirmed = m?.confirmed ?? false;
            const guardado = m?.calc.guardado ?? 0;
            const pct = m?.calc.savingsPct ?? 0;

            return (
              <div
                key={i}
                className={`rounded-xl p-3 border flex flex-col gap-1 transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-300'
                    : isConfirmed
                    ? 'bg-white border-gray-200'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">
                    {MONTH_NAMES_PT[i]}
                  </span>
                  {isConfirmed && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <p
                  className={`text-xs font-semibold leading-tight ${
                    guardado >= 0 ? 'text-violet-600' : 'text-red-500'
                  }`}
                >
                  {m ? formatCurrency(guardado) : '—'}
                </p>
                <p className="text-xs text-gray-400">
                  {m ? formatPct(pct) : '—'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
