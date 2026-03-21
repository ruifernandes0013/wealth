import { useState } from 'react';
import { CheckCircle, Edit2, ChevronDown, Loader2, Circle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calcYearMonths } from '../utils/calculations';
import { formatCurrency, formatPct } from '../utils/format';
import { MONTH_NAMES_PT } from '../types';
import type { MonthEntry, MonthWithCalc } from '../types';
import EditMonthModal from '../components/EditMonthModal';

export default function Monthly() {
  const { getMonthsForYear, getYearConfig, getAvailableYears, updateMonth, loading } = useData();
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingMonth, setEditingMonth] = useState<MonthWithCalc | null>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [editingBalance, setEditingBalance] = useState(false);
  const { updateYearConfig } = useData();

  const months = getMonthsForYear(selectedYear);
  const yearConfig = getYearConfig(selectedYear);
  const computed = calcYearMonths(months, yearConfig.initialBalance);

  const today = new Date();
  const currentMonth = today.getFullYear() === selectedYear ? today.getMonth() + 1 : -1;

  const handleSaveBalance = () => {
    const val = parseFloat(balanceInput.replace(',', '.'));
    if (!isNaN(val)) updateYearConfig({ year: selectedYear, initialBalance: val });
    setEditingBalance(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );

  // Totals
  const totals = computed.reduce((acc, m) => ({
    esposende: acc.esposende + m.income.esposende,
    felgueiras: acc.felgueiras + m.income.felgueiras,
    fradelos: acc.fradelos + m.income.fradelos,
    docbay: acc.docbay + m.income.docbay,
    receita: acc.receita + m.income.receita,
    cashIn: acc.cashIn + m.calc.cashIn,
    cashOut: acc.cashOut + m.calc.cashOut,
    gastosR: acc.gastosR + m.calc.gastosR,
    gastosEx: acc.gastosEx + m.calc.gastosEx,
    saldo: acc.saldo + m.calc.saldo,
    savingsTotal: acc.savingsTotal + m.calc.savingsTotal,
    guardado: acc.guardado + m.calc.guardado,
  }), { esposende:0, felgueiras:0, fradelos:0, docbay:0, receita:0, cashIn:0, cashOut:0, gastosR:0, gastosEx:0, saldo:0, savingsTotal:0, guardado:0 });

  const avgSavingsPct = computed.length > 0
    ? computed.reduce((s, m) => s + m.calc.savingsPct, 0) / computed.length
    : 0;

  const confirmedCount = computed.filter(m => m.confirmed).length;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Cash Flow</h1>
          <p className="text-gray-400 text-sm mt-0.5">Click any row to edit • {confirmedCount}/{computed.length} confirmed</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Year selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Opening balance */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="text-xs text-gray-400">Opening balance:</span>
            {editingBalance ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number" step="0.01" value={balanceInput}
                  onChange={e => setBalanceInput(e.target.value)}
                  className="w-24 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveBalance(); if (e.key === 'Escape') setEditingBalance(false); }}
                />
                <button onClick={handleSaveBalance} className="text-xs text-violet-600 font-semibold hover:text-violet-700">OK</button>
                <button onClick={() => setEditingBalance(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setBalanceInput(String(yearConfig.initialBalance)); setEditingBalance(true); }}
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                {formatCurrency(yearConfig.initialBalance)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────── */}
      <div className="flex items-center gap-5 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Current month</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Projection</span>
      </div>

      {/* ── Table ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              {/* Group header row */}
              <tr>
                <th rowSpan={2} className="sticky left-0 z-20 bg-gray-800 text-white px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-gray-700">
                  MONTH
                </th>
                {/* Income group */}
                <th colSpan={6} className="bg-emerald-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-emerald-700 px-2">
                  INCOME
                </th>
                {/* Outgoing group */}
                <th colSpan={5} className="bg-red-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-red-700 px-2">
                  OUTGOING
                </th>
                {/* Result group */}
                <th colSpan={4} className="bg-violet-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-violet-700 px-2">
                  RESULT
                </th>
                <th rowSpan={2} className="bg-gray-800 text-white text-center px-3 py-2 text-xs border-l border-gray-700">
                  ✓
                </th>
              </tr>
              {/* Column sub-header row */}
              <tr>
                {/* Income sub-cols */}
                <th className="bg-emerald-700/80 text-emerald-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">ESP.</th>
                <th className="bg-emerald-700/80 text-emerald-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">FEL.</th>
                <th className="bg-emerald-700/80 text-emerald-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">FRA.</th>
                <th className="bg-emerald-700/80 text-emerald-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">DOC</th>
                <th className="bg-emerald-700/80 text-emerald-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">OTHER</th>
                <th className="bg-emerald-900 text-emerald-200 px-3 py-2 text-xs font-bold whitespace-nowrap text-right border-l border-emerald-600">CASH IN</th>
                {/* Outgoing sub-cols */}
                <th className="bg-red-700/80 text-red-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right border-l border-red-600">G.REAL</th>
                <th className="bg-red-700/80 text-red-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">G.EX.</th>
                <th className="bg-red-700/80 text-red-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">SALDO</th>
                <th className="bg-red-700/80 text-red-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">INVEST.</th>
                <th className="bg-red-900 text-red-200 px-3 py-2 text-xs font-bold whitespace-nowrap text-right border-l border-red-600">CASH OUT</th>
                {/* Result sub-cols */}
                <th className="bg-violet-700/80 text-violet-100 px-3 py-2 text-xs font-bold whitespace-nowrap text-right border-l border-violet-600">SAVED</th>
                <th className="bg-violet-700/80 text-violet-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">RATE</th>
                <th className="bg-violet-700/80 text-violet-100 px-3 py-2 text-xs font-semibold whitespace-nowrap text-right">YTD</th>
                <th className="bg-violet-900 text-violet-200 px-3 py-2 text-xs font-bold whitespace-nowrap text-right border-l border-violet-600">BALANCE</th>
              </tr>
            </thead>

            <tbody>
              {computed.map((m) => {
                const isCurrent = m.month === currentMonth;
                const isConfirmed = m.confirmed;
                const isProjected = !isConfirmed && !isCurrent;

                const rowBase = isCurrent
                  ? 'bg-sky-50 hover:bg-sky-100/70'
                  : isProjected
                  ? 'bg-gray-50/60 hover:bg-gray-100/60'
                  : 'bg-white hover:bg-gray-50';

                const textMuted = isProjected ? 'text-gray-400' : 'text-gray-600';
                const textMutedSm = isProjected ? 'text-gray-300' : 'text-gray-500';

                return (
                  <tr
                    key={m.id}
                    onClick={() => setEditingMonth(m)}
                    className={`cursor-pointer transition-colors border-b border-gray-100 ${rowBase} group`}
                  >
                    {/* Month cell – sticky */}
                    <td className={`sticky left-0 z-10 px-4 py-3 font-bold whitespace-nowrap shadow-[2px_0_8px_-4px_rgba(0,0,0,0.15)] border-r border-gray-100 ${
                      isCurrent ? 'bg-sky-50' : isProjected ? 'bg-gray-50/60' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />}
                        <span className={`text-sm ${isCurrent ? 'text-sky-700' : isProjected ? 'text-gray-400' : 'text-gray-800'}`}>
                          {MONTH_NAMES_PT[m.month - 1]}
                        </span>
                        <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>

                    {/* Income breakdown */}
                    <td className={`px-3 py-3 text-right tabular-nums text-xs ${textMutedSm} whitespace-nowrap`}>{formatCurrency(m.income.esposende)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums text-xs ${textMutedSm} whitespace-nowrap`}>{formatCurrency(m.income.felgueiras)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums text-xs ${textMutedSm} whitespace-nowrap`}>{formatCurrency(m.income.fradelos)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums text-xs ${textMutedSm} whitespace-nowrap`}>{formatCurrency(m.income.docbay)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums text-xs ${textMutedSm} whitespace-nowrap`}>{formatCurrency(m.income.receita)}</td>

                    {/* CASH IN – highlighted */}
                    <td className={`px-3 py-3 text-right tabular-nums font-bold text-sm border-l border-emerald-100 whitespace-nowrap ${
                      isProjected ? 'text-emerald-300' : 'text-emerald-600'
                    }`}>
                      {formatCurrency(m.calc.cashIn)}
                    </td>

                    {/* Expense breakdown */}
                    <td className={`px-3 py-3 text-right tabular-nums text-xs border-l border-red-50 whitespace-nowrap ${textMuted}`}>{formatCurrency(m.calc.gastosR)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums text-xs whitespace-nowrap ${textMuted}`}>{formatCurrency(m.calc.gastosEx)}</td>
                    <td className={`px-3 py-3 text-right tabular-nums text-xs whitespace-nowrap ${
                      m.calc.saldo > 0 ? (isProjected ? 'text-orange-300' : 'text-orange-500') : textMuted
                    }`}>
                      {m.calc.saldo !== 0 ? formatCurrency(m.calc.saldo) : '—'}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums text-xs whitespace-nowrap ${
                      isProjected ? 'text-violet-300' : 'text-violet-500'
                    }`}>{formatCurrency(m.calc.savingsTotal)}</td>

                    {/* CASH OUT – highlighted */}
                    <td className={`px-3 py-3 text-right tabular-nums font-bold text-sm border-l border-red-100 whitespace-nowrap ${
                      isProjected ? 'text-red-300' : 'text-red-600'
                    }`}>
                      {formatCurrency(m.calc.cashOut)}
                    </td>

                    {/* SAVED */}
                    <td className={`px-3 py-3 text-right tabular-nums font-bold text-sm border-l border-violet-100 whitespace-nowrap ${
                      m.calc.guardado < 0 ? 'text-red-500' : isProjected ? 'text-violet-300' : 'text-violet-600'
                    }`}>
                      {formatCurrency(m.calc.guardado)}
                    </td>

                    {/* RATE – color coded */}
                    <td className={`px-3 py-3 text-right tabular-nums text-xs font-semibold whitespace-nowrap ${
                      isProjected
                        ? 'text-gray-300'
                        : m.calc.savingsPct >= 60 ? 'text-emerald-600'
                        : m.calc.savingsPct >= 40 ? 'text-sky-500'
                        : m.calc.savingsPct >= 20 ? 'text-amber-500'
                        : 'text-red-500'
                    }`}>
                      {formatPct(m.calc.savingsPct)}
                    </td>

                    {/* YTD */}
                    <td className={`px-3 py-3 text-right tabular-nums text-xs whitespace-nowrap ${
                      isProjected ? 'text-violet-300' : 'text-violet-500'
                    }`}>
                      {formatCurrency(m.ano)}
                    </td>

                    {/* BALANCE – highlighted */}
                    <td className={`px-3 py-3 text-right tabular-nums font-bold text-sm border-l border-violet-100 whitespace-nowrap ${
                      m.totalBalance < 0 ? 'text-red-500' : isProjected ? 'text-blue-300' : 'text-blue-600'
                    }`}>
                      {formatCurrency(m.totalBalance)}
                    </td>

                    {/* Confirmed */}
                    <td className="px-3 py-3 text-center border-l border-gray-100 whitespace-nowrap">
                      {m.confirmed
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <Circle className="w-4 h-4 text-gray-200 mx-auto" />
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals */}
            {computed.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-900 text-white font-bold">
                  <td className="sticky left-0 z-10 bg-gray-900 px-4 py-3 text-xs uppercase tracking-wider shadow-[2px_0_8px_-4px_rgba(0,0,0,0.4)]">TOTAL</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300">{formatCurrency(totals.esposende)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300">{formatCurrency(totals.felgueiras)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300">{formatCurrency(totals.fradelos)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300">{formatCurrency(totals.docbay)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300">{formatCurrency(totals.receita)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm text-emerald-300 border-l border-gray-700">{formatCurrency(totals.cashIn)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300 border-l border-gray-700">{formatCurrency(totals.gastosR)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300">{formatCurrency(totals.gastosEx)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-orange-300">{formatCurrency(totals.saldo)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-violet-300">{formatCurrency(totals.savingsTotal)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm text-red-300 border-l border-gray-700">{formatCurrency(totals.cashOut)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm text-violet-300 border-l border-gray-700">{formatCurrency(totals.guardado)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-300">{formatPct(avgSavingsPct)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-xs text-gray-400">—</td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm text-blue-300 border-l border-gray-700">
                    {formatCurrency(computed[computed.length - 1]?.totalBalance ?? 0)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-gray-400 border-l border-gray-700">
                    {confirmedCount}/{computed.length}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMonth && (
        <EditMonthModal
          month={editingMonth}
          onSave={(updated: MonthEntry) => { updateMonth(updated); setEditingMonth(null); }}
          onClose={() => setEditingMonth(null)}
        />
      )}
    </div>
  );
}
