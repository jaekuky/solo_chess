// src/components/settings/DataManagement.tsx

import { useState, useRef } from 'react';
import { Button, ConfirmDialog } from '@/components/common';
import {
  useSettingsStore,
  useStatisticsStore,
  useLearningStore,
  useGameStore,
} from '@/stores';
import { storage } from '@/utils/storage';
import { cn } from '@/utils';

interface DataManagementProps {
  className?: string;
}

export function DataManagement({ className }: DataManagementProps) {
  const { exportSettings, importSettings, resetSettings } = useSettingsStore();
  const { resetStatistics } = useStatisticsStore();
  const { resetProgress } = useLearningStore();
  const { resetGame } = useGameStore();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetType, setResetType] = useState<
    'settings' | 'statistics' | 'all'
  >('settings');
  const [importStatus, setImportStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 설정 내보내기
  const handleExportSettings = () => {
    const data = exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `solo-chess-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // 전체 데이터 내보내기
  const handleExportAllData = () => {
    const allData = {
      settings: JSON.parse(exportSettings()),
      savedGames: storage.getSavedGames(),
      gameRecords: storage.getGameRecords(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `solo-chess-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  // 설정 가져오기
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

  // 데이터 초기화
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

  return (
    <div className={cn('space-y-4', className)}>
      {/* 내보내기 */}
      <div>
        <h4 className="font-medium mb-2">데이터 내보내기</h4>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportSettings}
          >
            📤 설정만 내보내기
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportAllData}>
            💾 전체 백업
          </Button>
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
