// src/components/common/DateRangePicker.tsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/utils';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onRangeChange: (startDate: string, endDate: string) => void;
  className?: string;
}

// 프리셋 범위 옵션
const PRESETS = [
  { label: '최근 7일', days: 7 },
  { label: '최근 14일', days: 14 },
  { label: '최근 30일', days: 30 },
  { label: '최근 90일', days: 90 },
] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateStr(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month: month - 1, day };
}

function formatDisplayDate(dateStr: string): string {
  const { year, month, day } = parseDateStr(dateStr);
  return `${year}. ${month + 1}. ${day}.`;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  // 달력 표시 월 (현재 보고 있는 달)
  const startParsed = parseDateStr(tempStart);
  const [viewYear, setViewYear] = useState(startParsed.year);
  const [viewMonth, setViewMonth] = useState(startParsed.month);

  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // props 변경 시 temp 동기화
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const handleDayClick = useCallback(
    (dateStr: string) => {
      if (selecting === 'start') {
        setTempStart(dateStr);
        // 시작일이 종료일보다 뒤면 종료일도 같은 날로
        if (dateStr > tempEnd) {
          setTempEnd(dateStr);
        }
        setSelecting('end');
      } else {
        if (dateStr < tempStart) {
          // 종료일이 시작일보다 앞이면 시작일로 설정하고 종료일 선택 대기
          setTempStart(dateStr);
          setSelecting('end');
        } else {
          setTempEnd(dateStr);
          setSelecting('start');
        }
      }
    },
    [selecting, tempStart, tempEnd],
  );

  const handleApply = useCallback(() => {
    onRangeChange(tempStart, tempEnd);
    setIsOpen(false);
  }, [tempStart, tempEnd, onRangeChange]);

  const handlePreset = useCallback(
    (days: number) => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days + 1);

      const startStr = formatDateStr(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      );
      const endStr = formatDateStr(
        end.getFullYear(),
        end.getMonth(),
        end.getDate(),
      );

      setTempStart(startStr);
      setTempEnd(endStr);
      onRangeChange(startStr, endStr);
      setIsOpen(false);
    },
    [onRangeChange],
  );

  // 달력 렌더링을 위한 데이터
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const today = new Date();
  const todayStr = formatDateStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const calendarDays: (string | null)[] = [];
  // 빈칸
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // 날짜
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(formatDateStr(viewYear, viewMonth, d));
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            const sp = parseDateStr(tempStart);
            setViewYear(sp.year);
            setViewMonth(sp.month);
            setSelecting('start');
          }
        }}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all',
          'bg-white dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500',
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-gray-300 dark:border-gray-600',
        )}
      >
        <span className="text-gray-400">📅</span>
        <span className="text-gray-700 dark:text-gray-200">
          {formatDisplayDate(startDate)} ~ {formatDisplayDate(endDate)}
        </span>
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-2 z-50',
            'bg-white dark:bg-gray-800 rounded-xl shadow-xl',
            'border border-gray-200 dark:border-gray-700',
            'p-4 w-[340px]',
            'animate-in fade-in slide-in-from-top-2 duration-200',
          )}
        >
          {/* 프리셋 버튼 */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => handlePreset(preset.days)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full transition-colors',
                  'border border-gray-200 dark:border-gray-600',
                  'text-gray-600 dark:text-gray-300',
                  'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600',
                  'dark:hover:bg-blue-900/30 dark:hover:border-blue-500 dark:hover:text-blue-400',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* 선택 상태 인디케이터 */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSelecting('start')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs text-center transition-all border',
                selecting === 'start'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30'
                  : 'border-gray-200 dark:border-gray-600 text-gray-500',
              )}
            >
              <div className="text-[10px] text-gray-400 mb-0.5">시작일</div>
              <div className="font-medium">{formatDisplayDate(tempStart)}</div>
            </button>
            <span className="text-gray-300 text-sm">→</span>
            <button
              type="button"
              onClick={() => setSelecting('end')}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs text-center transition-all border',
                selecting === 'end'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30'
                  : 'border-gray-200 dark:border-gray-600 text-gray-500',
              )}
            >
              <div className="text-[10px] text-gray-400 mb-0.5">종료일</div>
              <div className="font-medium">{formatDisplayDate(tempEnd)}</div>
            </button>
          </div>

          {/* 달력 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              ◀
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              ▶
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                className={cn(
                  'text-center text-[11px] font-medium py-1',
                  i === 0
                    ? 'text-red-400'
                    : i === 6
                      ? 'text-blue-400'
                      : 'text-gray-400',
                )}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="p-1" />;
              }

              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const isToday = dateStr === todayStr;
              const isStart = dateStr === tempStart;
              const isEnd = dateStr === tempEnd;
              const isInRange = dateStr > tempStart && dateStr < tempEnd;
              const isFuture = dateStr > todayStr;
              const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'relative p-0.5',
                    isInRange && 'bg-blue-50 dark:bg-blue-900/20',
                    isStart && 'rounded-l-lg bg-blue-50 dark:bg-blue-900/20',
                    isEnd && 'rounded-r-lg bg-blue-50 dark:bg-blue-900/20',
                    isStart && isEnd && 'rounded-lg',
                  )}
                >
                  <button
                    type="button"
                    disabled={isFuture}
                    onClick={() => handleDayClick(dateStr)}
                    className={cn(
                      'w-full aspect-square flex items-center justify-center rounded-lg text-xs transition-all',
                      // 기본 스타일
                      !isStart &&
                        !isEnd &&
                        !isFuture &&
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                      // 시작일 / 종료일
                      (isStart || isEnd) &&
                        'bg-blue-500 text-white font-bold shadow-sm',
                      // 범위 내 날짜
                      isInRange &&
                        !isStart &&
                        !isEnd &&
                        'text-blue-600 dark:text-blue-400 font-medium',
                      // 일반 날짜
                      !isStart &&
                        !isEnd &&
                        !isInRange &&
                        !isFuture &&
                        'text-gray-700 dark:text-gray-300',
                      // 오늘 표시
                      isToday &&
                        !isStart &&
                        !isEnd &&
                        'ring-1 ring-blue-400 font-semibold',
                      // 미래 날짜
                      isFuture && 'text-gray-300 dark:text-gray-600 cursor-not-allowed',
                      // 일요일 / 토요일
                      dayOfWeek === 0 &&
                        !isStart &&
                        !isEnd &&
                        !isFuture &&
                        !isInRange &&
                        'text-red-400',
                      dayOfWeek === 6 &&
                        !isStart &&
                        !isEnd &&
                        !isFuture &&
                        !isInRange &&
                        'text-blue-400',
                    )}
                  >
                    {dayNum}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 하단 액션 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-lg transition-all',
                'bg-blue-500 text-white hover:bg-blue-600',
                'shadow-sm hover:shadow-md',
              )}
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
