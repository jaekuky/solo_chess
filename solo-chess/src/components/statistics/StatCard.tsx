// src/components/statistics/StatCard.tsx

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
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
  sparklineData?: number[];
  color?: 'default' | 'green' | 'red' | 'blue' | 'yellow' | 'purple';
  className?: string;
}

const colorConfig = {
  default: {
    text: 'text-gray-900 dark:text-gray-100',
    sparkline: '#6b7280',
    gradient: 'rgba(107, 114, 128, 0.15)',
  },
  green: {
    text: 'text-green-600 dark:text-green-400',
    sparkline: '#22c55e',
    gradient: 'rgba(34, 197, 94, 0.15)',
  },
  red: {
    text: 'text-red-600 dark:text-red-400',
    sparkline: '#ef4444',
    gradient: 'rgba(239, 68, 68, 0.15)',
  },
  blue: {
    text: 'text-blue-600 dark:text-blue-400',
    sparkline: '#3b82f6',
    gradient: 'rgba(59, 130, 246, 0.15)',
  },
  yellow: {
    text: 'text-yellow-600 dark:text-yellow-400',
    sparkline: '#f59e0b',
    gradient: 'rgba(245, 158, 11, 0.15)',
  },
  purple: {
    text: 'text-purple-600 dark:text-purple-400',
    sparkline: '#8b5cf6',
    gradient: 'rgba(139, 92, 246, 0.15)',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  sparklineData,
  color = 'default',
  className,
}: StatCardProps) {
  const config = colorConfig[color];
  const sparkId = `spark-${title.replace(/\s+/g, '-')}`;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm',
        'border border-transparent hover:border-gray-200 dark:hover:border-gray-700',
        'transition-all hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className={cn('text-2xl font-bold', config.text)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {icon && (
          <span className="text-2xl opacity-70 flex-shrink-0 ml-2">{icon}</span>
        )}
      </div>

      {/* 트렌드 표시 */}
      {trend && (
        <div
          className={cn(
            'mt-2 text-xs font-medium flex items-center gap-1',
            trend.isPositive ? 'text-green-500' : 'text-red-500',
          )}
        >
          <span className="text-base leading-none">
            {trend.isPositive ? '↑' : '↓'}
          </span>
          <span>{Math.abs(trend.value).toFixed(1)}%</span>
          <span className="text-gray-400 font-normal">vs 지난 기간</span>
        </div>
      )}

      {/* 미니 스파크라인 */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2 -mx-1">
          <ResponsiveContainer width="100%" height={32}>
            <AreaChart data={sparklineData.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.sparkline} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={config.sparkline} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={config.sparkline}
                strokeWidth={1.5}
                fill={`url(#${sparkId})`}
                dot={false}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
