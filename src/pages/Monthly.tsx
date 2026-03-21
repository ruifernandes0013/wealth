import { useState } from 'react';
import { CheckCircle, Edit2, ChevronDown, Loader2, Circle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calcYearMonths } from '../utils/calculations';
import { formatCurrency, formatPct } from '../utils/format';
import { MONTH_NAMES_PT, EXPENSE_LABELS, SAVINGS_LABELS } from '../types';
import type { MonthWithCalc, ExpenseData, SavingsAllocation } from '../types';
import EditMonthModal from '../components/EditMonthModal';

// ── Sub-section header ────────────────────────────────────────────────────────
function TableHeader({ title, color }: { title: string; color: 'red' | 'violet' | 'emerald' }) {
  const colors = {
    red: 'text-red-700 border-red-200',
    violet: 'text-violet-700 border-violet-200',
    emerald: 'text-emerald-700 border-emerald-200',
  };
  return (
    <div className="flex items-center gap-3 mt-2">
      <h2 className={`text-sm font-bold uppercase tracking-wider ${colors[color].split(' ')[0]}`}>{title}</h2>
      <div className={`flex-1 h-px border-t ${colors[color].split(' ')[1]}`} />
    </div>
  );
}

export default function Monthly() {
  const { getMonthsForYear, getYearConfig, getAvailableYears, updateMonth, updateYearConfig, loading } = useData();
  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingMonth, setEditingMonth] = useState<MonthWithCalc | null>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [editingBalance, setEditingBalance] = useState(false);

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

  const confirmedCount = computed.filter(m => m.confirmed).length;

  // ── Dynamic columns ────────────────────────────────────────────────────────
  const allCustomIncomeNames = Array.from(new Set(
    computed.flatMap(m => (m.customIncome || []).map(i => i.name).filter(Boolean))
  ));
  const fixedExpCols = Object.keys(EXPENSE_LABELS) as (keyof ExpenseData)[];
  const customExpNames = Array.from(new Set(
    computed.flatMap(m => (m.customExpenses || []).map(i => i.name).filter(Boolean))
  ));
  const fixedInvCols = Object.keys(SAVINGS_LABELS) as (keyof SavingsAllocation)[];
  const customInvNames = Array.from(new Set(
    computed.flatMap(m => (m.customInvestments || []).map(i => i.name).filter(Boolean))
  ));

  // ── Totals ────────────────────────────────────────────────────────────────
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

  const customIncomeTotals: Record<string, number> = {};
  allCustomIncomeNames.forEach(name => {
    customIncomeTotals[name] = computed.reduce((s, m) =>
      s + (m.customIncome || []).filter(i => i.name === name).reduce((a, i) => a + i.amount, 0), 0
    );
  });

  const avgSavingsPct = computed.length > 0
    ? computed.reduce((s, m) => s + m.calc.savingsPct, 0) / computed.length : 0;

  const incomeGroupColspan = 6 + allCustomIncomeNames.length; // 5 fixed + customs + CASH IN

  // ── Row style helpers ─────────────────────────────────────────────────────
  const rowStyle = (m: MonthWithCalc) => {
    const isCurrent = m.month === currentMonth;
    const isProjected = !m.confirmed && !isCurrent;
    if (isCurrent) return { row: 'bg-sky-50 hover:bg-sky-100/70', sticky: 'bg-sky-50', text: 'text-sky-700', muted: 'text-sky-600/60', projected: false };
    if (isProjected) return { row: 'bg-gray-50/60 hover:bg-gray-100/60', sticky: 'bg-gray-50/60', text: 'text-gray-400', muted: 'text-gray-300', projected: true };
    return { row: 'bg-white hover:bg-gray-50', sticky: 'bg-white', text: 'text-gray-800', muted: 'text-gray-500', projected: false };
  };

  const thBase = 'px-3 py-2 text-xs font-semibold whitespace-nowrap text-right';
  const tdBase = 'px-3 py-3 text-right tabular-nums whitespace-nowrap';

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Cash Flow</h1>
          <p className="text-gray-400 text-sm mt-0.5">Click any row to edit · {confirmedCount}/{computed.length} confirmed</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="text-xs text-gray-400">Opening balance:</span>
            {editingBalance ? (
              <div className="flex items-center gap-1.5">
                <input type="number" step="0.01" value={balanceInput}
                  onChange={e => setBalanceInput(e.target.value)}
                  className="w-24 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  autoFocus
                  onKeyDown={e => { if (e.key==='Enter') handleSaveBalance(); if (e.key==='Escape') setEditingBalance(false); }} />
                <button onClick={handleSaveBalance} className="text-xs text-violet-600 font-semibold">OK</button>
                <button onClick={() => setEditingBalance(false)} className="text-xs text-gray-400">✕</button>
              </div>
            ) : (
              <button onClick={() => { setBalanceInput(String(yearConfig.initialBalance)); setEditingBalance(true); }}
                className="text-sm font-bold text-blue-600 hover:underline">
                {formatCurrency(yearConfig.initialBalance)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────── */}
      <div className="flex items-center gap-5 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Current month</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" /> Projection</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CASHFLOW TABLE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              {/* Group header row */}
              <tr>
                <th rowSpan={2} className="sticky left-0 z-20 bg-gray-900 text-white px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-gray-700 align-middle">
                  MONTH
                </th>
                <th colSpan={incomeGroupColspan} className="bg-emerald-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-emerald-700">
                  INCOME
                </th>
                <th colSpan={5} className="bg-red-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-red-700">
                  OUTGOING
                </th>
                <th colSpan={4} className="bg-violet-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-violet-700">
                  RESULT
                </th>
                <th rowSpan={2} className="bg-gray-800 text-white text-center px-3 py-2 text-xs border-l border-gray-700 align-middle">
                  ✓
                </th>
              </tr>
              {/* Column sub-headers */}
              <tr>
                {/* Fixed income */}
                <th className={`${thBase} bg-emerald-700/80 text-emerald-100`}>ESP.</th>
                <th className={`${thBase} bg-emerald-700/80 text-emerald-100`}>FEL.</th>
                <th className={`${thBase} bg-emerald-700/80 text-emerald-100`}>FRA.</th>
                <th className={`${thBase} bg-emerald-700/80 text-emerald-100`}>DOC</th>
                <th className={`${thBase} bg-emerald-700/80 text-emerald-100`}>OTHER</th>
                {/* Custom income columns */}
                {allCustomIncomeNames.map(name => (
                  <th key={name} className={`${thBase} bg-emerald-700/80 text-emerald-100`}>{name.toUpperCase()}</th>
                ))}
                <th className={`${thBase} bg-emerald-900 text-emerald-200 border-l border-emerald-600 font-bold`}>CASH IN</th>
                {/* Outgoing */}
                <th className={`${thBase} bg-red-700/80 text-red-100 border-l border-red-600`}>G.REAL</th>
                <th className={`${thBase} bg-red-700/80 text-red-100`}>G.EX.</th>
                <th className={`${thBase} bg-red-700/80 text-red-100`}>SALDO</th>
                <th className={`${thBase} bg-red-700/80 text-red-100`}>INVEST/HOL.</th>
                <th className={`${thBase} bg-red-900 text-red-200 border-l border-red-600 font-bold`}>CASH OUT</th>
                {/* Result */}
                <th className={`${thBase} bg-violet-700/80 text-violet-100 border-l border-violet-600 font-bold`}>SAVED</th>
                <th className={`${thBase} bg-violet-700/80 text-violet-100`}>RATE</th>
                <th className={`${thBase} bg-violet-700/80 text-violet-100`}>YTD</th>
                <th className={`${thBase} bg-violet-900 text-violet-200 border-l border-violet-600 font-bold`}>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {computed.map(m => {
                const s = rowStyle(m);
                const isCurrent = m.month === currentMonth;
                return (
                  <tr key={m.id} onClick={() => setEditingMonth(m)}
                    className={`cursor-pointer transition-colors border-b border-gray-100 ${s.row} group`}>
                    {/* Month */}
                    <td className={`sticky left-0 z-10 px-4 py-3 font-bold whitespace-nowrap shadow-[2px_0_8px_-4px_rgba(0,0,0,0.12)] border-r border-gray-100 ${s.sticky}`}>
                      <div className="flex items-center gap-2">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse flex-shrink-0" />}
                        <span className={`text-sm ${s.text}`}>{MONTH_NAMES_PT[m.month - 1]}</span>
                        <Edit2 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    {/* Fixed income */}
                    <td className={`${tdBase} text-xs ${s.muted}`}>{formatCurrency(m.income.esposende)}</td>
                    <td className={`${tdBase} text-xs ${s.muted}`}>{formatCurrency(m.income.felgueiras)}</td>
                    <td className={`${tdBase} text-xs ${s.muted}`}>{formatCurrency(m.income.fradelos)}</td>
                    <td className={`${tdBase} text-xs ${s.muted}`}>{formatCurrency(m.income.docbay)}</td>
                    <td className={`${tdBase} text-xs ${s.muted}`}>{formatCurrency(m.income.receita)}</td>
                    {/* Custom income */}
                    {allCustomIncomeNames.map(name => (
                      <td key={name} className={`${tdBase} text-xs ${s.muted}`}>
                        {formatCurrency((m.customIncome || []).filter(i => i.name === name).reduce((a, i) => a + i.amount, 0))}
                      </td>
                    ))}
                    {/* CASH IN */}
                    <td className={`${tdBase} font-bold text-sm border-l border-emerald-100 ${s.projected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                      {formatCurrency(m.calc.cashIn)}
                    </td>
                    {/* Expenses */}
                    <td className={`${tdBase} text-xs border-l border-red-50 ${s.projected ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(m.calc.gastosR)}</td>
                    <td className={`${tdBase} text-xs ${s.projected ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(m.calc.gastosEx)}</td>
                    <td className={`${tdBase} text-xs ${m.calc.saldo > 0 ? (s.projected ? 'text-orange-300' : 'text-orange-500') : (s.projected ? 'text-gray-300' : 'text-gray-400')}`}>
                      {m.calc.saldo !== 0 ? formatCurrency(m.calc.saldo) : '—'}
                    </td>
                    <td className={`${tdBase} text-xs ${s.projected ? 'text-violet-300' : 'text-violet-500'}`}>{formatCurrency(m.calc.savingsTotal)}</td>
                    {/* CASH OUT */}
                    <td className={`${tdBase} font-bold text-sm border-l border-red-100 ${s.projected ? 'text-red-300' : 'text-red-600'}`}>
                      {formatCurrency(m.calc.cashOut)}
                    </td>
                    {/* SAVED */}
                    <td className={`${tdBase} font-bold text-sm border-l border-violet-100 ${m.calc.guardado < 0 ? 'text-red-500' : s.projected ? 'text-violet-300' : 'text-violet-600'}`}>
                      {formatCurrency(m.calc.guardado)}
                    </td>
                    {/* RATE */}
                    <td className={`${tdBase} text-xs font-semibold ${
                      s.projected ? 'text-gray-300'
                        : m.calc.savingsPct >= 60 ? 'text-emerald-600'
                        : m.calc.savingsPct >= 40 ? 'text-sky-500'
                        : m.calc.savingsPct >= 20 ? 'text-amber-500'
                        : 'text-red-500'
                    }`}>{formatPct(m.calc.savingsPct)}</td>
                    {/* YTD */}
                    <td className={`${tdBase} text-xs ${s.projected ? 'text-violet-300' : 'text-violet-500'}`}>{formatCurrency(m.ano)}</td>
                    {/* BALANCE */}
                    <td className={`${tdBase} font-bold text-sm border-l border-violet-100 ${m.totalBalance < 0 ? 'text-red-500' : s.projected ? 'text-blue-300' : 'text-blue-600'}`}>
                      {formatCurrency(m.totalBalance)}
                    </td>
                    {/* Confirmed */}
                    <td className="px-3 py-3 text-center border-l border-gray-100 whitespace-nowrap">
                      {m.confirmed
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <Circle className="w-4 h-4 text-gray-200 mx-auto" />}
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
                  <td className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(totals.esposende)}</td>
                  <td className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(totals.felgueiras)}</td>
                  <td className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(totals.fradelos)}</td>
                  <td className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(totals.docbay)}</td>
                  <td className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(totals.receita)}</td>
                  {allCustomIncomeNames.map(name => (
                    <td key={name} className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(customIncomeTotals[name] || 0)}</td>
                  ))}
                  <td className={`${tdBase} text-sm text-emerald-300 border-l border-gray-700`}>{formatCurrency(totals.cashIn)}</td>
                  <td className={`${tdBase} text-xs text-gray-300 border-l border-gray-700`}>{formatCurrency(totals.gastosR)}</td>
                  <td className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(totals.gastosEx)}</td>
                  <td className={`${tdBase} text-xs text-orange-300`}>{formatCurrency(totals.saldo)}</td>
                  <td className={`${tdBase} text-xs text-violet-300`}>{formatCurrency(totals.savingsTotal)}</td>
                  <td className={`${tdBase} text-sm text-red-300 border-l border-gray-700`}>{formatCurrency(totals.cashOut)}</td>
                  <td className={`${tdBase} text-sm text-violet-300 border-l border-gray-700`}>{formatCurrency(totals.guardado)}</td>
                  <td className={`${tdBase} text-xs text-gray-300`}>{formatPct(avgSavingsPct)}</td>
                  <td className={`${tdBase} text-xs text-gray-400`}>—</td>
                  <td className={`${tdBase} text-sm text-blue-300 border-l border-gray-700`}>{formatCurrency(computed[computed.length-1]?.totalBalance ?? 0)}</td>
                  <td className="px-3 py-3 text-center text-xs text-gray-400 border-l border-gray-700">{confirmedCount}/{computed.length}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          EXPENSES BREAKDOWN TABLE
      ═══════════════════════════════════════════════════════════════════ */}
      <TableHeader title="Expenses Breakdown" color="red" />
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="sticky left-0 z-10 bg-red-600 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-red-500">MONTH</th>
                {fixedExpCols.map(k => (
                  <th key={k} className="px-3 py-2.5 text-right text-xs font-semibold whitespace-nowrap">{EXPENSE_LABELS[k]}</th>
                ))}
                {customExpNames.map(name => (
                  <th key={name} className="px-3 py-2.5 text-right text-xs font-semibold whitespace-nowrap">{name}</th>
                ))}
                <th className="px-3 py-2.5 text-right text-xs font-bold whitespace-nowrap border-l border-red-500">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((m, idx) => {
                const isProjected = !m.confirmed && m.month !== currentMonth;
                const hidden = new Set(m.hiddenFields || []);
                const rowTotal = m.calc.gastosR;
                return (
                  <tr key={m.id} className={`border-b border-red-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30'} hover:bg-red-50/60`}>
                    <td className={`sticky left-0 z-10 px-4 py-2.5 font-semibold text-xs whitespace-nowrap border-r border-red-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30'} ${isProjected ? 'text-gray-400' : 'text-gray-700'}`}>
                      {MONTH_NAMES_PT[m.month - 1]}
                    </td>
                    {fixedExpCols.map(k => (
                      <td key={k} className={`px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap ${hidden.has(k) ? 'text-gray-200' : isProjected ? 'text-gray-400' : (m.expenses[k] > 0 ? 'text-red-600' : 'text-gray-300')}`}>
                        {hidden.has(k) ? '—' : formatCurrency(m.expenses[k])}
                      </td>
                    ))}
                    {customExpNames.map(name => {
                      const val = (m.customExpenses || []).filter(i => i.name === name).reduce((a, i) => a + i.amount, 0);
                      return (
                        <td key={name} className={`px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap ${isProjected ? 'text-gray-400' : val > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                          {formatCurrency(val)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2.5 text-right tabular-nums text-xs font-bold whitespace-nowrap border-l border-red-100 ${isProjected ? 'text-red-300' : 'text-red-700'}`}>
                      {formatCurrency(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-red-700 text-white font-bold border-t-2 border-red-400">
                <td className="sticky left-0 z-10 bg-red-700 px-4 py-2.5 text-xs uppercase tracking-wider border-r border-red-500">TOTAL</td>
                {fixedExpCols.map(k => (
                  <td key={k} className="px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap">
                    {formatCurrency(computed.reduce((s, m) => s + (new Set(m.hiddenFields||[]).has(k) ? 0 : m.expenses[k]), 0))}
                  </td>
                ))}
                {customExpNames.map(name => (
                  <td key={name} className="px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap">
                    {formatCurrency(computed.reduce((s, m) => s + (m.customExpenses||[]).filter(i=>i.name===name).reduce((a,i)=>a+i.amount,0), 0))}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap border-l border-red-500">
                  {formatCurrency(computed.reduce((s, m) => s + m.calc.gastosR, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INVESTMENTS & HOLIDAYS BREAKDOWN TABLE
      ═══════════════════════════════════════════════════════════════════ */}
      <TableHeader title="Investments & Holidays Breakdown" color="violet" />
      <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-violet-600 text-white">
                <th className="sticky left-0 z-10 bg-violet-600 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-violet-500">MONTH</th>
                {fixedInvCols.map(k => (
                  <th key={k} className="px-3 py-2.5 text-right text-xs font-semibold whitespace-nowrap">{SAVINGS_LABELS[k]}</th>
                ))}
                {customInvNames.map(name => (
                  <th key={name} className="px-3 py-2.5 text-right text-xs font-semibold whitespace-nowrap">{name}</th>
                ))}
                <th className="px-3 py-2.5 text-right text-xs font-bold whitespace-nowrap border-l border-violet-500">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {computed.map((m, idx) => {
                const isProjected = !m.confirmed && m.month !== currentMonth;
                const hidden = new Set(m.hiddenFields || []);
                const rowTotal = m.calc.savingsTotal;
                return (
                  <tr key={m.id} className={`border-b border-violet-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'} hover:bg-violet-50/60`}>
                    <td className={`sticky left-0 z-10 px-4 py-2.5 font-semibold text-xs whitespace-nowrap border-r border-violet-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'} ${isProjected ? 'text-gray-400' : 'text-gray-700'}`}>
                      {MONTH_NAMES_PT[m.month - 1]}
                    </td>
                    {fixedInvCols.map(k => (
                      <td key={k} className={`px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap ${hidden.has(k) ? 'text-gray-200' : isProjected ? 'text-gray-400' : (m.savings[k] > 0 ? 'text-violet-600' : 'text-gray-300')}`}>
                        {hidden.has(k) ? '—' : formatCurrency(m.savings[k])}
                      </td>
                    ))}
                    {customInvNames.map(name => {
                      const val = (m.customInvestments || []).filter(i => i.name === name).reduce((a, i) => a + i.amount, 0);
                      return (
                        <td key={name} className={`px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap ${isProjected ? 'text-gray-400' : val > 0 ? 'text-violet-600' : 'text-gray-300'}`}>
                          {formatCurrency(val)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2.5 text-right tabular-nums text-xs font-bold whitespace-nowrap border-l border-violet-100 ${isProjected ? 'text-violet-300' : 'text-violet-700'}`}>
                      {formatCurrency(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-violet-700 text-white font-bold border-t-2 border-violet-400">
                <td className="sticky left-0 z-10 bg-violet-700 px-4 py-2.5 text-xs uppercase tracking-wider border-r border-violet-500">TOTAL</td>
                {fixedInvCols.map(k => (
                  <td key={k} className="px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap">
                    {formatCurrency(computed.reduce((s, m) => s + (new Set(m.hiddenFields||[]).has(k) ? 0 : m.savings[k]), 0))}
                  </td>
                ))}
                {customInvNames.map(name => (
                  <td key={name} className="px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap">
                    {formatCurrency(computed.reduce((s, m) => s + (m.customInvestments||[]).filter(i=>i.name===name).reduce((a,i)=>a+i.amount,0), 0))}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right tabular-nums text-xs whitespace-nowrap border-l border-violet-500">
                  {formatCurrency(computed.reduce((s, m) => s + m.calc.savingsTotal, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingMonth && (
        <EditMonthModal
          month={editingMonth}
          onSave={updated => { updateMonth(updated); setEditingMonth(null); }}
          onClose={() => setEditingMonth(null)}
        />
      )}
    </div>
  );
}
