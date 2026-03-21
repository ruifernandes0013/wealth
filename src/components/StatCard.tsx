import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  colorClass?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  colorClass = 'text-gray-900',
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${colorClass} leading-tight`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400">{subtitle}</p>
      )}
      {trend && (
        <p
          className={`text-xs font-medium ${
            trend.positive ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {trend.positive ? '▲' : '▼'} {trend.value}
        </p>
      )}
    </div>
  );
}
