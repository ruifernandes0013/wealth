import { useState } from 'react';
import { CheckCircle, Edit2, ChevronDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calcYearMonths } from '../utils/calculations';
import { formatCurrency, formatPct } from '../utils/format';
import { MONTH_NAMES_PT } from '../types';
import type { MonthEntry } from '../types';
import EditMonthModal from '../components/EditMonthModal';

export default function Monthly() {
  const {
    getMonthsForYear,
    getYearConfig,
    getAvailableYears,
    updateMonth,
    updateYearConfig,
  } = useData();

  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? 2026);
  const [editingMonth, setEditingMonth] = useState<MonthEntry | null>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [editingBalance, setEditingBalance] = useState(false);

  const months = getMonthsForYear(selectedYear);
  const yearConfig = getYearConfig(selectedYear);
  const computed = calcYearMonths(months, yearConfig.initialBalance);

  const today = new Date();
  const currentMonth =
    today.getFullYear() === selectedYear ? today.getMonth() + 1 : -1;

  const handleSaveBalance = () => {
    const val = parseFloat(balanceInput.replace(',', '.'));
    if (!isNaN(val)) {
      updateYearConfig({ year: selectedYear, initialBalance: val });
    }
    setEditingBalance(false);
  };

  const cols = [
    { key: 'mes', label: 'MÊS', sticky: true },
    { key: 'esposende', label: 'ESPOSENDE' },
    { key: 'felgueiras', label: 'FELGUEIRAS' },
    { key: 'fradelos', label: 'FRADELOS' },
    { key: 'docbay', label: 'DOCBAY' },
    { key: 'receita', label: 'RECEITA' },
    { key: 'cashIn', label: 'CASH IN' },
    { key: 'cashOut', label: 'CASH OUT' },
    { key: 'gastosEx', label: 'G.EX.' },
    { key: 'gastosR', label: 'G.R.' },
    { key: 'extras', label: 'EXTRAS' },
    { key: 'guardado', label: 'GUARDADO' },
    { key: 'pct', label: '(%)' },
    { key: 'ano', label: 'ANO' },
    { key: 'total', label: 'TOTAL' },
    { key: 'confirmed', label: '✅' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly</h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumo mensal completo – clique numa linha para editar
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          {/* Initial Balance */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="text-xs text-gray-500">Saldo inicial:</span>
            {editingBalance ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-24 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBalance();
                    if (e.key === 'Escape') setEditingBalance(false);
                  }}
                />
                <button
                  onClick={handleSaveBalance}
                  className="text-xs text-violet-600 font-medium hover:text-violet-700"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setBalanceInput(String(yearConfig.initialBalance));
                  setEditingBalance(true);
                }}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                {formatCurrency(yearConfig.initialBalance)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white border border-gray-300 inline-block" />
          Confirmado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 inline-block" />
          Mês actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200 inline-block" />
          Projecção
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {cols.map((col) => (
                  <th
                    key={col.key}
                    className={`px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                      col.sticky
                        ? 'sticky left-0 z-10 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]'
                        : ''
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {computed.map((m) => {
                const isCurrent = m.month === currentMonth;
                const isConfirmed = m.confirmed;
                const rowBg = isCurrent
                  ? 'bg-blue-50 hover:bg-blue-100'
                  : isConfirmed
                  ? 'bg-white hover:bg-gray-50'
                  : 'bg-gray-50/60 hover:bg-gray-100/60';

                return (
                  <tr
                    key={m.id}
                    className={`cursor-pointer transition-colors ${rowBg}`}
                    onClick={() => setEditingMonth(m)}
                  >
                    {/* MÊS - sticky */}
                    <td
                      className={`px-3 py-3 font-bold text-gray-800 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] whitespace-nowrap ${
                        isCurrent
                          ? 'bg-blue-50'
                          : isConfirmed
                          ? 'bg-white'
                          : 'bg-gray-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Edit2 className="w-3 h-3 text-gray-300" />
                        {MONTH_NAMES_PT[m.month - 1]}
                      </div>
                    </td>

                    {/* Income columns */}
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                      {formatCurrency(m.income.esposende)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                      {formatCurrency(m.income.felgueiras)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                      {formatCurrency(m.income.fradelos)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                      {formatCurrency(m.income.docbay)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                      {formatCurrency(m.income.receita)}
                    </td>

                    {/* Computed columns */}
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-emerald-600 whitespace-nowrap">
                      {formatCurrency(m.calc.cashIn)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-red-600 whitespace-nowrap">
                      {formatCurrency(m.calc.cashOut)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-red-500 whitespace-nowrap">
                      {formatCurrency(m.calc.gastosEx)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-gray-600 whitespace-nowrap">
                      {formatCurrency(m.calc.gastosR)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-orange-500 whitespace-nowrap">
                      {formatCurrency(m.extraExpenses)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right tabular-nums font-bold whitespace-nowrap ${
                        m.calc.guardado >= 0 ? 'text-violet-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(m.calc.guardado)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right tabular-nums whitespace-nowrap ${
                        m.calc.savingsPct >= 50
                          ? 'text-emerald-600'
                          : m.calc.savingsPct >= 30
                          ? 'text-yellow-600'
                          : 'text-red-500'
                      }`}
                    >
                      {formatPct(m.calc.savingsPct)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-violet-600 whitespace-nowrap">
                      {formatCurrency(m.ano)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${
                        m.totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(m.totalBalance)}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {m.confirmed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="w-4 h-4 border border-gray-300 rounded-full inline-block" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals row */}
            {computed.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                  <td className="px-3 py-3 sticky left-0 z-10 bg-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] text-gray-800 whitespace-nowrap">
                    TOTAL
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.income.esposende, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.income.felgueiras, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.income.fradelos, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.income.docbay, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.income.receita, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.calc.cashIn, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-red-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.calc.cashOut, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-red-600 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.calc.gastosEx, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.calc.gastosR, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-orange-600 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.extraExpenses, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-violet-700 whitespace-nowrap">
                    {formatCurrency(
                      computed.reduce((s, m) => s + m.calc.guardado, 0)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-600 whitespace-nowrap">
                    {formatPct(
                      computed.reduce((s, m) => s + m.calc.savingsPct, 0) /
                        computed.length
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-gray-500 whitespace-nowrap">—</td>
                  <td className="px-3 py-3 text-right tabular-nums text-blue-700 whitespace-nowrap">
                    {formatCurrency(
                      computed[computed.length - 1]?.totalBalance ?? 0
                    )}
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className="text-xs text-gray-500">
                      {computed.filter((m) => m.confirmed).length}/
                      {computed.length}
                    </span>
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
          onSave={updateMonth}
          onClose={() => setEditingMonth(null)}
        />
      )}
    </div>
  );
}
