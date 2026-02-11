// src/components/statistics/TimeOfDayChart.tsx
// 시간대별 게임 활동 시각화 (Amplitude 스타일 히트맵/바 차트)

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TimeOfDayStats } from '@/types';
import { cn } from '@/utils';

interface TimeOfDayChartProps {
  stats: TimeOfDayStats;
  className?: string;
}

interface TimeSlotData {
  key: keyof TimeOfDayStats;
  label: string;
  shortLabel: string;
  icon: string;
  timeRange: string;
  value: number;
  percentage: number;
  color: string;
}

const TIME_SLOT_CONFIG: Record<
  keyof TimeOfDayStats,
  { label: string; shortLabel: string; icon: string; timeRange: string; color: string; bgColor: string }
> = {
  morning: {
    label: '오전',
    shortLabel: '오전',
    icon: '🌅',
    timeRange: '06:00 - 12:00',
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
  afternoon: {
    label: '오후',
    shortLabel: '오후',
    icon: '☀️',
    timeRange: '12:00 - 18:00',
    color: '#f97316',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  evening: {
    label: '저녁',
    shortLabel: '저녁',
    icon: '🌆',
    timeRange: '18:00 - 24:00',
    color: '#8b5cf6',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
  },
  night: {
    label: '심야',
    shortLabel: '심야',
    icon: '🌙',
    timeRange: '00:00 - 06:00',
    color: '#3b82f6',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
};

// 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TimeSlotData }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{data.icon}</span>
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{data.label}</p>
          <p className="text-xs text-gray-500">{data.timeRange}</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">게임 수</span>
          <span className="font-bold" style={{ color: data.color }}>
            {data.value}게임
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">비율</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {data.percentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function TimeOfDayChart({ stats, className }: TimeOfDayChartProps) {
  const total = stats.morning + stats.afternoon + stats.evening + stats.night;

  const chartData = useMemo<TimeSlotData[]>(() => {
    const slots: (keyof TimeOfDayStats)[] = ['morning', 'afternoon', 'evening', 'night'];
    return slots.map((key) => ({
      key,
      ...TIME_SLOT_CONFIG[key],
      value: stats[key],
      percentage: total > 0 ? (stats[key] / total) * 100 : 0,
    }));
  }, [stats, total]);

  // 가장 활동적인 시간대
  const peakTime = useMemo(() => {
    if (total === 0) return null;
    return chartData.reduce((max, curr) => (curr.value > max.value ? curr : max));
  }, [chartData, total]);

  if (total === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <p className="text-gray-400">아직 플레이 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 피크 타임 배지 */}
      {peakTime && (
        <div className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
          TIME_SLOT_CONFIG[peakTime.key].bgColor,
        )}>
          <span>{peakTime.icon}</span>
          <span className="font-medium" style={{ color: peakTime.color }}>
            최다 활동 시간: {peakTime.label} ({peakTime.timeRange})
          </span>
        </div>
      )}

      {/* 바 차트 */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={600} maxBarSize={80}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 시간대별 카드 (하단) */}
      <div className="grid grid-cols-4 gap-2">
        {chartData.map((slot) => (
          <div
            key={slot.key}
            className={cn(
              'text-center p-2 rounded-lg transition-all',
              TIME_SLOT_CONFIG[slot.key].bgColor,
              peakTime?.key === slot.key && 'ring-2 ring-offset-1',
            )}
            style={peakTime?.key === slot.key ? { ringColor: slot.color } as React.CSSProperties : undefined}
          >
            <span className="text-lg">{slot.icon}</span>
            <p className="text-xs text-gray-500 mt-0.5">{slot.timeRange}</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: slot.color }}>
              {slot.percentage.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
