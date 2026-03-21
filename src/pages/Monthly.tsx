import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, ChevronDown, Loader2, Circle, MessageSquare, Plus } from 'lucide-react';
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
  title: string; color: 'red' | 'violet' | 'emerald';
  adding?: boolean; addValue?: string;
  onAddChange?: (v: string) => void; onAddStart?: () => void;
  onAddConfirm?: () => void; onAddCancel?: () => void;
}) {
  const colors = {
    red: 'text-red-700 border-red-200',
    violet: 'text-violet-700 border-violet-200',
    emerald: 'text-emerald-700 border-emerald-200',
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
  table: 'income' | 'expenses' | 'investments';
  itemId: string;
  label: string;
  value: string;
  position: { x: number; y: number };
}

interface EditCellState {
  table: 'income' | 'expenses' | 'investments' | 'gastosEx';
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
      <th style={style} className="px-1 py-1 text-right text-xs font-semibold whitespace-nowrap min-w-[70px]">
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
        className="px-1 py-1 text-xs font-semibold whitespace-nowrap group/col min-w-[60px] cursor-grab active:cursor-grabbing touch-none">
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
    upsertLineItem, addLineItem, deleteLineItem, updateMonthMeta, updateYearConfig,
    getMonthsForYear, getYearConfig, getAvailableYears,
  } = useData();

  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [balanceInput, setBalanceInput] = useState('');
  const [editingBalance, setEditingBalance] = useState(false);
  const [activeNote, setActiveNote] = useState<ActiveNote | null>(null);
  const [addingCol, setAddingCol] = useState<'income' | 'expense' | 'investment' | null>(null);
  const [newColName, setNewColName] = useState('');
  const [editCell, setEditCell] = useState<EditCellState | null>(null);
  const [editCellVal, setEditCellVal] = useState('');

  const months = getMonthsForYear(selectedYear);
  const yearConfig = getYearConfig(selectedYear);
  const computed = calcYearMonths(months, state.income, state.expenses, state.investments, yearConfig.initialBalance);

  const today = new Date();
  const currentMonth = today.getFullYear() === selectedYear ? today.getMonth() + 1 : -1;

  // Dynamic column names sorted by sortOrder
  const incomeNames = getUniqueNames(state.income, selectedYear);
  const expenseNames = getUniqueNames(state.expenses, selectedYear);
  const investmentNames = getUniqueNames(state.investments, selectedYear);

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

  const addColumn = async (section: 'income' | 'expense' | 'investment') => {
    const name = newColName.trim();
    if (!name) { setAddingCol(null); setNewColName(''); return; }
    const table = section === 'income' ? 'income' : section === 'expense' ? 'expenses' : 'investments';
    await addLineItem(table, selectedYear, 1, name);
    setAddingCol(null);
    setNewColName('');
  };

  const deleteColumn = async (table: 'income' | 'expenses' | 'investments', name: string) => {
    const items = state[table].filter(i => i.year === selectedYear && i.name === name);
    await Promise.all(items.map(i => deleteLineItem(table, i.id)));
  };

  const reorderColumns = async (table: 'income' | 'expenses' | 'investments', newOrder: string[]) => {
    const updates = newOrder.flatMap((name, newIdx) =>
      state[table].filter(i => i.year === selectedYear && i.name === name)
        .map(i => upsertLineItem(table, { ...i, sortOrder: newIdx }))
    );
    await Promise.all(updates);
  };

  const renameColumn = async (
    table: 'income' | 'expenses' | 'investments',
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
  const [zoomIdx, setZoomIdx] = useState(2); // default 0.9
  const zoom = ZOOM_STEPS[zoomIdx];

  const handleDragEnd = (table: 'income' | 'expenses' | 'investments', names: string[]) =>
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
    table: 'income' | 'expenses' | 'investments',
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
    guardado: acc.guardado + m.calc.guardado,
  }), { cashIn: 0, cashOut: 0, gastosR: 0, gastosEx: 0, saldo: 0, savingsTotal: 0, guardado: 0 });

  const incomeTotals: Record<string, number> = {};
  incomeNames.forEach(name => {
    incomeTotals[name] = computed.reduce((s, m) => s + (m.incomeItems.find(i => i.name === name)?.amount ?? 0), 0);
  });

  const avgSavingsPct = computed.length > 0
    ? computed.reduce((s, m) => s + m.calc.savingsPct, 0) / computed.length : 0;

  const incomeGroupColspan = incomeNames.length + 2; // cols + add btn + CASH IN

  const rowStyle = (m: MonthWithCalc) => {
    const isCurrent = m.month === currentMonth;
    const isProjected = !m.confirmed && !isCurrent;
    if (isCurrent) return { row: 'bg-sky-50 hover:bg-sky-100/70', sticky: 'bg-sky-50', text: 'text-sky-700', muted: 'text-sky-600/60', projected: false };
    if (isProjected) return { row: 'bg-gray-50/60 hover:bg-gray-100/60', sticky: 'bg-gray-50/60', text: 'text-gray-400', muted: 'text-gray-300', projected: true };
    return { row: 'bg-white hover:bg-gray-50', sticky: 'bg-white', text: 'text-gray-800', muted: 'text-gray-500', projected: false };
  };

  const thBase = 'px-1.5 py-1 text-xs font-semibold whitespace-nowrap text-right';
  const tdBase = 'px-1.5 py-1.5 text-right tabular-nums whitespace-nowrap';

  // ── Inline editable + notable breakdown cell ──────────────────────────────
  const EC = (
    m: MonthWithCalc,
    table: 'income' | 'expenses' | 'investments',
    name: string,
    item: LineItem | undefined,
    colorClass: string,
    extraClass = '',
  ) => {
    const value = item?.amount ?? 0;
    const note = item?.note ?? '';
    const isEditing = editCell?.table === table && editCell.month === m.month && editCell.name === name;
    return (
      <td
        key={`${m.id}-${table}-${name}`}
        className={`relative group/ec px-1.5 py-1.5 text-right tabular-nums text-xs whitespace-nowrap ${
          isEditing ? 'ring-1 ring-inset ring-violet-400 bg-violet-50/40' : 'cursor-pointer'
        } ${colorClass} ${extraClass}`}
        onClick={e => { e.stopPropagation(); if (!isEditing) startEdit(table, m.year, m.month, name, value); }}
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
        {!isEditing && item && (
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

        {/* Header */}
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
        </div>

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
                  <th colSpan={5} className="bg-red-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-red-700">OUTGOING</th>
                  <th colSpan={4} className="bg-violet-600 text-white text-center text-xs font-bold uppercase tracking-widest py-2 border-x border-violet-700">RESULT</th>
                  <th rowSpan={2} className="bg-gray-800 text-white text-center px-2 py-1 text-xs border-l border-gray-700 align-middle cursor-pointer">✓</th>
                </tr>
                <tr>
                  {incomeNames.map(name => (
                    <th key={name} className={`${thBase} bg-emerald-700/80 text-emerald-100`}>{name.substring(0, 7).toUpperCase()}</th>
                  ))}
                  <th className="px-2 py-1 bg-emerald-700/60 text-emerald-200" title="Add income column (use Income table below)">·</th>
                  <th className={`${thBase} bg-emerald-900 text-emerald-200 border-l border-emerald-600 font-bold`}>CASH IN</th>
                  <th className={`${thBase} bg-red-700/80 text-red-100 border-l border-red-600`} title="Click cell to set override">G.EX.</th>
                  <th className={`${thBase} bg-red-700/80 text-red-100`}>G.REAL</th>
                  <th className={`${thBase} bg-red-700/80 text-red-100`}>SALDO</th>
                  <th className={`${thBase} bg-red-700/80 text-red-100`}>INVEST/HOL.</th>
                  <th className={`${thBase} bg-red-900 text-red-200 border-l border-red-600 font-bold`}>CASH OUT</th>
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
                    <tr key={m.id} className={`transition-colors border-b border-gray-100 ${s.row} group`}>
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
                      <td className={`${tdBase} font-bold text-sm border-l border-emerald-100 ${s.projected ? 'text-emerald-300' : 'text-emerald-600'}`}>{formatCurrency(m.calc.cashIn)}</td>
                      {GE(m, s.projected ? 'text-gray-300' : 'text-gray-500')}
                      <td className={`${tdBase} text-xs border-l border-red-50 ${s.projected ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(m.calc.gastosR)}</td>
                      <td className={`${tdBase} text-xs ${m.calc.saldo > 0 ? (s.projected ? 'text-orange-300' : 'text-orange-500') : (s.projected ? 'text-gray-300' : 'text-gray-400')}`}>{m.calc.saldo !== 0 ? formatCurrency(m.calc.saldo) : '—'}</td>
                      <td className={`${tdBase} text-xs ${s.projected ? 'text-violet-300' : 'text-violet-500'}`}>{formatCurrency(m.calc.savingsTotal)}</td>
                      <td className={`${tdBase} font-bold text-sm border-l border-red-100 ${s.projected ? 'text-red-300' : 'text-red-600'}`}>{formatCurrency(m.calc.cashOut)}</td>
                      <td className={`${tdBase} font-bold text-sm border-l border-violet-100 ${m.calc.guardado < 0 ? 'text-red-500' : s.projected ? 'text-violet-300' : 'text-violet-600'}`}>{formatCurrency(m.calc.guardado)}</td>
                      <td className={`${tdBase} text-xs font-semibold ${s.projected ? 'text-gray-300' : m.calc.savingsPct >= 60 ? 'text-emerald-600' : m.calc.savingsPct >= 40 ? 'text-sky-500' : m.calc.savingsPct >= 20 ? 'text-amber-500' : 'text-red-500'}`}>{formatPct(m.calc.savingsPct)}</td>
                      <td className={`${tdBase} text-xs ${s.projected ? 'text-violet-300' : 'text-violet-500'}`}>{formatCurrency(m.ano)}</td>
                      <td className={`${tdBase} font-bold text-sm border-l border-violet-100 ${m.totalBalance < 0 ? 'text-red-500' : s.projected ? 'text-blue-300' : 'text-blue-600'}`}>{formatCurrency(m.totalBalance)}</td>
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
                    <td className={`${tdBase} text-xs text-gray-300`}>{formatCurrency(totals.gastosR)}</td>
                    <td className={`${tdBase} text-xs text-orange-300`}>{formatCurrency(totals.saldo)}</td>
                    <td className={`${tdBase} text-xs text-violet-300`}>{formatCurrency(totals.savingsTotal)}</td>
                    <td className={`${tdBase} text-sm text-red-300 border-l border-gray-700`}>{formatCurrency(totals.cashOut)}</td>
                    <td className={`${tdBase} text-sm text-violet-300 border-l border-gray-700`}>{formatCurrency(totals.guardado)}</td>
                    <td className={`${tdBase} text-xs text-gray-300`}>{formatPct(avgSavingsPct)}</td>
                    <td className={`${tdBase} text-xs text-gray-400`}>—</td>
                    <td className={`${tdBase} text-sm text-blue-300 border-l border-gray-700`}>{formatCurrency(computed[computed.length - 1]?.totalBalance ?? 0)}</td>
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
                  <th className="sticky left-0 z-10 bg-emerald-600 px-2 py-1 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-emerald-500">MONTH</th>
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
                  const isProjected = !m.confirmed && m.month !== currentMonth;
                  const baseColor = isProjected ? 'text-gray-400' : 'text-emerald-700';
                  const zeroColor = isProjected ? 'text-gray-300' : 'text-gray-300';
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30';
                  return (
                    <tr key={m.id} className={`border-b border-emerald-50 transition-colors ${rowBg} hover:bg-emerald-50/60`}>
                      <td className={`sticky left-0 z-10 px-2 py-1 font-semibold text-xs whitespace-nowrap border-r border-emerald-100 ${rowBg} ${isProjected ? 'text-gray-400' : 'text-gray-700'}`}>
                        {MONTH_NAMES_PT[m.month - 1]}
                      </td>
                      {incomeNames.map(name => {
                        const item = m.incomeItems.find(i => i.name === name);
                        const val = item?.amount ?? 0;
                        return EC(m, 'income', name, item, val > 0 ? baseColor : zeroColor);
                      })}
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-emerald-100 shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.1)] ${isProjected ? 'bg-emerald-50/80 text-emerald-300' : 'bg-white text-emerald-700'}`}>
                        {formatCurrency(m.calc.cashIn)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-700 text-white font-bold border-t-2 border-emerald-400">
                  <td className="sticky left-0 z-10 bg-emerald-700 px-2 py-1 text-xs uppercase tracking-wider border-r border-emerald-500">TOTAL</td>
                  {incomeNames.map(name => <td key={name} />)}
                  <td className="bg-emerald-700 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-emerald-500 shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.3)]">
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
                  <th className="sticky left-0 z-10 bg-red-600 px-2 py-1 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-red-500">MONTH</th>
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
                  const isProjected = !m.confirmed && m.month !== currentMonth;
                  const baseColor = isProjected ? 'text-gray-400' : 'text-red-600';
                  const zeroColor = isProjected ? 'text-gray-300' : 'text-gray-300';
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30';
                  return (
                    <tr key={m.id} className={`border-b border-red-50 transition-colors ${rowBg} hover:bg-red-50/60`}>
                      <td className={`sticky left-0 z-10 px-2 py-1 font-semibold text-xs whitespace-nowrap border-r border-red-100 ${rowBg} ${isProjected ? 'text-gray-400' : 'text-gray-700'}`}>
                        {MONTH_NAMES_PT[m.month - 1]}
                      </td>
                      {expenseNames.map(name => {
                        const item = m.expenseItems.find(i => i.name === name);
                        const val = item?.amount ?? 0;
                        return EC(m, 'expenses', name, item, val > 0 ? baseColor : zeroColor);
                      })}
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-red-100 shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.1)] ${isProjected ? 'bg-red-50/80 text-red-300' : 'bg-white text-red-700'}`}>
                        {formatCurrency(m.calc.gastosR)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-red-700 text-white font-bold border-t-2 border-red-400">
                  <td className="sticky left-0 z-10 bg-red-700 px-2 py-1 text-xs uppercase tracking-wider border-r border-red-500">TOTAL</td>
                  {expenseNames.map(name => <td key={name} />)}
                  <td className="bg-red-700 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-red-500 shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.3)]">
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
        <TableHeader title="Investments & Holidays Breakdown" color="violet"
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
                  <th className="sticky left-0 z-10 bg-violet-600 px-2 py-1 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap border-r border-violet-500">MONTH</th>
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
                  const isProjected = !m.confirmed && m.month !== currentMonth;
                  const baseColor = isProjected ? 'text-gray-400' : 'text-violet-600';
                  const zeroColor = isProjected ? 'text-gray-300' : 'text-gray-300';
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-violet-50/30';
                  return (
                    <tr key={m.id} className={`border-b border-violet-50 transition-colors ${rowBg} hover:bg-violet-50/60`}>
                      <td className={`sticky left-0 z-10 px-2 py-1 font-semibold text-xs whitespace-nowrap border-r border-violet-100 ${rowBg} ${isProjected ? 'text-gray-400' : 'text-gray-700'}`}>
                        {MONTH_NAMES_PT[m.month - 1]}
                      </td>
                      {investmentNames.map(name => {
                        const item = m.investmentItems.find(i => i.name === name);
                        const val = item?.amount ?? 0;
                        return EC(m, 'investments', name, item, val > 0 ? baseColor : zeroColor);
                      })}
                      <td className={`px-1 py-0.5 text-right tabular-nums text-[10px] font-bold whitespace-nowrap border-l border-violet-100 shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.1)] ${isProjected ? 'bg-violet-50/80 text-violet-300' : 'bg-white text-violet-700'}`}>
                        {formatCurrency(m.calc.savingsTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-violet-700 text-white font-bold border-t-2 border-violet-400">
                  <td className="sticky left-0 z-10 bg-violet-700 px-2 py-1 text-xs uppercase tracking-wider border-r border-violet-500">TOTAL</td>
                  {investmentNames.map(name => <td key={name} />)}
                  <td className="bg-violet-700 px-1 py-0.5 text-right tabular-nums text-[10px] whitespace-nowrap border-l border-violet-500 shadow-[-2px_0_8px_-4px_rgba(0,0,0,0.3)]">
                    {formatCurrency(computed.reduce((s, m) => s + m.calc.savingsTotal, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
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
