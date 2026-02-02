// src/components/settings/SettingsSelect.tsx

import { cn } from '@/utils';

interface Option<T> {
  value: T;
  label: string;
  icon?: string;
}

interface SettingsSelectProps<T extends string> {
  label: string;
  description?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function SettingsSelect<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
}: SettingsSelectProps<T>) {
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
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-700',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          disabled && 'cursor-not-allowed'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.icon ? `${option.icon} ${option.label}` : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
