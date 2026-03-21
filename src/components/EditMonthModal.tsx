import { useState, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import type { MonthEntry, IncomeData, ExpenseData, SavingsAllocation, CustomItem } from '../types';
import { INCOME_LABELS, EXPENSE_LABELS, SAVINGS_LABELS, MONTH_NAMES_FULL_PT } from '../types';
import { sumObject } from '../utils/calculations';

interface EditMonthModalProps {
  month: MonthEntry;
  onSave: (updated: MonthEntry) => void;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: string;
}

function Section({ title, children, defaultOpen = true, color = 'gray' }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const headerColors: Record<string, string> = {
    gray: 'bg-gray-50 hover:bg-gray-100',
    emerald: 'bg-emerald-50 hover:bg-emerald-100',
    red: 'bg-red-50 hover:bg-red-100',
    violet: 'bg-violet-50 hover:bg-violet-100',
  };
  const textColors: Record<string, string> = {
    gray: 'text-gray-700',
    emerald: 'text-emerald-700',
    red: 'text-red-700',
    violet: 'text-violet-700',
  };
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 ${headerColors[color]} transition-colors`}>
        <span className={`font-semibold text-sm ${textColors[color]}`}>{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
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
    if (isNaN(n)) { setLocalVal('0'); onChange(0); }
    else setLocalVal(String(n));
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
        <input type="number" step="0.01" min="0" value={localVal}
          onChange={handleChange} onBlur={handleBlur}
          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>
    </div>
  );
}

interface CustomItemRowProps {
  item: CustomItem;
  onUpdate: (id: string, field: 'name' | 'amount', val: string | number) => void;
  onRemove: (id: string) => void;
}

function CustomItemRow({ item, onUpdate, onRemove }: CustomItemRowProps) {
  return (
    <div className="flex items-center gap-2 col-span-2">
      <input type="text" value={item.name} placeholder="Descrição"
        onChange={e => onUpdate(item.id, 'name', e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      <div className="relative w-36">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
        <input type="number" step="0.01" min="0" value={item.amount}
          onChange={e => onUpdate(item.id, 'amount', parseFloat(e.target.value) || 0)}
          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
      </div>
      <button type="button" onClick={() => onRemove(item.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function EditMonthModal({ month, onSave, onClose }: EditMonthModalProps) {
  const [income, setIncome] = useState<IncomeData>({ ...month.income });
  const [expenses, setExpenses] = useState<ExpenseData>({ ...month.expenses });
  const [gastosExOverride, setGastosExOverride] = useState<number | null>(month.gastosExOverride);
  const [gastosExInput, setGastosExInput] = useState(
    month.gastosExOverride != null ? String(month.gastosExOverride) : ''
  );
  const [savings, setSavings] = useState<SavingsAllocation>({ ...month.savings });
  const [customExpenses, setCustomExpenses] = useState<CustomItem[]>([...(month.customExpenses || [])]);
  const [customInvestments, setCustomInvestments] = useState<CustomItem[]>([...(month.customInvestments || [])]);
  const [confirmed, setConfirmed] = useState(month.confirmed);

  // Compute current gastosR for reference
  const currentGastosR = sumObject(expenses as unknown as Record<string, number>)
    + customExpenses.reduce((s, i) => s + i.amount, 0);

  const updateIncome = useCallback((key: keyof IncomeData, val: number) =>
    setIncome(prev => ({ ...prev, [key]: val })), []);
  const updateExpense = useCallback((key: keyof ExpenseData, val: number) =>
    setExpenses(prev => ({ ...prev, [key]: val })), []);
  const updateSavings = useCallback((key: keyof SavingsAllocation, val: number) =>
    setSavings(prev => ({ ...prev, [key]: val })), []);

  const addCustomExpense = () => setCustomExpenses(prev => [
    ...prev, { id: crypto.randomUUID(), name: '', amount: 0 }
  ]);
  const updateCustomExpense = (id: string, field: 'name' | 'amount', val: string | number) =>
    setCustomExpenses(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeCustomExpense = (id: string) =>
    setCustomExpenses(prev => prev.filter(i => i.id !== id));

  const addCustomInvestment = () => setCustomInvestments(prev => [
    ...prev, { id: crypto.randomUUID(), name: '', amount: 0 }
  ]);
  const updateCustomInvestment = (id: string, field: 'name' | 'amount', val: string | number) =>
    setCustomInvestments(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeCustomInvestment = (id: string) =>
    setCustomInvestments(prev => prev.filter(i => i.id !== id));

  const handleGastosExChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGastosExInput(e.target.value);
    const n = parseFloat(e.target.value.replace(',', '.'));
    setGastosExOverride(isNaN(n) ? null : n);
  };

  const handleSave = () => {
    onSave({ ...month, income, expenses, gastosExOverride, savings, customExpenses, customInvestments, confirmed });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Editar {MONTH_NAMES_FULL_PT[month.month - 1]} {month.year}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Atualize os valores do mês</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Rendimento */}
          <Section title="Rendimento" color="emerald" defaultOpen={true}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(INCOME_LABELS) as (keyof IncomeData)[]).map(key => (
                <NumField key={key} label={INCOME_LABELS[key]} value={income[key]} onChange={v => updateIncome(key, v)} />
              ))}
            </div>
          </Section>

          {/* Despesas */}
          <Section title="Despesas" color="red" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(EXPENSE_LABELS) as (keyof ExpenseData)[]).map(key => (
                <NumField key={key} label={EXPENSE_LABELS[key]} value={expenses[key]} onChange={v => updateExpense(key, v)} />
              ))}
              {customExpenses.map(item => (
                <CustomItemRow key={item.id} item={item} onUpdate={updateCustomExpense} onRemove={removeCustomExpense} />
              ))}
              <div className="col-span-2">
                <button type="button" onClick={addCustomExpense}
                  className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-dashed border-red-300 w-full justify-center">
                  <Plus className="w-4 h-4" /> Adicionar Despesa
                </button>
              </div>
              {/* Gastos Expectáveis override */}
              <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Gastos Expectáveis (deixar vazio = automático: {currentGastosR.toFixed(2)})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input type="number" step="0.01" min="0" value={gastosExInput}
                      onChange={handleGastosExChange}
                      placeholder={currentGastosR.toFixed(2)}
                      className="w-full pl-7 pr-3 py-2 border border-orange-300 bg-orange-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  {gastosExOverride != null && (
                    <p className="text-xs text-orange-600">
                      Saldo = {gastosExOverride.toFixed(2)} - {currentGastosR.toFixed(2)} = {(gastosExOverride - currentGastosR).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* Investimentos e Férias */}
          <Section title="Investimentos e Férias" color="violet" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(SAVINGS_LABELS) as (keyof SavingsAllocation)[]).map(key => (
                <NumField key={key} label={SAVINGS_LABELS[key]} value={savings[key]} onChange={v => updateSavings(key, v)} />
              ))}
              {customInvestments.map(item => (
                <CustomItemRow key={item.id} item={item} onUpdate={updateCustomInvestment} onRemove={removeCustomInvestment} />
              ))}
              <div className="col-span-2">
                <button type="button" onClick={addCustomInvestment}
                  className="flex items-center gap-2 text-sm text-violet-600 hover:bg-violet-50 px-3 py-2 rounded-lg transition-colors border border-dashed border-violet-300 w-full justify-center">
                  <Plus className="w-4 h-4" /> Adicionar Investimento
                </button>
              </div>
            </div>
          </Section>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button type="button" onClick={() => setConfirmed(c => !c)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              confirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              confirmed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
            }`}>
              {confirmed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            Confirmado
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSave}
              className="px-5 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
