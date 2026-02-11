// src/components/statistics/EndReasonChart.tsx
// 게임 종료 사유별 분석 차트 (Mixpanel 스타일 분석)

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import type { GameEndReason } from '@/types';
import { cn } from '@/utils';

interface EndReasonChartProps {
  stats: Record<Exclude<GameEndReason, null>, number>;
  className?: string;
}

interface ReasonData {
  key: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: string;
  description: string;
}

const REASON_CONFIG: Record<
  Exclude<GameEndReason, null>,
  { name: string; color: string; icon: string; description: string }
> = {
  checkmate: {
    name: '체크메이트',
    color: '#22c55e',
    icon: '♚',
    description: '킹이 도망갈 수 없는 체크',
  },
  resignation: {
    name: '기권',
    color: '#ef4444',
    icon: '🏳️',
    description: '플레이어 또는 AI가 포기',
  },
  timeout: {
    name: '시간 초과',
    color: '#f59e0b',
    icon: '⏰',
    description: '제한 시간을 모두 소진',
  },
  stalemate: {
    name: '스테일메이트',
    color: '#6b7280',
    icon: '🤝',
    description: '합법적인 수가 없으나 체크가 아닌 상태',
  },
  draw_agreement: {
    name: '무승부 합의',
    color: '#9ca3af',
    icon: '🤝',
    description: '양측이 무승부에 합의',
  },
  insufficient_material: {
    name: '기물 부족',
    color: '#a78bfa',
    icon: '♟️',
    description: '체크메이트가 불가능한 기물 조합',
  },
  fifty_move_rule: {
    name: '50수 규칙',
    color: '#64748b',
    icon: '📏',
    description: '50수 동안 기물 포획이나 폰 이동 없음',
  },
  threefold_repetition: {
    name: '3회 반복',
    color: '#78716c',
    icon: '🔄',
    description: '동일 포지션이 3회 반복',
  },
};

// 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ReasonData }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-lg max-w-[220px]">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{data.icon}</span>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {data.name}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{data.description}</p>
      <div className="flex justify-between text-sm border-t border-gray-100 dark:border-gray-700 pt-1.5">
        <span className="text-gray-500">횟수</span>
        <span className="font-bold" style={{ color: data.color }}>
          {data.value}회 ({data.percentage.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

export function EndReasonChart({ stats, className }: EndReasonChartProps) {
  const total = useMemo(
    () => Object.values(stats).reduce((sum, v) => sum + v, 0),
    [stats],
  );

  const chartData = useMemo<ReasonData[]>(() => {
    return (Object.entries(stats) as [Exclude<GameEndReason, null>, number][])
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        key,
        ...REASON_CONFIG[key],
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats, total]);

  if (total === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8', className)}>
        <p className="text-gray-400">아직 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 파이 차트 */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">종료 사유 비율</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="transparent"
                    className="hover:opacity-80 cursor-pointer transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 수평 바 차트 */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 mb-2">종료 사유 순위</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e5e7eb"
                className="dark:opacity-20"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} animationDuration={600} maxBarSize={24}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 목록 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {chartData.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {item.icon} {item.name}
              </p>
              <p className="text-xs text-gray-500">
                {item.value}회 · {item.percentage.toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
