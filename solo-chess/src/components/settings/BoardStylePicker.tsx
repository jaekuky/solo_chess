// src/components/settings/BoardStylePicker.tsx

import type { BoardStyle } from '@/types';
import { BOARD_STYLE_CONFIG } from '@/constants';
import { cn } from '@/utils';

interface BoardStylePickerProps {
  value: BoardStyle;
  onChange: (style: BoardStyle) => void;
}

export function BoardStylePicker({ value, onChange }: BoardStylePickerProps) {
  const styles = Object.entries(BOARD_STYLE_CONFIG) as [
    BoardStyle,
    (typeof BOARD_STYLE_CONFIG)[BoardStyle],
  ][];

  return (
    <div className="py-2">
      <label className="font-medium block mb-3">보드 스타일</label>

      <div className="grid grid-cols-4 gap-3">
        {styles.map(([style, config]) => (
          <button
            key={style}
            type="button"
            onClick={() => onChange(style)}
            className={cn(
              'p-2 rounded-lg border-2 transition-all',
              'hover:shadow-md',
              value === style
                ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                : 'border-gray-200 dark:border-gray-700'
            )}
          >
            {/* 미니 보드 프리뷰 */}
            <div className="w-full aspect-square rounded overflow-hidden mb-2">
              <div className="grid grid-cols-4 h-full">
                {Array.from({ length: 16 }, (_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isLight = (row + col) % 2 === 0;
                  return (
                    <div
                      key={i}
                      style={{
                        backgroundColor: isLight
                          ? config.light
                          : config.dark,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-center font-medium truncate">
              {config.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
