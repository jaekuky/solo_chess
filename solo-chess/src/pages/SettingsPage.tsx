// src/pages/SettingsPage.tsx

import { useSettingsStore } from '@/stores';

export function SettingsPage() {
  const { settings, setTheme, setSoundEnabled, resetSettings } =
    useSettingsStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-6">설정</h2>

      {/* 화면 설정 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">화면 설정</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm">테마</label>
            <select
              value={settings.theme}
              onChange={(e) =>
                setTheme(e.target.value as 'light' | 'dark' | 'system')
              }
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="light">라이트</option>
              <option value="dark">다크</option>
              <option value="system">시스템 설정</option>
            </select>
          </div>
        </div>
      </section>

      {/* 사운드 설정 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">사운드 설정</h3>

        <div className="flex items-center justify-between">
          <label className="text-sm">효과음</label>
          <button
            onClick={() => setSoundEnabled(!settings.soundEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* 데이터 관리 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">데이터 관리</h3>

        <button
          onClick={() => {
            if (confirm('모든 설정을 초기화하시겠습니까?')) {
              resetSettings();
            }
          }}
          className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          설정 초기화
        </button>
      </section>

      <p className="text-gray-500 text-sm">
        추가 설정 옵션은 7단계에서 구현됩니다.
      </p>
    </div>
  );
}
