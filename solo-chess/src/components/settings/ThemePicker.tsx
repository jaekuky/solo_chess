// src/components/settings/ThemePicker.tsx

import type { ThemeMode } from '@/types';
import { THEME_OPTIONS } from '@/constants';
import { cn } from '@/utils';

interface ThemePickerProps {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  return (
    <div className="py-2">
      <label className="font-medium block mb-3">테마</label>

      <div className="flex gap-3">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg border-2 transition-all',
              'hover:shadow-md',
              value === option.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700'
            )}
          >
            <span className="text-2xl block mb-1">{option.icon}</span>
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
