import { useState } from 'react';
import { Plus } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  onAddYear: (year: number) => Promise<void>;
  className?: string;
}

export default function YearSelector({
  selectedYear,
  availableYears,
  onSelectYear,
  onAddYear,
  className,
}: YearSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const sorted = [...availableYears].sort((a, b) => a - b);
  const idx = sorted.indexOf(selectedYear);
  const hasPrev = idx > 0;
  const hasNext = idx < sorted.length - 1;

  const handleConfirm = async () => {
    const year = parseInt(input, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      setError('Enter a valid year (2000–2100)');
      return;
    }
    if (availableYears.includes(year)) {
      setError('That year already exists');
      return;
    }
    setShowModal(false);
    setInput('');
    setError('');
    await onAddYear(year);
  };

  const defaultNewYear = sorted.length > 0 ? sorted[sorted.length - 1] + 1 : new Date().getFullYear();

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      {hasPrev && (
        <button
          onClick={() => onSelectYear(sorted[idx - 1])}
          title={String(sorted[idx - 1])}
          className="w-7 h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm text-sm font-medium transition-colors"
        >‹</button>
      )}

      <div className="relative">
        <select
          value={selectedYear}
          onChange={(e) => onSelectYear(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
        >
          {sorted.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <svg className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {hasNext && (
        <button
          onClick={() => onSelectYear(sorted[idx + 1])}
          title={String(sorted[idx + 1])}
          className="w-7 h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm text-sm font-medium transition-colors"
        >›</button>
      )}

      <button
        onClick={() => { setInput(String(defaultNewYear)); setError(''); setShowModal(true); }}
        title="Add year"
        className="flex items-center gap-1 h-[34px] px-2.5 rounded-lg border border-dashed border-gray-300 bg-white text-gray-400 hover:border-violet-400 hover:text-violet-500 shadow-sm text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Year
      </button>

      {showModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowModal(false)} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-72">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Add New Year</h3>
            <input
              type="number"
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') void handleConfirm(); if (e.key === 'Escape') setShowModal(false); }}
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 tabular-nums"
              placeholder="e.g. 2027"
            />
            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => void handleConfirm()} className="flex-1 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
