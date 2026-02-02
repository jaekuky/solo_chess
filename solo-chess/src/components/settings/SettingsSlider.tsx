// src/components/settings/SettingsSlider.tsx

import { cn } from '@/utils';

interface SettingsSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
}

export function SettingsSlider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  showValue = true,
}: SettingsSliderProps) {
  return (
    <div className={cn('py-2', disabled && 'opacity-50')}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-medium">{label}</span>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {showValue && (
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {value}
            {unit}
          </span>
        )}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(
          'w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          disabled && 'cursor-not-allowed'
        )}
      />

      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
