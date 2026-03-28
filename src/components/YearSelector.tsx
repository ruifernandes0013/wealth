import { ChevronDown } from 'lucide-react';

interface YearSelectorProps {
  selectedYear: number;
  availableYears: number[];
  onSelectYear: (year: number) => void;
  onCreateYear: (year: number) => Promise<void>;
  className?: string;
}

export default function YearSelector({
  selectedYear,
  availableYears,
  onSelectYear,
  onCreateYear,
  className,
}: YearSelectorProps) {
  const prevYear = selectedYear - 1;
  const nextYear = selectedYear + 1;
  const hasPrev = availableYears.includes(prevYear);
  const hasNext = availableYears.includes(nextYear);

  const handlePrev = async () => {
    if (!hasPrev) await onCreateYear(prevYear);
    onSelectYear(prevYear);
  };

  const handleNext = async () => {
    if (!hasNext) await onCreateYear(nextYear);
    onSelectYear(nextYear);
  };

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      <button
        onClick={() => void handlePrev()}
        title={hasPrev ? `${prevYear}` : `Add ${prevYear}`}
        className="w-7 h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm text-sm font-medium transition-colors"
      >
        ‹
      </button>
      <div className="relative">
        <select
          value={selectedYear}
          onChange={(e) => onSelectYear(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      <button
        onClick={() => void handleNext()}
        title={hasNext ? `${nextYear}` : `Add ${nextYear}`}
        className="w-7 h-[34px] flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 shadow-sm text-sm font-medium transition-colors"
      >
        ›
      </button>
    </div>
  );
}
