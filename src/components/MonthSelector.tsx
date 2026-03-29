import { MONTH_NAMES_PT } from '../types';

interface MonthSelectorProps {
  selectedYear: number;
  selectedMonth: number;
  availableYears: number[];
  onChange: (year: number, month: number) => void;
  className?: string;
}

export default function MonthSelector({
  selectedYear,
  selectedMonth,
  availableYears,
  onChange,
  className,
}: MonthSelectorProps) {
  const hasPrevYear = availableYears.includes(selectedYear - 1);
  const hasNextYear = availableYears.includes(selectedYear + 1);

  const canPrev = selectedMonth > 1 || hasPrevYear;
  const canNext = selectedMonth < 12 || hasNextYear;

  const handlePrev = () => {
    if (selectedMonth > 1) {
      onChange(selectedYear, selectedMonth - 1);
    } else if (hasPrevYear) {
      onChange(selectedYear - 1, 12);
    }
  };

  const handleNext = () => {
    if (selectedMonth < 12) {
      onChange(selectedYear, selectedMonth + 1);
    } else if (hasNextYear) {
      onChange(selectedYear + 1, 1);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <button
        onClick={handlePrev}
        disabled={!canPrev}
        title="Previous month"
        className="w-7 h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm text-sm font-medium transition-colors"
      >
        ‹
      </button>
      <select
        value={selectedMonth}
        onChange={e => onChange(selectedYear, Number(e.target.value))}
        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer"
      >
        {MONTH_NAMES_PT.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      <button
        onClick={handleNext}
        disabled={!canNext}
        title="Next month"
        className="w-7 h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm text-sm font-medium transition-colors"
      >
        ›
      </button>
    </div>
  );
}
