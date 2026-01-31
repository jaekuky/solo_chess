// src/components/statistics/StatCard.tsx

import { cn } from '@/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'green' | 'red' | 'blue' | 'yellow';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'default',
  className,
}: StatCardProps) {
  const colorConfig = {
    default: 'text-gray-900 dark:text-gray-100',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={cn('text-2xl font-bold', colorConfig[color])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <span className="text-2xl opacity-80">{icon}</span>
        )}
      </div>

      {trend && (
        <div
          className={cn(
            'mt-2 text-xs flex items-center gap-1',
            trend.isPositive ? 'text-green-500' : 'text-red-500',
          )}
        >
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span className="text-gray-400">vs 지난주</span>
        </div>
      )}
    </div>
  );
}
