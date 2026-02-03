// src/components/common/Toast.tsx
/* eslint-disable react-refresh/only-export-components */

import { useEffect, useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { cn } from '@/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// 토스트 Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// 토스트 훅
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  
  return {
    success: (message: string, duration?: number) => 
      context.addToast('success', message, duration),
    error: (message: string, duration?: number) => 
      context.addToast('error', message, duration),
    warning: (message: string, duration?: number) => 
      context.addToast('warning', message, duration),
    info: (message: string, duration?: number) => 
      context.addToast('info', message, duration),
  };
}

// 토스트 컨테이너
function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;
  
  const { toasts, removeToast } = context;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem 
          key={toast.id} 
          toast={toast} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
}

// 개별 토스트
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // 마운트 애니메이션
    requestAnimationFrame(() => setIsVisible(true));
  }, []);
  
  const typeConfig = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: '⚠',
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
    },
  };
  
  const config = typeConfig[toast.type];
  
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white',
        'transform transition-all duration-300',
        config.bg,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <span className="text-lg">{config.icon}</span>
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  );
}
