// src/components/settings/DataManagement.tsx

import { useState, useRef, useCallback } from 'react';
import { Button, ConfirmDialog, Modal } from '@/components/common';
import {
  useSettingsStore,
  useStatisticsStore,
  useLearningStore,
  useGameStore,
} from '@/stores';
import { storage } from '@/utils/storage';
import { cn } from '@/utils';
import {
  type ExportCategory,
  type ExportFormat,
  exportAsJSON,
  exportGameRecordsAsCSV,
  exportAsPGN,
  getDataSummary,
} from '@/utils/exportData';

interface DataManagementProps {
  className?: string;
}

// 체크박스 항목 타입
interface ExportCategoryItem {
  id: ExportCategory;
  label: string;
  description: string;
  icon: string;
}

// 내보내기 형식 옵션
interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: string;
}

const EXPORT_CATEGORIES: ExportCategoryItem[] = [
  {
    id: 'settings',
    label: '설정',
    description: '테마, 보드 스타일, 사운드, 게임 옵션 등',
    icon: '⚙️',
  },
  {
    id: 'gameRecords',
    label: '게임 기록',
    description: '완료된 게임의 기보, 결과, 통계',
    icon: '📋',
  },
  {
    id: 'savedGames',
    label: '저장된 게임',
    description: '진행 중인 게임 저장 데이터',
    icon: '💾',
  },
  {
    id: 'statistics',
    label: '통계',
    description: '승률, 난이도별 성적, 일별 기록 등',
    icon: '📊',
  },
  {
    id: 'learningProgress',
    label: '학습 진행',
    description: '완료한 레슨, 풀이한 퍼즐 기록',
    icon: '📚',
  },
];

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'json',
    label: 'JSON',
    description: '전체 백업 (복원 가능)',
    icon: '{ }',
  },
  {
    id: 'csv',
    label: 'CSV',
    description: '게임 기록 표 (엑셀 호환)',
    icon: '📄',
  },
  {
    id: 'pgn',
    label: 'PGN',
    description: '체스 기보 표준 형식',
    icon: '♟️',
  },
];

export function DataManagement({ className }: DataManagementProps) {
  const { settings, exportSettings, importSettings, resetSettings } =
    useSettingsStore();
  const { statistics, resetStatistics } = useStatisticsStore();
  const { progress: learningProgress, resetProgress } = useLearningStore();
  const { resetGame } = useGameStore();

  // 내보내기 모달 상태
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<
    ExportCategory[]
  >(['settings', 'gameRecords', 'savedGames', 'statistics', 'learningProgress']);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [exportStatus, setExportStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // 초기화 관련 상태
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetType, setResetType] = useState<
    'settings' | 'statistics' | 'all'
  >('settings');

  // 가져오기 관련 상태
  const [importStatus, setImportStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 데이터 요약
  const gameRecords = storage.getGameRecords();
  const savedGames = storage.getSavedGames();
  const summary = getDataSummary(
    settings,
    gameRecords,
    savedGames,
    statistics,
    learningProgress
  );

  // 카테고리 선택 토글
  const toggleCategory = useCallback((category: ExportCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  // 전체 선택 / 해제
  const toggleAllCategories = useCallback(() => {
    setSelectedCategories((prev) =>
      prev.length === EXPORT_CATEGORIES.length
        ? []
        : EXPORT_CATEGORIES.map((c) => c.id)
    );
  }, []);

  // 내보내기 실행
  const handleExport = useCallback(() => {
    try {
      if (selectedCategories.length === 0) return;

      if (selectedFormat === 'csv') {
        // CSV는 게임 기록만 지원
        exportGameRecordsAsCSV(gameRecords);
      } else if (selectedFormat === 'pgn') {
        // PGN은 게임 기록만 지원
        exportAsPGN(gameRecords);
      } else {
        // JSON 형식: 선택한 카테고리별 데이터 수집
        const data: Record<string, unknown> = {};

        if (selectedCategories.includes('settings')) {
          data.settings = JSON.parse(exportSettings());
        }
        if (selectedCategories.includes('gameRecords')) {
          data.gameRecords = gameRecords;
        }
        if (selectedCategories.includes('savedGames')) {
          data.savedGames = savedGames;
        }
        if (selectedCategories.includes('statistics')) {
          data.statistics = statistics;
        }
        if (selectedCategories.includes('learningProgress')) {
          data.learningProgress = learningProgress;
        }

        exportAsJSON(data, selectedCategories);
      }

      setExportStatus('success');
      setTimeout(() => {
        setExportStatus('idle');
        setShowExportModal(false);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  }, [
    selectedCategories,
    selectedFormat,
    gameRecords,
    savedGames,
    statistics,
    learningProgress,
    exportSettings,
  ]);

  // 가져오기
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      const success = importSettings(data);
      setImportStatus(success ? 'success' : 'error');
      setTimeout(() => setImportStatus('idle'), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 초기화
  const handleReset = () => {
    switch (resetType) {
      case 'settings':
        resetSettings();
        break;
      case 'statistics':
        resetStatistics();
        resetProgress();
        storage.setGameRecords([]);
        break;
      case 'all':
        resetSettings();
        resetStatistics();
        resetProgress();
        resetGame();
        storage.clearAll();
        break;
    }
    setShowResetDialog(false);
  };

  const confirmReset = (type: typeof resetType) => {
    setResetType(type);
    setShowResetDialog(true);
  };

  const getResetDialogMessage = () => {
    switch (resetType) {
      case 'settings':
        return '모든 설정이 기본값으로 초기화됩니다. 계속하시겠습니까?';
      case 'statistics':
        return '모든 게임 기록과 통계가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.';
      case 'all':
        return '모든 데이터(설정, 게임 기록, 통계, 학습 진행)가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.';
    }
  };

  // 선택한 형식에 따라 카테고리 선택 가능 여부 결정
  const isCategorySelectable = selectedFormat === 'json';
  const hasGameRecords = gameRecords.length > 0;

  // 카테고리별 데이터 수량 표시
  const getCategoryCount = (category: ExportCategory): string => {
    switch (category) {
      case 'settings':
        return '1개 설정 프로필';
      case 'gameRecords':
        return `${summary.gameRecordsCount}개 기록`;
      case 'savedGames':
        return `${summary.savedGamesCount}개 저장`;
      case 'statistics':
        return `총 ${summary.statisticsTotalGames}게임 통계`;
      case 'learningProgress':
        return `${summary.learningLessonsCompleted}개 레슨, ${summary.learningPuzzlesSolved}개 퍼즐`;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 내보내기 */}
      <div>
        <h4 className="font-medium mb-2">데이터 내보내기</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          게임 기록, 설정, 통계 등을 파일로 저장합니다.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setExportStatus('idle');
              setShowExportModal(true);
            }}
          >
            📤 데이터 내보내기
          </Button>
        </div>

        {/* 데이터 요약 카드 */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <DataCountBadge
            icon="📋"
            label="게임 기록"
            count={summary.gameRecordsCount}
          />
          <DataCountBadge
            icon="💾"
            label="저장된 게임"
            count={summary.savedGamesCount}
          />
          <DataCountBadge
            icon="📊"
            label="총 게임수"
            count={summary.statisticsTotalGames}
          />
        </div>
      </div>

      {/* 가져오기 */}
      <div>
        <h4 className="font-medium mb-2">데이터 가져오기</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button variant="secondary" size="sm" onClick={handleImportClick}>
          📥 설정 가져오기
        </Button>

        {importStatus === 'success' && (
          <p className="text-sm text-green-500 dark:text-green-400 mt-2">
            ✓ 설정을 성공적으로 가져왔습니다.
          </p>
        )}
        {importStatus === 'error' && (
          <p className="text-sm text-red-500 dark:text-red-400 mt-2">
            ✗ 설정 가져오기에 실패했습니다.
          </p>
        )}
      </div>

      {/* 초기화 */}
      <div>
        <h4 className="font-medium mb-2">데이터 초기화</h4>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmReset('settings')}
            className="text-gray-500 dark:text-gray-400"
          >
            설정 초기화
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmReset('statistics')}
            className="text-orange-500 dark:text-orange-400"
          >
            기록 삭제
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmReset('all')}
            className="text-red-500 dark:text-red-400"
          >
            전체 초기화
          </Button>
        </div>
      </div>

      {/* 내보내기 모달 */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="📤 데이터 내보내기"
        size="lg"
      >
        <div className="space-y-5">
          {/* 형식 선택 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              내보내기 형식
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((format) => {
                const isDisabled =
                  (format.id === 'csv' || format.id === 'pgn') &&
                  !hasGameRecords;
                return (
                  <button
                    key={format.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setSelectedFormat(format.id)}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg border-2 transition-all text-center',
                      selectedFormat === format.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <span className="text-lg mb-1">{format.icon}</span>
                    <span className="text-sm font-medium">{format.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {format.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 카테고리 선택 (JSON만 해당) */}
          {isCategorySelectable ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  내보낼 데이터 선택
                </h4>
                <button
                  type="button"
                  onClick={toggleAllCategories}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {selectedCategories.length === EXPORT_CATEGORIES.length
                    ? '전체 해제'
                    : '전체 선택'}
                </button>
              </div>
              <div className="space-y-2">
                {EXPORT_CATEGORIES.map((category) => (
                  <label
                    key={category.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                      selectedCategories.includes(category.id)
                        ? 'border-primary-300 bg-primary-50/50 dark:border-primary-700 dark:bg-primary-900/10'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span className="text-sm font-medium">
                          {category.label}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto whitespace-nowrap">
                          {getCategoryCount(category.id)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {category.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedFormat === 'csv' && (
                  <>
                    <strong>CSV 형식</strong>은 게임 기록({summary.gameRecordsCount}개)을 표 형태로 내보냅니다.
                    엑셀이나 Google Sheets에서 열 수 있습니다.
                  </>
                )}
                {selectedFormat === 'pgn' && (
                  <>
                    <strong>PGN 형식</strong>은 게임 기보({summary.gameRecordsCount}개)를 체스 표준 기보 형식으로 내보냅니다.
                    다른 체스 앱에서 가져올 수 있습니다.
                  </>
                )}
              </p>
            </div>
          )}

          {/* 상태 메시지 */}
          {exportStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-green-600 dark:text-green-400 text-lg">
                ✓
              </span>
              <span className="text-sm text-green-700 dark:text-green-300">
                내보내기가 완료되었습니다!
              </span>
            </div>
          )}
          {exportStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
              <span className="text-sm text-red-700 dark:text-red-300">
                내보내기에 실패했습니다. 다시 시도해주세요.
              </span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExportModal(false)}
            >
              취소
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={
                exportStatus === 'success' ||
                (isCategorySelectable && selectedCategories.length === 0) ||
                (!isCategorySelectable && !hasGameRecords)
              }
            >
              {exportStatus === 'success'
                ? '✓ 완료'
                : `📤 ${selectedFormat.toUpperCase()}로 내보내기`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 초기화 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleReset}
        title="데이터 초기화"
        message={getResetDialogMessage()}
        confirmText="초기화"
        cancelText="취소"
        variant="danger"
      />
    </div>
  );
}

// 데이터 수량 배지 컴포넌트
function DataCountBadge({
  icon,
  label,
  count,
}: {
  icon: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <span className="text-sm">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {label}
        </p>
        <p className="text-sm font-semibold">{count}</p>
      </div>
    </div>
  );
}
