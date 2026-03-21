import { useState, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Check, Plus, Trash2, RotateCcw } from 'lucide-react';
import type { MonthEntry, IncomeData, ExpenseData, SavingsAllocation, CustomItem } from '../types';
import { INCOME_LABELS, EXPENSE_LABELS, SAVINGS_LABELS, MONTH_NAMES_FULL_PT } from '../types';

interface EditMonthModalProps {
  month: MonthEntry;
  onSave: (updated: MonthEntry) => void;
  onClose: () => void;
}

// ── Section wrapper ─────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent: 'emerald' | 'red' | 'violet';
}

const ACCENT = {
  emerald: { header: 'bg-emerald-50 border-emerald-200', title: 'text-emerald-800', icon: 'text-emerald-400' },
  red:     { header: 'bg-red-50 border-red-200',         title: 'text-red-800',     icon: 'text-red-400' },
  violet:  { header: 'bg-violet-50 border-violet-200',   title: 'text-violet-800',  icon: 'text-violet-400' },
};

function Section({ title, subtitle, children, defaultOpen = true, accent }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const c = ACCENT[accent];
  return (
    <div className={`border rounded-xl overflow-hidden ${c.header}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 hover:brightness-95 transition-all`}>
        <div>
          <span className={`font-bold text-sm ${c.title}`}>{title}</span>
          {subtitle && <span className="text-xs text-gray-400 ml-2">{subtitle}</span>}
        </div>
        {open
          ? <ChevronDown className={`w-4 h-4 ${c.icon}`} />
          : <ChevronRight className={`w-4 h-4 ${c.icon}`} />
        }
      </button>
      {open && <div className="bg-white p-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

// ── Number field ────────────────────────────────────────────────────────────

function NumField({ label, value, onChange, onDelete }: {
  label: string; value: number; onChange: (v: number) => void; onDelete?: () => void;
}) {
  const [local, setLocal] = useState(String(value));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        {onDelete && (
          <button type="button" onClick={onDelete}
            className="text-gray-300 hover:text-red-400 transition-colors p-0.5 rounded">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs">€</span>
        <input type="number" step="0.01" min="0" value={local}
          onChange={e => { setLocal(e.target.value); const n = parseFloat(e.target.value.replace(',','.')); if (!isNaN(n)) onChange(n); }}
          onBlur={() => { const n = parseFloat(local.replace(',','.')); if (isNaN(n)) { setLocal('0'); onChange(0); } else setLocal(String(n)); }}
          className="w-full pl-6 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent bg-gray-50/50 hover:bg-white transition-colors" />
      </div>
    </div>
  );
}

// ── Custom item row ──────────────────────────────────────────────────────────

function CustomRow({ item, onUpdate, onRemove }: {
  item: CustomItem;
  onUpdate: (id: string, f: 'name'|'amount', v: string|number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 col-span-2 bg-gray-50 rounded-lg p-2 border border-dashed border-gray-200">
      <input type="text" value={item.name} placeholder="Description"
        onChange={e => onUpdate(item.id, 'name', e.target.value)}
        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
      <div className="relative w-32">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 text-xs">€</span>
        <input type="number" step="0.01" min="0" value={item.amount}
          onChange={e => onUpdate(item.id, 'amount', parseFloat(e.target.value) || 0)}
          className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white" />
      </div>
      <button type="button" onClick={() => onRemove(item.id)}
        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Restore pill ─────────────────────────────────────────────────────────────

function RestorePill({ label, onRestore }: { label: string; onRestore: () => void }) {
  return (
    <button type="button" onClick={onRestore}
      className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-full text-xs transition-colors">
      <RotateCcw className="w-3 h-3" />
      {label}
    </button>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────

export default function EditMonthModal({ month, onSave, onClose }: EditMonthModalProps) {
  const [income, setIncome] = useState<IncomeData>({ ...month.income });
  const [customIncome, setCustomIncome] = useState<CustomItem[]>([...(month.customIncome || [])]);
  const [expenses, setExpenses] = useState<ExpenseData>({ ...month.expenses });
  const [gastosExOverride, setGastosExOverride] = useState<number | null>(month.gastosExOverride);
  const [gastosExInput, setGastosExInput] = useState(month.gastosExOverride != null ? String(month.gastosExOverride) : '');
  const [savings, setSavings] = useState<SavingsAllocation>({ ...month.savings });
  const [customExpenses, setCustomExpenses] = useState<CustomItem[]>([...(month.customExpenses || [])]);
  const [customInvestments, setCustomInvestments] = useState<CustomItem[]>([...(month.customInvestments || [])]);
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set(month.hiddenFields || []));
  const [confirmed, setConfirmed] = useState(month.confirmed);

  const hide = (key: string) => setHiddenFields(prev => new Set([...prev, key]));
  const restore = (key: string) => setHiddenFields(prev => { const s = new Set(prev); s.delete(key); return s; });

  const updateIncome = useCallback((key: keyof IncomeData, val: number) => setIncome(p => ({ ...p, [key]: val })), []);
  const updateExpense = useCallback((key: keyof ExpenseData, val: number) => setExpenses(p => ({ ...p, [key]: val })), []);
  const updateSavings = useCallback((key: keyof SavingsAllocation, val: number) => setSavings(p => ({ ...p, [key]: val })), []);

  const addCustomIncome = () => setCustomIncome(p => [...p, { id: crypto.randomUUID(), name: '', amount: 0 }]);
  const updateCustomIncome = (id: string, f: 'name'|'amount', v: string|number) =>
    setCustomIncome(p => p.map(i => i.id === id ? { ...i, [f]: v } : i));
  const removeCustomIncome = (id: string) => setCustomIncome(p => p.filter(i => i.id !== id));

  const addCustomExpense = () => setCustomExpenses(p => [...p, { id: crypto.randomUUID(), name: '', amount: 0 }]);
  const updateCustomExpense = (id: string, f: 'name'|'amount', v: string|number) =>
    setCustomExpenses(p => p.map(i => i.id === id ? { ...i, [f]: v } : i));
  const removeCustomExpense = (id: string) => setCustomExpenses(p => p.filter(i => i.id !== id));

  const addCustomInvestment = () => setCustomInvestments(p => [...p, { id: crypto.randomUUID(), name: '', amount: 0 }]);
  const updateCustomInvestment = (id: string, f: 'name'|'amount', v: string|number) =>
    setCustomInvestments(p => p.map(i => i.id === id ? { ...i, [f]: v } : i));
  const removeCustomInvestment = (id: string) => setCustomInvestments(p => p.filter(i => i.id !== id));

  // Compute live gastosR for the placeholder
  const liveGastosR = Object.entries(expenses)
    .filter(([k]) => !hiddenFields.has(k))
    .reduce((s, [, v]) => s + (v as number || 0), 0)
    + customExpenses.reduce((s, i) => s + i.amount, 0);

  const handleGastosExChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGastosExInput(e.target.value);
    const n = parseFloat(e.target.value.replace(',', '.'));
    setGastosExOverride(isNaN(n) ? null : n);
  };

  const handleSave = () => {
    // hidden fields saved as their current value (calculations zero them, UI hides them)
    onSave({ ...month, income, customIncome, expenses, gastosExOverride, savings, customExpenses, customInvestments, hiddenFields: Array.from(hiddenFields), confirmed });
    onClose();
  };

  const hiddenIncomeKeys = (Object.keys(INCOME_LABELS) as (keyof IncomeData)[]).filter(k => hiddenFields.has(k));
  const hiddenExpenseKeys = (Object.keys(EXPENSE_LABELS) as (keyof ExpenseData)[]).filter(k => hiddenFields.has(k));
  const hiddenSavingsKeys = (Object.keys(SAVINGS_LABELS) as (keyof SavingsAllocation)[]).filter(k => hiddenFields.has(k));

  const monthName = MONTH_NAMES_FULL_PT[month.month - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit {monthName} {month.year}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update this month's values</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

          {/* ── Income ── */}
          <Section title="Income" accent="emerald" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-3">
              {/* fixed income fields (with delete/hide) */}
              {(Object.keys(INCOME_LABELS) as (keyof IncomeData)[])
                .filter(k => !hiddenFields.has(k))
                .map(key => (
                  <NumField key={key} label={INCOME_LABELS[key]} value={income[key]}
                    onChange={v => updateIncome(key, v)} onDelete={() => hide(key)} />
              ))}
              {/* custom income items */}
              {customIncome.map(item => (
                <CustomRow key={item.id} item={item} onUpdate={updateCustomIncome} onRemove={removeCustomIncome} />
              ))}
              <div className="col-span-2">
                <button type="button" onClick={addCustomIncome}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-dashed border-emerald-200 transition-colors">
                  <Plus className="w-4 h-4" /> Add Income Source
                </button>
              </div>
            </div>
            {/* hidden income restore pills */}
            {hiddenIncomeKeys.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Hidden:</span>
                {hiddenIncomeKeys.map(k => (
                  <RestorePill key={k} label={INCOME_LABELS[k]} onRestore={() => restore(k)} />
                ))}
              </div>
            )}
          </Section>

          {/* ── Expenses ── */}
          <Section title="Expenses" accent="red" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(EXPENSE_LABELS) as (keyof ExpenseData)[])
                .filter(k => !hiddenFields.has(k))
                .map(key => (
                  <NumField key={key} label={EXPENSE_LABELS[key]} value={expenses[key]}
                    onChange={v => updateExpense(key, v)} onDelete={() => hide(key)} />
              ))}
              {customExpenses.map(item => (
                <CustomRow key={item.id} item={item} onUpdate={updateCustomExpense} onRemove={removeCustomExpense} />
              ))}
              <div className="col-span-2">
                <button type="button" onClick={addCustomExpense}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-dashed border-red-200 transition-colors">
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </div>
              {/* Expected Expenses override */}
              <div className="col-span-2 pt-3 border-t border-gray-100">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">Expected Expenses (G.EX.)</label>
                    {gastosExOverride != null && (
                      <button type="button" onClick={() => { setGastosExOverride(null); setGastosExInput(''); }}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Reset to auto
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs">€</span>
                    <input type="number" step="0.01" min="0" value={gastosExInput}
                      onChange={handleGastosExChange}
                      placeholder={`Auto: ${liveGastosR.toFixed(2)}`}
                      className="w-full pl-6 pr-3 py-2 border border-orange-200 bg-orange-50/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  {gastosExOverride != null && (
                    <p className="text-xs text-orange-500">
                      Saldo = {gastosExOverride.toFixed(2)} − {liveGastosR.toFixed(2)} = <strong>{(gastosExOverride - liveGastosR).toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
            {hiddenExpenseKeys.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Hidden:</span>
                {hiddenExpenseKeys.map(k => (
                  <RestorePill key={k} label={EXPENSE_LABELS[k]} onRestore={() => restore(k)} />
                ))}
              </div>
            )}
          </Section>

          {/* ── Investments & Holidays ── */}
          <Section title="Investments & Holidays" accent="violet" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(SAVINGS_LABELS) as (keyof SavingsAllocation)[])
                .filter(k => !hiddenFields.has(k))
                .map(key => (
                  <NumField key={key} label={SAVINGS_LABELS[key]} value={savings[key]}
                    onChange={v => updateSavings(key, v)} onDelete={() => hide(key)} />
              ))}
              {customInvestments.map(item => (
                <CustomRow key={item.id} item={item} onUpdate={updateCustomInvestment} onRemove={removeCustomInvestment} />
              ))}
              <div className="col-span-2">
                <button type="button" onClick={addCustomInvestment}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-violet-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg border border-dashed border-violet-200 transition-colors">
                  <Plus className="w-4 h-4" /> Add Investment
                </button>
              </div>
            </div>
            {hiddenSavingsKeys.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Hidden:</span>
                {hiddenSavingsKeys.map(k => (
                  <RestorePill key={k} label={SAVINGS_LABELS[k]} onRestore={() => restore(k)} />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
          <button type="button" onClick={() => setConfirmed(c => !c)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              confirmed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
            }`}>
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all ${
              confirmed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
            }`}>
              {confirmed && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </div>
            Confirmed
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSave}
              className="px-6 py-2 text-sm font-bold bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
