import { useState, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Check } from 'lucide-react';
import type {
  MonthEntry,
  IncomeData,
  ExpenseData,
  SavingsAllocation,
} from '../types';
import {
  INCOME_LABELS,
  EXPENSE_LABELS,
  SAVINGS_LABELS,
  MONTH_NAMES_FULL_PT,
} from '../types';

interface EditMonthModalProps {
  month: MonthEntry;
  onSave: (updated: MonthEntry) => void;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-700 text-sm">{title}</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

function NumField({ label, value, onChange }: FieldProps) {
  const [localVal, setLocalVal] = useState(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalVal(e.target.value);
    const n = parseFloat(e.target.value.replace(',', '.'));
    if (!isNaN(n)) onChange(n);
  };

  const handleBlur = () => {
    const n = parseFloat(localVal.replace(',', '.'));
    if (isNaN(n)) {
      setLocalVal('0');
      onChange(0);
    } else {
      setLocalVal(String(n));
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          €
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={localVal}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
        />
      </div>
    </div>
  );
}

export default function EditMonthModal({
  month,
  onSave,
  onClose,
}: EditMonthModalProps) {
  const [income, setIncome] = useState<IncomeData>({ ...month.income });
  const [expenses, setExpenses] = useState<ExpenseData>({ ...month.expenses });
  const [extraExpenses, setExtraExpenses] = useState(month.extraExpenses);
  const [savings, setSavings] = useState<SavingsAllocation>({ ...month.savings });
  const [confirmed, setConfirmed] = useState(month.confirmed);

  const updateIncome = useCallback(
    (key: keyof IncomeData, val: number) =>
      setIncome((prev) => ({ ...prev, [key]: val })),
    []
  );

  const updateExpense = useCallback(
    (key: keyof ExpenseData, val: number) =>
      setExpenses((prev) => ({ ...prev, [key]: val })),
    []
  );

  const updateSavings = useCallback(
    (key: keyof SavingsAllocation, val: number) =>
      setSavings((prev) => ({ ...prev, [key]: val })),
    []
  );

  const handleSave = () => {
    onSave({
      ...month,
      income,
      expenses,
      extraExpenses,
      savings,
      confirmed,
    });
    onClose();
  };

  const monthName = MONTH_NAMES_FULL_PT[month.month - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Editar {monthName} {month.year}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Atualize os valores do mês
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
          {/* Income Section */}
          <Section title="Rendimento" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(INCOME_LABELS) as (keyof IncomeData)[]).map((key) => (
                <NumField
                  key={key}
                  label={INCOME_LABELS[key]}
                  value={income[key]}
                  onChange={(v) => updateIncome(key, v)}
                />
              ))}
            </div>
          </Section>

          {/* Expenses Section */}
          <Section title="Despesas" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(EXPENSE_LABELS) as (keyof ExpenseData)[]).map((key) => (
                <NumField
                  key={key}
                  label={EXPENSE_LABELS[key]}
                  value={expenses[key]}
                  onChange={(v) => updateExpense(key, v)}
                />
              ))}
              <div className="col-span-2">
                <NumField
                  label="Gastos Extra (G.EX - G.R)"
                  value={extraExpenses}
                  onChange={setExtraExpenses}
                />
              </div>
            </div>
          </Section>

          {/* Savings Section */}
          <Section title="Poupanças" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(SAVINGS_LABELS) as (keyof SavingsAllocation)[]).map((key) => (
                <NumField
                  key={key}
                  label={SAVINGS_LABELS[key]}
                  value={savings[key]}
                  onChange={(v) => updateSavings(key, v)}
                />
              ))}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          {/* Confirmed toggle */}
          <button
            type="button"
            onClick={() => setConfirmed((c) => !c)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              confirmed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                confirmed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-gray-300'
              }`}
            >
              {confirmed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            Confirmado
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
