// src/components/settings/SettingsSection.tsx

import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  icon,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm',
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
