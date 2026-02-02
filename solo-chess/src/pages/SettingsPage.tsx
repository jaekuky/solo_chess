// src/pages/SettingsPage.tsx

import { useState } from 'react';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSelect,
  SettingsSlider,
  BoardStylePicker,
  ThemePicker,
  DataManagement,
} from '@/components/settings';
import { useSettingsStore } from '@/stores';
import {
  ANIMATION_SPEED_CONFIG,
  COORDINATE_OPTIONS,
} from '@/constants';
import type { AnimationSpeed } from '@/types';
import { storage } from '@/utils/storage';
import { cn } from '@/utils';

type TabType =
  | 'appearance'
  | 'game'
  | 'sound'
  | 'accessibility'
  | 'data';

export function SettingsPage() {
  const {
    settings,
    updateGameOptions,
    updateSoundSettings,
    updateAccessibility,
    setTheme,
    setBoardStyle,
    setAnimationSpeed,
    setVolume,
    setCoordinateDisplay,
    toggleAutoSave,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<TabType>('appearance');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'appearance', label: '외관', icon: '🎨' },
    { id: 'game', label: '게임', icon: '♟️' },
    { id: 'sound', label: '사운드', icon: '🔊' },
    { id: 'accessibility', label: '접근성', icon: '♿' },
    { id: 'data', label: '데이터', icon: '💾' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">설정</h2>
        <p className="text-gray-500 dark:text-gray-400">
          앱을 원하는 대로 설정하세요.
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="space-y-6">
        {activeTab === 'appearance' && (
          <>
            <SettingsSection title="테마" icon="🌓">
              <ThemePicker value={settings.theme} onChange={setTheme} />
            </SettingsSection>

            <SettingsSection title="체스판" icon="♜">
              <BoardStylePicker
                value={settings.boardStyle}
                onChange={setBoardStyle}
              />

              <SettingsSelect
                label="좌표 표시"
                value={settings.gameOptions.showCoordinates}
                options={COORDINATE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                onChange={setCoordinateDisplay}
              />
            </SettingsSection>

            <SettingsSection title="애니메이션" icon="✨">
              <SettingsSelect
                label="애니메이션 속도"
                description="기물 이동 애니메이션 속도"
                value={settings.animationSpeed}
                options={Object.entries(ANIMATION_SPEED_CONFIG).map(
                  ([value, config]) => ({
                    value: value as AnimationSpeed,
                    label: config.name,
                  })
                )}
                onChange={setAnimationSpeed}
              />
            </SettingsSection>

          </>
        )}

        {activeTab === 'game' && (
          <>
            <SettingsSection title="게임 보조" icon="💡">
              <SettingsToggle
                label="가능한 수 표시"
                description="선택한 기물의 이동 가능한 칸을 표시합니다"
                checked={settings.gameOptions.showLegalMoves}
                onChange={(checked) =>
                  updateGameOptions({ showLegalMoves: checked })
                }
              />

              <SettingsToggle
                label="마지막 수 표시"
                description="가장 최근에 이동한 수를 하이라이트합니다"
                checked={settings.gameOptions.showLastMove}
                onChange={(checked) =>
                  updateGameOptions({ showLastMove: checked })
                }
              />

              <SettingsToggle
                label="체크 표시"
                description="킹이 체크 상태일 때 강조 표시합니다"
                checked={settings.gameOptions.showCheck}
                onChange={(checked) =>
                  updateGameOptions({ showCheck: checked })
                }
              />
            </SettingsSection>

            <SettingsSection title="힌트 및 무르기" icon="↩️">
              <SettingsToggle
                label="힌트 사용"
                description="게임 중 AI 힌트를 사용할 수 있습니다"
                checked={settings.gameOptions.enableHints}
                onChange={(checked) =>
                  updateGameOptions({ enableHints: checked })
                }
              />

              {settings.gameOptions.enableHints && (
                <SettingsSlider
                  label="힌트 제한"
                  description="게임당 사용 가능한 힌트 수 (0 = 무제한)"
                  value={settings.gameOptions.maxHints}
                  min={0}
                  max={10}
                  onChange={(value) =>
                    updateGameOptions({ maxHints: value })
                  }
                />
              )}

              <SettingsToggle
                label="무르기 사용"
                description="게임 중 수를 되돌릴 수 있습니다"
                checked={settings.gameOptions.enableUndo}
                onChange={(checked) =>
                  updateGameOptions({ enableUndo: checked })
                }
              />

              {settings.gameOptions.enableUndo && (
                <SettingsSlider
                  label="무르기 제한"
                  description="게임당 사용 가능한 무르기 수 (0 = 무제한)"
                  value={settings.gameOptions.maxUndos}
                  min={0}
                  max={10}
                  onChange={(value) =>
                    updateGameOptions({ maxUndos: value })
                  }
                />
              )}
            </SettingsSection>

            <SettingsSection title="게임 옵션" icon="⚙️">
              <SettingsToggle
                label="자동 퀸 승격"
                description="폰 승격 시 자동으로 퀸을 선택합니다"
                checked={settings.gameOptions.autoQueen}
                onChange={(checked) =>
                  updateGameOptions({ autoQueen: checked })
                }
              />

              <SettingsToggle
                label="수 확인"
                description="기물 이동 전 확인 단계를 추가합니다"
                checked={settings.gameOptions.confirmMove}
                onChange={(checked) =>
                  updateGameOptions({ confirmMove: checked })
                }
              />

              <SettingsToggle
                label="자동 저장"
                description="게임 진행 상황을 자동으로 저장합니다"
                checked={settings.autoSave}
                onChange={() => toggleAutoSave()}
              />
            </SettingsSection>
          </>
        )}

        {activeTab === 'sound' && (
          <>
            <SettingsSection title="사운드 설정" icon="🔊">
              <SettingsToggle
                label="사운드 활성화"
                description="모든 게임 사운드를 켜거나 끕니다"
                checked={settings.sound.enabled}
                onChange={(checked) =>
                  updateSoundSettings({ enabled: checked })
                }
              />

              {settings.sound.enabled && (
                <>
                  <SettingsSlider
                    label="볼륨"
                    value={settings.sound.volume}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={setVolume}
                  />

                  <div className="border-t dark:border-gray-700 pt-4 mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      개별 사운드 설정
                    </p>

                    <SettingsToggle
                      label="이동 소리"
                      checked={settings.sound.moveSound}
                      onChange={(checked) =>
                        updateSoundSettings({ moveSound: checked })
                      }
                    />

                    <SettingsToggle
                      label="기물 잡기 소리"
                      checked={settings.sound.captureSound}
                      onChange={(checked) =>
                        updateSoundSettings({ captureSound: checked })
                      }
                    />

                    <SettingsToggle
                      label="체크 소리"
                      checked={settings.sound.checkSound}
                      onChange={(checked) =>
                        updateSoundSettings({ checkSound: checked })
                      }
                    />

                    <SettingsToggle
                      label="게임 종료 소리"
                      checked={settings.sound.gameEndSound}
                      onChange={(checked) =>
                        updateSoundSettings({ gameEndSound: checked })
                      }
                    />

                    <SettingsToggle
                      label="타이머 경고 소리"
                      checked={settings.sound.timerWarningSound}
                      onChange={(checked) =>
                        updateSoundSettings({
                          timerWarningSound: checked,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </SettingsSection>
          </>
        )}

        {activeTab === 'accessibility' && (
          <>
            <SettingsSection title="접근성" icon="♿">
              <SettingsToggle
                label="고대비 모드"
                description="시각적 대비를 높여 가독성을 향상시킵니다"
                checked={settings.accessibility.highContrast}
                onChange={(checked) =>
                  updateAccessibility({ highContrast: checked })
                }
              />

              <SettingsToggle
                label="큰 텍스트"
                description="인터페이스 전체의 텍스트 크기를 키웁니다"
                checked={settings.accessibility.largeText}
                onChange={(checked) =>
                  updateAccessibility({ largeText: checked })
                }
              />

              <SettingsToggle
                label="모션 감소"
                description="애니메이션과 전환 효과를 최소화합니다"
                checked={settings.accessibility.reduceMotion}
                onChange={(checked) =>
                  updateAccessibility({ reduceMotion: checked })
                }
              />

              <SettingsToggle
                label="스크린 리더 알림"
                description="스크린 리더 사용자를 위한 알림을 활성화합니다"
                checked={settings.accessibility.screenReaderAnnouncements}
                onChange={(checked) =>
                  updateAccessibility({
                    screenReaderAnnouncements: checked,
                  })
                }
              />
            </SettingsSection>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h4 className="font-medium mb-2">💡 접근성 팁</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• 키보드로 게임을 조작할 수 있습니다 (방향키, Enter)</li>
                <li>• 복기 화면에서 스페이스바로 재생/일시정지 가능</li>
                <li>• Esc 키로 모달을 닫을 수 있습니다</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === 'data' && (
          <>
            <SettingsSection title="데이터 관리" icon="💾">
              <DataManagement />
            </SettingsSection>

            <SettingsSection title="저장 공간" icon="📊">
              <StorageInfo />
            </SettingsSection>

            <SettingsSection title="앱 정보" icon="ℹ️">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>Solo Chess v1.0.0</p>
                <p>© 2024 Solo Chess</p>
                <p className="mt-4">
                  <a
                    href="#"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    이용약관
                  </a>
                  <span className="mx-2">·</span>
                  <a
                    href="#"
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    개인정보처리방침
                  </a>
                </p>
              </div>
            </SettingsSection>
          </>
        )}
      </div>
    </div>
  );
}

// 저장 공간 정보 컴포넌트
function StorageInfo() {
  const usage = storage.getStorageUsage();
  const percentage = usage.percentage.toFixed(1);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span>사용 중</span>
        <span>
          {formatBytes(usage.used)} / {formatBytes(usage.total)}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all',
            usage.percentage > 80 ? 'bg-red-500' : 'bg-primary-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {percentage}% 사용 중
      </p>
    </div>
  );
}
