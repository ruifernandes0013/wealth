import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Loader2, Circle, MessageSquare, Plus, Clipboard, X } from 'lucide-react';
import YearSelector from '../components/YearSelector';
import MonthSelector from '../components/MonthSelector';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, horizontalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData } from '../context/DataContext';
import { calcYearMonths } from '../utils/calculations';
import { formatCurrency, formatPct } from '../utils/format';
import { MONTH_NAMES_PT } from '../types';
import type { MonthWithCalc, LineItem } from '../types';

// ── Sub-section header ────────────────────────────────────────────────────────
function TableHeader({ title, color, adding, addValue, onAddChange, onAddStart, onAddConfirm, onAddCancel }: {
  title: string; color: 'red' | 'violet' | 'emerald' | 'teal';
  adding?: boolean; addValue?: string;
  onAddChange?: (v: string) => void; onAddStart?: () => void;
  onAddConfirm?: () => void; onAddCancel?: () => void;
}) {
  const colors = {
    red: 'text-red-700 border-red-200',
    violet: 'text-violet-700 border-violet-200',
    emerald: 'text-emerald-700 border-emerald-200',
    teal: 'text-teal-700 border-teal-200',
  };
  return (
    <div className="flex items-center gap-2 mt-2">
      <h2 className={`text-sm font-bold uppercase tracking-wider ${colors[color].split(' ')[0]}`}>{title}</h2>
      {onAddStart && (
        adding ? (
          <div className="flex items-center gap-1">
            <input autoFocus value={addValue} onChange={e => onAddChange?.(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onAddConfirm?.(); if (e.key === 'Escape') onAddCancel?.(); }}
              onBlur={() => { if (!addValue?.trim()) onAddCancel?.(); }}
              placeholder="Column name…"
              className="text-xs border border-gray-300 rounded-md px-2 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-gray-400" />
            <button onClick={onAddCancel} className="text-xs text-gray-400 hover:text-gray-600 leading-none">✕</button>
          </div>
        ) : (
          <button onClick={onAddStart} className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium">
            add column +
          </button>
        )
      )}
      <div className={`flex-1 h-px border-t ${colors[color].split(' ')[1]}`} />
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ActiveNote {
  table: 'income' | 'expenses' | 'investments' | 'savings';
  itemId: string;
  label: string;
  value: string;
  position: { x: number; y: number };
}

interface EditCellState {
  table: 'income' | 'expenses' | 'investments' | 'savings' | 'gastosEx';
  year: number;
  month: number;
  name: string;
}

// ── NotePopover ───────────────────────────────────────────────────────────────
function NotePopover({ note, label, position, onSave, onClose }: {
  note: ActiveNote; label: string; position: { x: number; y: number };
  onSave: (text: string) => void; onClose: () => void;
}) {
  const [text, setText] = useState(note.value);
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 50 }}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-gray-700">{label}</span>
          </div>
          {text && <button onClick={() => setText('')} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write a note…" rows={3} autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave(text); }}
          className="w-full text-sm border border-amber-200 bg-amber-50/40 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-gray-300" />
        <p className="text-xs text-gray-300 mt-1 mb-3">⌘ Enter to save</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => onSave(text)} className="px-4 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">Save</button>
        </div>
      </div>
    </>
  );
}

// ── Add-column header cell ─────────────────────────────────────────────────────
function AddColHeader({ adding, value, onChange, onConfirm, onCancel, onStart, accentClass }: {
  adding: boolean; value: string; onChange: (v: string) => void;
  onConfirm: () => void; onCancel: () => void; onStart: () => void; accentClass: string;
}) {
  if (adding) {
    return (
      <th className={`px-1 py-1 ${accentClass}`}>
        <input autoFocus value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); }}
          onBlur={() => { if (!value.trim()) onCancel(); }}
          placeholder="Name…"
          className="w-24 px-2 py-0.5 text-xs bg-white/90 text-gray-800 rounded focus:outline-none" />
      </th>
    );
  }
  return (
    <th onClick={onStart} title="Add column" className={`px-2 py-1 cursor-pointer hover:brightness-125 transition-all ${accentClass}`}>
      <Plus className="w-3 h-3 mx-auto text-white/80" />
    </th>
  );
}

// ── Sortable draggable column header with rename + delete ─────────────────────
function SortableColHead({ id, name, onDelete, onRename }: {
  id: string; name: string;
  onDelete: () => void;
  onRename: (newName: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename(trimmed);
    else setDraft(name);
    setEditing(false);
  };

  const openMenu = (e: React.PointerEvent) => {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 4, left: Math.max(4, rect.right - 112) });
  };

  useEffect(() => {
    if (!menuPos) return;
    const close = () => setMenuPos(null);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuPos]);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  if (editing) {
    return (
      <th style={style} className="px-1 py-1 text-right text-xs font-semibold whitespace-nowrap min-w-[50px]">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setDraft(name); setEditing(false); } }}
          className="w-full px-2 py-0.5 text-xs bg-white/90 text-gray-800 rounded focus:outline-none"
        />
      </th>
    );
  }

  return (
    <>
      <th ref={setNodeRef} style={style} {...attributes} {...listeners}
        className="px-1 py-1 text-xs font-semibold whitespace-nowrap group/col min-w-[50px] cursor-grab active:cursor-grabbing touch-none">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate flex-1 text-center">{name}</span>
          <button
            ref={btnRef}
            onPointerDown={openMenu}
            className="w-5 h-5 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0 text-sm leading-none">
            ···
          </button>
        </div>
      </th>
      {menuPos && createPortal(
        <div
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
          onPointerDown={e => e.stopPropagation()}
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[112px]">
          <button
            onClick={() => { setMenuPos(null); setDraft(name); setEditing(true); }}
            className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors">
            Rename
          </button>
          <button
            onClick={() => { setMenuPos(null); onDelete(); }}
            className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors">
            Delete
          </button>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getUniqueNames(items: LineItem[], year: number): string[] {
  const map = new Map<string, number>();
  items.filter(i => i.year === year).forEach(i => {
    const cur = map.get(i.name) ?? Infinity;
    if ((i.sortOrder ?? 99) < cur) map.set(i.name, i.sortOrder ?? 99);
  });
  return Array.from(map.entries()).sort((a, b) => a[1] - b[1]).map(([n]) => n);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Monthly() {
  const {
    state, loading,
    upsertLineItem, addLineItem, deleteLineItem, updateMonthMeta, updateYearConfig, addYear,
    getMonthsForYear, getYearConfig, getAvailableYears,
    selectedYear, setSelectedYear, selectedMonth, setSelectedMonth,
  } = useData();

  const availableYears = getAvailableYears();
  const currentMonth = selectedMonth;
  const setCurrentMonth = (month: number) => { void setSelectedMonth(month); };
  const [balanceInput, setBalanceInput] = useState('');
  const [editingBalance, setEditingBalance] = useState(false);
  const [activeNote, setActiveNote] = useState<ActiveNote | null>(null);
  const [addingCol, setAddingCol] = useState<'income' | 'expense' | 'investment' | 'savings' | null>(null);
  const [newColName, setNewColName] = useState('');
  const [editCell, setEditCell] = useState<EditCellState | null>(null);
  const [editCellVal, setEditCellVal] = useState('');
  const [copiedValue, setCopiedValue] = useState<number | null>(null);

  const months = getMonthsForYear(selectedYear);
  const yearConfig = getYearConfig(selectedYear);
  const computed = calcYearMonths(months, state.income, state.expenses, state.investments, state.savings, yearConfig.initialBalance, state.savings);

  // Dynamic column names sorted by sortOrder
  const incomeNames = getUniqueNames(state.income, selectedYear);
  const expenseNames = getUniqueNames(state.expenses, selectedYear);
  const investmentNames = getUniqueNames(state.investments, selectedYear);
  const savingsAccountNames = getUniqueNames(state.savings, selectedYear);

  const handleSaveBalance = () => {
    const val = parseFloat(balanceInput.replace(',', '.'));
    if (!isNaN(val)) updateYearConfig({ year: selectedYear, initialBalance: val });
    setEditingBalance(false);
  };

  const toggleConfirmed = async (m: MonthWithCalc) => {
    await updateMonthMeta({ id: m.id, year: m.year, month: m.month, confirmed: !m.confirmed, gastosExOverride: m.gastosExOverride });
  };

  const startEdit = (table: EditCellState['table'], year: number, month: number, name: string, val: number) => {
    setEditCell({ table, year, month, name });
    setEditCellVal(String(val));
  };

  const saveCellEdit = async () => {
    if (!editCell) return;
    const val = parseFloat(editCellVal.replace(',', '.'));
    if (editCell.table === 'gastosEx') {
      const meta = state.months.find(m => m.year === editCell.year && m.month === editCell.month);
      if (meta) await updateMonthMeta({ ...meta, gastosExOverride: isNaN(val) || editCellVal.trim() === '' ? null : val });
    } else {
      const existing = state[editCell.table].find(i =>
        i.year === editCell.year && i.month === editCell.month && i.name === editCell.name
      );
      if (existing) {
        await upsertLineItem(editCell.table, { ...existing, amount: isNaN(val) ? 0 : val });
      } else if (!isNaN(val)) {
        // Item missing — create it (e.g. gap in migrated data)
        await upsertLineItem(editCell.table, {
          id: crypto.randomUUID(),
          year: editCell.year,
          month: editCell.month,
          name: editCell.name,
          amount: val,
          sortOrder: 99,
        });
      }
    }
    setEditCell(null);
    setEditCellVal('');
  };

  const saveValueDirect = async (
    table: 'income' | 'expenses' | 'investments' | 'savings',
    year: number, month: number, name: string,
    val: number, item: LineItem | undefined,
  ) => {
    if (item) {
      await upsertLineItem(table, { ...item, amount: val });
    } else {
      await upsertLineItem(table, { id: crypto.randomUUID(), year, month, name, amount: val, sortOrder: 99 });
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setCopiedValue(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const addColumn = async (section: 'income' | 'expense' | 'investment' | 'savings') => {
    const name = newColName.trim();
    if (!name) { setAddingCol(null); setNewColName(''); return; }
    const table = section === 'income' ? 'income' : section === 'expense' ? 'expenses' : section === 'savings' ? 'savings' : 'investments';
    await addLineItem(table, selectedYear, 1, name);
    setAddingCol(null);
    setNewColName('');
  };

  const deleteColumn = async (table: 'income' | 'expenses' | 'investments' | 'savings', name: string) => {
    const items = state[table].filter(i => i.year === selectedYear && i.name === name);
    await Promise.all(items.map(i => deleteLineItem(table, i.id)));
  };

  const reorderColumns = async (table: 'income' | 'expenses' | 'investments' | 'savings', newOrder: string[]) => {
    const updates = newOrder.flatMap((name, newIdx) =>
      state[table].filter(i => i.year === selectedYear && i.name === name)
        .map(i => upsertLineItem(table, { ...i, sortOrder: newIdx }))
    );
    await Promise.all(updates);
  };

  const renameColumn = async (
    table: 'income' | 'expenses' | 'investments' | 'savings',
    oldName: string,
    newName: string
  ) => {
    if (!newName.trim() || newName === oldName) return;
    const items = state[table].filter(i => i.year === selectedYear && i.name === oldName);
    await Promise.all(items.map(i => upsertLineItem(table, { ...i, name: newName })));
  };

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const ZOOM_STEPS = [0.7, 0.8, 0.9, 1.0, 1.1, 1.25];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [zoomIdx, setZoomIdx] = useState(isMobile ? 0 : 2); // 70% mobile, 90% desktop
  const zoom = ZOOM_STEPS[zoomIdx];

  const handleDragEnd = (table: 'income' | 'expenses' | 'investments' | 'savings', names: string[]) =>
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIdx = names.indexOf(String(active.id));
      const newIdx = names.indexOf(String(over.id));
      if (oldIdx === -1 || newIdx === -1) return;
      reorderColumns(table, arrayMove(names, oldIdx, newIdx));
    };

  const openNote = (
    e: React.MouseEvent,
    table: 'income' | 'expenses' | 'investments' | 'savings',
    item: LineItem,
    label: string,
  ) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x = rect.left; let y = rect.bottom + 8;
    if (x + 292 > window.innerWidth) x = window.innerWidth - 300;
    if (y + 220 > window.innerHeight) y = rect.top - 220 - 8;
    setActiveNote({ table, itemId: item.id, label, value: item.note ?? '', position: { x, y } });
  };

  const saveNote = async (text: string) => {
    if (!activeNote) return;
    const item = state[activeNote.table].find(i => i.id === activeNote.itemId);
    if (item) await upsertLineItem(activeNote.table, { ...item, note: text });
    setActiveNote(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );

  const confirmedCount = computed.filter(m => m.confirmed).length;

  // Totals
  const totals = computed.reduce((acc, m) => ({
    cashIn: acc.cashIn + m.calc.cashIn,
    cashOut: acc.cashOut + m.calc.cashOut,
    gastosR: acc.gastosR + m.calc.gastosR,
    gastosEx: acc.gastosEx + m.calc.gastosEx,
    saldo: acc.saldo + m.calc.saldo,
    savingsTotal: acc.savingsTotal + m.calc.savingsTotal,
    savingsDeposits: acc.savingsDeposits + m.calc.savingsDeposits,
    guardado: acc.guardado + m.calc.guardado,
  }), { cashIn: 0, cashOut: 0, gastosR: 0, gastosEx: 0, saldo: 0, savingsTotal: 0, savingsDeposits: 0, guardado: 0 });

  const incomeTotals: Record<string, number> = {};
  incomeNames.forEach(name => {
    incomeTotals[name] = computed.reduce((s, m) => s + (m.incomeItems.find(i => i.name === name)?.amount ?? 0), 0);
  });

  const expenseTotals: Record<string, number> = {};
  expenseNames.forEach(name => {
    expenseTotals[name] = computed.reduce((s, m) => s + (m.expenseItems.find(i => i.name === name)?.amount ?? 0), 0);
  });

  const investmentTotals: Record<string, number> = {};
  investmentNames.forEach(name => {
    investmentTotals[name] = computed.reduce((s, m) => s + (m.investmentItems.find(i => i.name === name)?.amount ?? 0), 0);
  });

  const savingsAccountTotals: Record<string, number> = {};
  savingsAccountNames.forEach(name => {
    savingsAccountTotals[name] = computed.reduce((s, m) => s + (m.savingsItems.find(i => i.name === name)?.amount ?? 0), 0);
  });

  const avgNetRate = computed.length > 0
    ? computed.reduce((s, m) => s + (m.calc.cashIn > 0 ? (m.calc.netBankChange / m.calc.cashIn) * 100 : 0), 0) / computed.length : 0;

  const incomeGroupColspan = incomeNames.length + 2; // cols + add btn + CASH IN

  const rowStyle = (m: MonthWithCalc) => {
    const isCurrent = m.month === currentMonth;
    if (isCurrent) return { row: 'bg-sky-50 hover:bg-sky-100/70', sticky: 'bg-sky-50', text: 'text-sky-700', muted: 'text-sky-600/60', projected: false };
    return { row: 'bg-white hover:bg-gray-50', sticky: 'bg-white', text: 'text-gray-800', muted: 'text-gray-500', projected: false };
  };

  const thBase = 'px-1.5 py-1 text-xs font-semibold whitespace-nowrap text-right';
  const tdBase = 'px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap';

  // ── Inline editable + notable breakdown cell ──────────────────────────────
  const EC = (
    m: MonthWithCalc,
    table: 'income' | 'expenses' | 'investments' | 'savings',
    name: string,
    item: LineItem | undefined,
    colorClass: string,
    extraClass = '',
  ) => {
    const value = item?.amount ?? 0;
    const note = item?.note ?? '';
    const isEditing = editCell?.table === table && editCell.month === m.month && editCell.name === name;
    const isPasteMode = copiedValue !== null;
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPasteMode) {
        saveValueDirect(table, m.year, m.month, name, copiedValue, item);
      } else if (!isEditing) {
        startEdit(table, m.year, m.month, name, value);
      }
    };
    return (
      <td
        key={`${m.id}-${table}-${name}`}
        className={`relative group/ec px-1.5 py-1.5 text-right tabular-nums text-xs whitespace-nowrap ${
          isEditing ? 'ring-1 ring-inset ring-violet-400 bg-violet-50/40'
          : isPasteMode ? 'cursor-copy hover:ring-1 hover:ring-inset hover:ring-sky-400 hover:bg-sky-50/40'
          : 'cursor-pointer'
        } ${colorClass} ${extraClass}`}
        onClick={handleClick}
      >
        {isEditing ? (
          <input
            autoFocus
            value={editCellVal}
            onChange={e => setEditCellVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveCellEdit(); if (e.key === 'Escape') setEditCell(null); }}
            onBlur={saveCellEdit}
            className="w-full text-right bg-transparent focus:outline-none tabular-nums text-xs"
          />
        ) : formatCurrency(value)}
        {!isEditing && !isPasteMode && item && (
          <>
            <button type="button"
              onClick={e => { e.stopPropagation(); openNote(e, table, item, name); }}
              className={`absolute top-0.5 right-0.5 rounded p-0.5 transition-all z-10 ${
                note ? 'opacity-100 text-amber-400 hover:text-amber-600' : 'opacity-0 group-hover/ec:opacity-100 text-gray-200 hover:text-amber-400'
              }`}>
              <MessageSquare className="w-2.5 h-2.5" />
            </button>
            {note && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-400 rounded-full pointer-events-none" />}
          </>
        )}
        {!isEditing && !isPasteMode && (
          <button type="button"
            onClick={e => { e.stopPropagation(); setCopiedValue(value); }}
            className="absolute top-0.5 left-0.5 rounded p-0.5 transition-all z-10 opacity-0 group-hover/ec:opacity-100 text-gray-300 hover:text-sky-500">
            <Clipboard className="w-2.5 h-2.5" />
          </button>
        )}
      </td>
    );
  };

  // ── G.EX. override editable cell ──────────────────────────────────────────
  const GE = (m: MonthWithCalc, colorClass: string) => {
    const isEditing = editCell?.table === 'gastosEx' && editCell.month === m.month;
    const value = m.calc.gastosEx;
    const hasOverride = m.gastosExOverride != null;
    return (
      <td
        className={`relative px-1.5 py-1.5 text-right tabular-nums text-xs whitespace-nowrap cursor-pointer ${colorClass} ${hasOverride ? 'underline decoration-dotted' : ''}`}
        title={hasOverride ? `Override: ${value} (click to edit, clear to reset)` : 'Click to set override'}
        onClick={e => { e.stopPropagation(); if (!isEditing) startEdit('gastosEx', m.year, m.month, 'gastosEx', m.gastosExOverride ?? value); }}
      >
        {isEditing ? (
          <input
            autoFocus
            value={editCellVal}
            onChange={e => setEditCellVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveCellEdit(); if (e.key === 'Escape') setEditCell(null); }}
            onBlur={saveCellEdit}
            placeholder="auto"
            className="w-full text-right bg-transparent focus:outline-none tabular-nums text-xs placeholder:text-gray-300"
          />
        ) : formatCurrency(value)}
      </td>
    );
  };

  return (
    <div className="space-y-5">

        {/* Sticky header */}
        <div className="sticky top-14 md:top-16 z-30 bg-gray-50 pb-3 pt-1 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Cash Flow</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Click any cell to edit inline · Click ✓ to toggle confirmed · {confirmedCount}/{computed.length} confirmed
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
              <button onClick={() => setZoomIdx(i => Math.max(0, i - 1))} disabled={zoomIdx === 0}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 font-bold text-base leading-none">−</button>
              <span className="text-xs text-gray-500 w-8 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoomIdx(i => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIdx === ZOOM_STEPS.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 font-bold text-base leading-none">+</button>
            </div>
            <YearSelector
              selectedYear={selectedYear}
              availableYears={availableYears}
              onSelectYear={y => { void setSelectedYear(y); }}
              onCreateYear={addYear}
            />
            <MonthSelector
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              availableYears={availableYears}
              onChange={(year, month) => {
                if (year !== selectedYear) void setSelectedYear(year);
                void setSelectedMonth(month);
              }}
            />
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <span className="text-xs text-gray-400">Opening balance:</span>
              {editingBalance ? (
                <div className="flex items-center gap-1.5">
                  <input type="number" step="0.01" value={balanceInput} onChange={e => setBalanceInput(e.target.value)}
                    className="w-24 text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-violet-400"
                    autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveBalance(); if (e.key === 'Escape') setEditingBalance(false); }} />
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

        <div className="flex items-center gap-5 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmed</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Current month</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-300" /> Projection</span>
          {copiedValue !== null && (
            <span className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg px-2.5 py-1 font-medium">
              <Clipboard className="w-3 h-3" />
              Paste mode: {formatCurrency(copiedValue)} — click cells to paste
              <button onClick={() => setCopiedValue(null)} className="ml-1 hover:text-sky-900"><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
        </div>{/* end sticky header */}

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CASHFLOW TABLE
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${(1/zoom)*100}%` } : undefined}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th rowSpan={2} className="sticky left-0 z-20 bg-gray-900 text-white px-2 py-2 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-gray-700 align-middle">MONTH</th>
                  <th colSpan={incomeGroupColspan} className="bg-emerald-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-emerald-700">INCOME</th>
                  <th colSpan={3} className="bg-red-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-red-700">OUTGOING</th>
                  <th colSpan={5} className="bg-violet-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-violet-700">RESULT</th>
                  <th rowSpan={2} className="bg-gray-800 text-white text-center px-2 py-1 text-xs border-l border-gray-700 align-middle cursor-pointer">✓</th>
                </tr>
                <tr>
                  {incomeNames.map(name => (
                    <th key={name} className={`${thBase} bg-emerald-700/80 text-emerald-100`}>{name.substring(0, 7).toUpperCase()}</th>
                  ))}
                  <th className="px-2 py-1 bg-emerald-700/60 text-emerald-200" title="Add income column (use Income table below)">·</th>
                  <th className={`${thBase} bg-emerald-900 text-emerald-200 border-l border-emerald-600 font-bold`}>CASH IN</th>
                  <th className={`${thBase} bg-red-700/80 text-red-100 border-l border-red-600`} title="Click cell to set override">EXPENSES</th>
                  <th className={`${thBase} bg-amber-600/90 text-amber-100`}>EXTRA</th>
                  <th className={`${thBase} bg-red-900 text-red-200 border-l border-red-700 font-bold`}>TOTAL OUT</th>
                  <th className={`${thBase} bg-violet-700/80 text-violet-100 border-l border-violet-600 font-bold`}>NET</th>
                  <th className={`${thBase} bg-violet-700/80 text-violet-100`}>RATE</th>
                  <th className={`${thBase} bg-violet-700/80 text-violet-100`}>YTD</th>
                  <th className={`${thBase} bg-violet-900 text-violet-200 border-l border-violet-600 font-bold`}>BALANCE</th>
                  <th className={`${thBase} bg-violet-900 text-violet-200`}>AV.BAL</th>
                </tr>
              </thead>
              <tbody>
                {computed.map(m => {
                  const s = rowStyle(m);
                  const isCurrent = m.month === currentMonth;
                  return (
                    <tr key={m.id} className={`transition-colors border-b border-gray-100 ${s.row} group cursor-pointer`} onClick={() => setCurrentMonth(m.month)}>
                      <td className={`sticky left-0 z-10 px-2 py-1.5 font-bold whitespace-nowrap shadow-[2px_0_8px_-4px_rgba(0,0,0,0.12)] border-r border-gray-100 ${s.sticky}`}>
                        <div className="flex items-center gap-2">
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse flex-shrink-0" />}
                          <span className={`text-sm ${s.text}`}>{MONTH_NAMES_PT[m.month - 1]}</span>
                        </div>
                      </td>
                      {incomeNames.map(name => {
                        const val = m.incomeItems.find(i => i.name === name)?.amount ?? 0;
                        return (
                          <td key={`${m.id}-main-inc-${name}`} className={`${tdBase} text-xs ${val > 0 ? s.muted : 'text-gray-200'}`}>
                            {formatCurrency(val)}
                          </td>
                        );
                      })}
                      <td className="px-1" />
                      <td className={`${tdBase} font-bold text-sm border-l border-emerald-100 text-emerald-600`}>{formatCurrency(m.calc.cashIn)}</td>
                      {GE(m, 'text-gray-500')}
                      <td className={`${tdBase} text-xs ${m.calc.savingsTotal > 0 ? 'text-amber-600' : 'text-gray-300'}`}>{m.calc.savingsTotal > 0 ? formatCurrency(m.calc.savingsTotal) : '—'}</td>
                      <td className={`${tdBase} font-bold text-sm border-l border-red-100 text-red-600`}>{formatCurrency(m.calc.gastosEx + m.calc.savingsTotal)}</td>
                      <td className={`${tdBase} font-bold text-sm border-l border-violet-100 ${m.calc.netBankChange < 0 ? 'text-red-500' : 'text-violet-600'}`}>{formatCurrency(m.calc.netBankChange)}</td>
                      {(() => { const rate = m.calc.cashIn > 0 ? (m.calc.netBankChange / m.calc.cashIn) * 100 : 0; return <td className={`${tdBase} text-xs font-semibold ${rate >= 60 ? 'text-emerald-600' : rate >= 40 ? 'text-sky-500' : rate >= 20 ? 'text-amber-500' : 'text-red-500'}`}>{formatPct(rate)}</td>; })()}
                      <td className={`${tdBase} text-xs text-violet-500`}>{formatCurrency(m.totalBalance - yearConfig.initialBalance)}</td>
                      <td className={`${tdBase} font-bold text-sm border-l border-violet-100 ${m.totalBalance < 0 ? 'text-red-500' : 'text-blue-600'}`}>{formatCurrency(m.totalBalance)}</td>
                      <td className={`${tdBase} text-xs ${m.totalBalance - m.totalSavingsBalance < 0 ? 'text-red-400' : 'text-blue-400'}`}>{formatCurrency(m.totalBalance - m.totalSavingsBalance)}</td>
                      <td className="px-2 py-1.5 text-center border-l border-gray-100 whitespace-nowrap cursor-pointer" onClick={() => toggleConfirmed(m)}>
                        {m.confirmed ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> : <Circle className="w-4 h-4 text-gray-200 mx-auto hover:text-gray-400 transition-colors" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {computed.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-900 text-white font-bold">
                    <td className="sticky left-0 z-10 bg-gray-900 px-2 py-1.5 text-xs uppercase tracking-wider shadow-[2px_0_8px_-4px_rgba(0,0,0,0.4)]">TOTAL</td>
                    {incomeNames.map(name => (
                      <td key={name} className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(incomeTotals[name] ?? 0)}</td>
                    ))}
                    <td className="px-1" />
                    <td className={`${tdBase} text-sm text-emerald-300 border-l border-gray-700`}>{formatCurrency(totals.cashIn)}</td>
                    <td className={`${tdBase} text-xs text-gray-300 border-l border-gray-700`}>{formatCurrency(totals.gastosEx)}</td>
                    <td className={`${tdBase} text-xs text-amber-300`}>{formatCurrency(totals.savingsTotal)}</td>
                    <td className={`${tdBase} text-sm text-red-300 border-l border-gray-700`}>{formatCurrency(totals.gastosEx + totals.savingsTotal)}</td>
                    <td className={`${tdBase} text-sm text-violet-300 border-l border-gray-700`}>{formatCurrency(totals.cashIn - totals.gastosEx - totals.savingsTotal)}</td>
                    <td className={`${tdBase} text-xs text-gray-300`}>{formatPct(avgNetRate)}</td>
                    <td className={`${tdBase} text-xs text-gray-400`}>—</td>
                    <td className={`${tdBase} text-sm text-blue-300 border-l border-gray-700`}>{formatCurrency(computed[computed.length - 1]?.totalBalance ?? 0)}</td>
                    <td className={`${tdBase} text-xs text-blue-200`}>{formatCurrency((computed[computed.length - 1]?.totalBalance ?? 0) - (computed[computed.length - 1]?.totalSavingsBalance ?? 0))}</td>
                    <td className="px-2 py-1.5 text-center text-xs text-gray-400 border-l border-gray-700">{confirmedCount}/{computed.length}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* ── Breakdown tables ─────────────────────────────────────────────── */}
        <div className="space-y-5" style={zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: 'top left', width: `${(1/zoom)*100}%` } : undefined}>

        {/* ═══════════════════════════════════════════════════════════════════
            INCOME BREAKDOWN TABLE
        ═══════════════════════════════════════════════════════════════════ */}
        <TableHeader title="Income Breakdown" color="emerald"
          adding={addingCol === 'income'} addValue={newColName}
          onAddChange={setNewColName} onAddStart={() => setAddingCol('income')}
          onAddConfirm={() => addColumn('income')}
          onAddCancel={() => { setAddingCol(null); setNewColName(''); }}
        />
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-emerald-600 text-white">
                  <th className="sticky left-0 z-10 bg-emerald-600 px-1 py-1 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-emerald-500">MONTH</th>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('income', incomeNames)}>
                    <SortableContext items={incomeNames} strategy={horizontalListSortingStrategy}>
                      {incomeNames.map(name => (
                        <SortableColHead key={name} id={name} name={name}
                          onDelete={() => deleteColumn('income', name)}
                          onRename={newName => renameColumn('income', name, newName)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <th className="bg-emerald-700 px-1 py-0.5 text-right text-[10px] font-bold whitespace-nowrap border-l border-emerald-500">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {computed.map((m, idx) => {
                  const isSelected = m.month === currentMonth;
                  const baseColor = isSelected ? 'text-sky-700' : 'text-emerald-700';
                  const zeroColor = 'text-gray-300';
                  const rowBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30');
                  const stickyBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50');
                  return (
                    <tr key={m.id} className={`border-b border-emerald-50 transition-colors ${rowBg} hover:bg-emerald-50/60 cursor-pointer`} onClick={() => setCurrentMonth(m.month)}>
                      <td className={`sticky left-0 z-10 px-1 py-1 font-semibold text-xs whitespace-nowrap border-r border-emerald-100 ${stickyBg} ${isSelected ? 'text-sky-700' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />}
                          {MONTH_NAMES_PT[m.month - 1]}
                        </div>
                      </td>
                      {incomeNames.map(name => {
                        const item = m.incomeItems.find(i => i.name === name);
                        const val = item?.amount ?? 0;
                        return EC(m, 'income', name, item, val > 0 ? baseColor : zeroColor);
                      })}
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-emerald-100 ${isSelected ? 'text-sky-700' : 'text-emerald-700'}`}>
                        {formatCurrency(m.calc.cashIn)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-700 text-white font-bold border-t-2 border-emerald-400">
                  <td className="sticky left-0 z-10 bg-emerald-700 px-1 py-1 text-xs uppercase tracking-wider border-r border-emerald-500">TOTAL</td>
                  {incomeNames.map(name => (
                    <td key={name} className="px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap text-emerald-100">
                      {formatCurrency(incomeTotals[name] ?? 0)}
                    </td>
                  ))}
                  <td className="bg-emerald-700 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-emerald-500">
                    {formatCurrency(computed.reduce((s, m) => s + m.calc.cashIn, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            EXPENSES BREAKDOWN TABLE
        ═══════════════════════════════════════════════════════════════════ */}
        <TableHeader title="Expenses Breakdown" color="red"
          adding={addingCol === 'expense'} addValue={newColName}
          onAddChange={setNewColName} onAddStart={() => setAddingCol('expense')}
          onAddConfirm={() => addColumn('expense')}
          onAddCancel={() => { setAddingCol(null); setNewColName(''); }}
        />
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="sticky left-0 z-10 bg-red-600 px-1 py-1 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-red-500">MONTH</th>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('expenses', expenseNames)}>
                    <SortableContext items={expenseNames} strategy={horizontalListSortingStrategy}>
                      {expenseNames.map(name => (
                        <SortableColHead key={name} id={name} name={name}
                          onDelete={() => deleteColumn('expenses', name)}
                          onRename={newName => renameColumn('expenses', name, newName)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <th className="bg-red-700 px-1 py-0.5 text-right text-[10px] font-bold whitespace-nowrap border-l border-red-500">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {computed.map((m, idx) => {
                  const isSelected = m.month === currentMonth;
                  const baseColor = isSelected ? 'text-sky-700' : 'text-red-600';
                  const zeroColor = 'text-gray-300';
                  const rowBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30');
                  const stickyBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-red-50');
                  return (
                    <tr key={m.id} className={`border-b border-red-50 transition-colors ${rowBg} hover:bg-red-50/60 cursor-pointer`} onClick={() => setCurrentMonth(m.month)}>
                      <td className={`sticky left-0 z-10 px-1 py-1 font-semibold text-xs whitespace-nowrap border-r border-red-100 ${stickyBg} ${isSelected ? 'text-sky-700' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />}
                          {MONTH_NAMES_PT[m.month - 1]}
                        </div>
                      </td>
                      {expenseNames.map(name => {
                        const item = m.expenseItems.find(i => i.name === name);
                        const val = item?.amount ?? 0;
                        return EC(m, 'expenses', name, item, val > 0 ? baseColor : zeroColor);
                      })}
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-red-100 ${isSelected ? 'text-sky-700' : 'text-red-700'}`}>
                        {formatCurrency(m.calc.gastosR)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-red-700 text-white font-bold border-t-2 border-red-400">
                  <td className="sticky left-0 z-10 bg-red-700 px-1 py-1 text-xs uppercase tracking-wider border-r border-red-500">TOTAL</td>
                  {expenseNames.map(name => (
                    <td key={name} className="px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap text-red-100">
                      {formatCurrency(expenseTotals[name] ?? 0)}
                    </td>
                  ))}
                  <td className="bg-red-700 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-red-500">
                    {formatCurrency(computed.reduce((s, m) => s + m.calc.gastosR, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            EXTRAORDINARY BREAKDOWN TABLE
        ═══════════════════════════════════════════════════════════════════ */}
        <TableHeader title="Extraordinary Breakdown" color="violet"
          adding={addingCol === 'investment'} addValue={newColName}
          onAddChange={setNewColName} onAddStart={() => setAddingCol('investment')}
          onAddConfirm={() => addColumn('investment')}
          onAddCancel={() => { setAddingCol(null); setNewColName(''); }}
        />
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-violet-600 text-white">
                  <th className="sticky left-0 z-10 bg-violet-600 px-1 py-1 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-violet-500">MONTH</th>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('investments', investmentNames)}>
                    <SortableContext items={investmentNames} strategy={horizontalListSortingStrategy}>
                      {investmentNames.map(name => (
                        <SortableColHead key={name} id={name} name={name}
                          onDelete={() => deleteColumn('investments', name)}
                          onRename={newName => renameColumn('investments', name, newName)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <th className="bg-violet-700 px-1 py-0.5 text-right text-[10px] font-bold whitespace-nowrap border-l border-violet-500">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {computed.map((m, idx) => {
                  const isSelected = m.month === currentMonth;
                  const baseColor = isSelected ? 'text-sky-700' : 'text-violet-600';
                  const zeroColor = 'text-gray-300';
                  const rowBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-violet-50/30');
                  const stickyBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-violet-50');
                  return (
                    <tr key={m.id} className={`border-b border-violet-50 transition-colors ${rowBg} hover:bg-violet-50/60 cursor-pointer`} onClick={() => setCurrentMonth(m.month)}>
                      <td className={`sticky left-0 z-10 px-1 py-1 font-semibold text-xs whitespace-nowrap border-r border-violet-100 ${stickyBg} ${isSelected ? 'text-sky-700' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />}
                          {MONTH_NAMES_PT[m.month - 1]}
                        </div>
                      </td>
                      {investmentNames.map(name => {
                        const item = m.investmentItems.find(i => i.name === name);
                        const val = item?.amount ?? 0;
                        return EC(m, 'investments', name, item, val > 0 ? baseColor : zeroColor);
                      })}
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-violet-100 ${isSelected ? 'text-sky-700' : 'text-violet-700'}`}>
                        {formatCurrency(m.calc.savingsTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-violet-700 text-white font-bold border-t-2 border-violet-400">
                  <td className="sticky left-0 z-10 bg-violet-700 px-1 py-1 text-xs uppercase tracking-wider border-r border-violet-500">TOTAL</td>
                  {investmentNames.map(name => (
                    <td key={name} className="px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap text-violet-100">
                      {formatCurrency(investmentTotals[name] ?? 0)}
                    </td>
                  ))}
                  <td className="bg-violet-700 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-violet-500">
                    {formatCurrency(computed.reduce((s, m) => s + m.calc.savingsTotal, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        {/* ═══════════════════════════════════════════════════════════════════
            SAVINGS ACCOUNTS BREAKDOWN TABLE
        ═══════════════════════════════════════════════════════════════════ */}
        <TableHeader title="Savings Accounts" color="teal"
          adding={addingCol === 'savings'} addValue={newColName}
          onAddChange={setNewColName} onAddStart={() => setAddingCol('savings')}
          onAddConfirm={() => addColumn('savings')}
          onAddCancel={() => { setAddingCol(null); setNewColName(''); }}
        />
        <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="sticky left-0 z-10 bg-teal-600 px-1 py-1 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-teal-500">MONTH</th>
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd('savings', savingsAccountNames)}>
                    <SortableContext items={savingsAccountNames} strategy={horizontalListSortingStrategy}>
                      {savingsAccountNames.map(name => (
                        <SortableColHead key={name} id={name} name={name}
                          onDelete={() => deleteColumn('savings', name)}
                          onRename={newName => renameColumn('savings', name, newName)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <th className="bg-teal-700 px-1 py-0.5 text-right text-[10px] font-bold whitespace-nowrap border-l border-teal-500">DEPOSITED</th>
                  <th className="bg-teal-800 px-1 py-0.5 text-right text-[10px] font-bold whitespace-nowrap border-l border-teal-600">BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {computed.map((m, idx) => {
                  const isSelected = m.month === currentMonth;
                  const baseColor = isSelected ? 'text-sky-700' : 'text-teal-700';
                  const zeroColor = 'text-gray-300';
                  const rowBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30');
                  const stickyBg = isSelected ? 'bg-sky-50' : (idx % 2 === 0 ? 'bg-white' : 'bg-teal-50');
                  return (
                    <tr key={m.id} className={`border-b border-teal-50 transition-colors ${rowBg} hover:bg-teal-50/60 cursor-pointer`} onClick={() => setCurrentMonth(m.month)}>
                      <td className={`sticky left-0 z-10 px-1 py-1 font-semibold text-xs whitespace-nowrap border-r border-teal-100 ${stickyBg} ${isSelected ? 'text-sky-700' : 'text-gray-700'}`}>
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />}
                          {MONTH_NAMES_PT[m.month - 1]}
                        </div>
                      </td>
                      {savingsAccountNames.map(name => {
                        const item = m.savingsItems.find(i => i.name === name);
                        const val = item?.amount ?? 0;
                        return EC(m, 'savings', name, item, val > 0 ? baseColor : zeroColor);
                      })}
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-teal-100 ${isSelected ? 'text-sky-700' : 'text-teal-700'}`}>
                        {m.calc.savingsDeposits > 0 ? formatCurrency(m.calc.savingsDeposits) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-teal-200 ${isSelected ? 'text-sky-700' : 'text-teal-800'}`}>
                        {formatCurrency(m.totalSavingsBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-teal-700 text-white font-bold border-t-2 border-teal-400">
                  <td className="sticky left-0 z-10 bg-teal-700 px-1 py-1 text-xs uppercase tracking-wider border-r border-teal-500">TOTAL</td>
                  {savingsAccountNames.map(name => (
                    <td key={name} className="px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap text-teal-100">
                      {formatCurrency(savingsAccountTotals[name] ?? 0)}
                    </td>
                  ))}
                  <td className="bg-teal-700 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-teal-500">
                    {formatCurrency(totals.savingsDeposits)}
                  </td>
                  <td className="bg-teal-800 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-teal-600">
                    {formatCurrency(computed[computed.length - 1]?.totalSavingsBalance ?? 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        {savingsAccountNames.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No savings accounts yet — use "add column +" above to add one</p>
        )}

        </div>{/* end breakdown tables */}

      {activeNote && (
        <NotePopover
          note={activeNote}
          label={activeNote.label}
          position={activeNote.position}
          onSave={saveNote}
          onClose={() => setActiveNote(null)}
        />
      )}
    </div>
  );
}
