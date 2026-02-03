// src/components/common/TouchableButton.tsx

import { forwardRef, useState, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';

interface TouchableButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hapticFeedback?: boolean;
}

export const TouchableButton = forwardRef<HTMLButtonElement, TouchableButtonProps>(
  ({ className, children, hapticFeedback = true, onTouchStart, onTouchEnd, ...props }, ref) => {
    const [isPressed, setIsPressed] = useState(false);
    
    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
      setIsPressed(true);
      
      // 햅틱 피드백 (지원되는 경우)
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      onTouchStart?.(e);
    };
    
    const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      onTouchEnd?.(e);
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          'touch-feedback touch-target transition-transform',
          isPressed && 'scale-95',
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TouchableButton.displayName = 'TouchableButton';
