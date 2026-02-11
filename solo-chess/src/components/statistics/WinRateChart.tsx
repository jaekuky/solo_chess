// src/components/statistics/WinRateChart.tsx

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { cn } from '@/utils';

interface WinRateChartProps {
  wins: number;
  losses: number;
  draws: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const COLORS = {
  wins: '#22c55e',   // green-500
  draws: '#9ca3af',  // gray-400
  losses: '#ef4444', // red-500
};

const DARK_COLORS = {
  wins: '#4ade80',   // green-400
  draws: '#6b7280',  // gray-500
  losses: '#f87171', // red-400
};

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  darkColor: string;
  percentage: string;
}

// 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartDataItem }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-medium" style={{ color: data.color }}>
        {data.name}: {data.value}게임
      </p>
      <p className="text-xs text-gray-500">{data.percentage}</p>
    </div>
  );
}

// 커스텀 레이블
function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  if (cx == null || cy == null || midAngle == null || innerRadius == null || outerRadius == null) {
    return null;
  }
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {percent != null ? `${(percent * 100).toFixed(1)}%` : ''}
    </text>
  );
}

export function WinRateChart({
  wins,
  losses,
  draws,
  size = 'md',
  showLabels = true,
  className,
}: WinRateChartProps) {
  const total = wins + losses + draws;

  const chartData = useMemo<ChartDataItem[]>(() => {
    if (total === 0) return [];
    const items: ChartDataItem[] = [];
    if (wins > 0)
      items.push({
        name: '승리',
        value: wins,
        color: COLORS.wins,
        darkColor: DARK_COLORS.wins,
        percentage: `${((wins / total) * 100).toFixed(1)}%`,
      });
    if (draws > 0)
      items.push({
        name: '무승부',
        value: draws,
        color: COLORS.draws,
        darkColor: DARK_COLORS.draws,
        percentage: `${((draws / total) * 100).toFixed(1)}%`,
      });
    if (losses > 0)
      items.push({
        name: '패배',
        value: losses,
        color: COLORS.losses,
        darkColor: DARK_COLORS.losses,
        percentage: `${((losses / total) * 100).toFixed(1)}%`,
      });
    return items;
  }, [wins, losses, draws, total]);

  const sizeConfig = {
    sm: { height: 120, innerRadius: 28, outerRadius: 48, showLegend: false },
    md: { height: 200, innerRadius: 45, outerRadius: 75, showLegend: true },
    lg: { height: 260, innerRadius: 55, outerRadius: 95, showLegend: true },
  };

  const config = sizeConfig[size];

  if (total === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)} style={{ height: config.height }}>
        <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <span className="text-gray-400 text-xs">N/A</span>
        </div>
        <p className="text-sm text-gray-400 mt-2">기록 없음</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={config.height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
            label={
              size !== 'sm'
                ? (props: PieLabelRenderProps) =>
                    renderCustomLabel({
                      cx: props.cx as number | undefined,
                      cy: props.cy as number | undefined,
                      midAngle: props.midAngle as number | undefined,
                      innerRadius: props.innerRadius as number | undefined,
                      outerRadius: props.outerRadius as number | undefined,
                      percent: props.percent as number | undefined,
                    })
                : undefined
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="transparent"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLabels && config.showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* 중앙 텍스트 (도넛 차트 중앙) */}
      {size !== 'sm' && (
        <div
          className="flex flex-col items-center -mt-2"
          style={{ marginTop: -(config.height / 2 + 18) + 'px', position: 'relative', pointerEvents: 'none' }}
        >
          <div className="flex flex-col items-center justify-center" style={{ height: config.height }}>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {((wins / total) * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-500">승률</span>
          </div>
        </div>
      )}

      {/* sm 사이즈일 때 간단한 레이블 */}
      {showLabels && size === 'sm' && (
        <div className="flex justify-center gap-3 mt-1 text-xs">
          <span className="text-green-600 dark:text-green-400">
            {wins}승
          </span>
          <span className="text-gray-500">
            {draws}무
          </span>
          <span className="text-red-600 dark:text-red-400">
            {losses}패
          </span>
        </div>
      )}
    </div>
  );
}
