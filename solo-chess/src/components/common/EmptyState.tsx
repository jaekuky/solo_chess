// src/components/common/EmptyState.tsx

import type { ReactNode } from 'react';
import { cn } from '@/utils';

interface EmptyStateProps {
  icon?: string | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {typeof icon === 'string' ? (
        <span className="text-5xl mb-4">{icon}</span>
      ) : (
        <div className="mb-4">{icon}</div>
      )}
      
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
      )}
      
      {action && <div>{action}</div>}
    </div>
  );
}
