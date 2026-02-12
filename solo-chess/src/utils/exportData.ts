// src/utils/exportData.ts

import type { GameRecord, SavedGame } from '@/types';
import type { Statistics } from '@/types/statistics';
import type { LearningProgress } from '@/types/learning';
import type { UserSettings } from '@/types/settings';

// 내보내기 데이터 카테고리
export type ExportCategory =
  | 'settings'
  | 'gameRecords'
  | 'savedGames'
  | 'statistics'
  | 'learningProgress';

// 내보내기 형식
export type ExportFormat = 'json' | 'csv' | 'pgn';

// 내보내기 옵션
export interface ExportOptions {
  categories: ExportCategory[];
  format: ExportFormat;
}

// 전체 내보내기 데이터 구조
export interface ExportData {
  appName: string;
  version: string;
  exportedAt: string;
  categories: ExportCategory[];
  data: {
    settings?: UserSettings;
    gameRecords?: GameRecord[];
    savedGames?: SavedGame[];
    statistics?: Statistics;
    learningProgress?: LearningProgress;
  };
}

// 파일 다운로드 헬퍼
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// 날짜 포맷 헬퍼
function getDateStamp(): string {
  return new Date().toISOString().split('T')[0];
}

// 난이도 한글 매핑
function difficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
    custom: '커스텀',
  };
  return labels[difficulty] || difficulty;
}

// 결과 한글 매핑
function resultLabel(result: string | null): string {
  const labels: Record<string, string> = {
    win: '승리',
    lose: '패배',
    draw: '무승부',
  };
  return result ? (labels[result] || result) : '알 수 없음';
}

// 종료사유 한글 매핑
function endReasonLabel(reason: string | null): string {
  const labels: Record<string, string> = {
    checkmate: '체크메이트',
    stalemate: '스테일메이트',
    resignation: '기권',
    timeout: '시간초과',
    draw_agreement: '무승부 합의',
    insufficient_material: '기물 부족',
    fifty_move_rule: '50수 규칙',
    threefold_repetition: '3회 반복',
  };
  return reason ? (labels[reason] || reason) : '알 수 없음';
}

// 시간 포맷 (초 -> mm:ss)
function formatDurationShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// =============================================
// JSON 내보내기
// =============================================
export function exportAsJSON(
  data: ExportData['data'],
  categories: ExportCategory[]
): void {
  const exportData: ExportData = {
    appName: 'Solo Chess',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    categories,
    data,
  };

  const content = JSON.stringify(exportData, null, 2);
  const filename = `solo-chess-backup-${getDateStamp()}.json`;
  downloadFile(content, filename, 'application/json');
}

// =============================================
// CSV 내보내기 (게임 기록)
// =============================================
export function exportGameRecordsAsCSV(records: GameRecord[]): void {
  if (records.length === 0) return;

  const headers = [
    '날짜',
    '시간',
    '색상',
    '난이도',
    '결과',
    '종료사유',
    '수',
    '소요시간',
    '힌트사용',
    '시간제한',
    'PGN',
  ];

  const rows = records.map((record) => {
    const date = new Date(record.playedAt);
    return [
      date.toLocaleDateString('ko-KR'),
      date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      record.playerColor === 'w' ? '백' : '흑',
      difficultyLabel(record.difficulty),
      resultLabel(record.result),
      endReasonLabel(record.endReason),
      String(record.moveCount),
      formatDurationShort(record.duration),
      String(record.hintsUsed),
      record.timeControl === 'none' ? '없음' : record.timeControl,
      `"${record.pgn.replace(/"/g, '""')}"`,
    ];
  });

  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';
  const csvContent =
    BOM + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const filename = `solo-chess-records-${getDateStamp()}.csv`;
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
}

// =============================================
// PGN 내보내기 (체스 기보)
// =============================================
export function exportAsPGN(records: GameRecord[]): void {
  if (records.length === 0) return;

  const pgnGames = records
    .map((record) => {
      const date = new Date(record.playedAt);
      const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

      // PGN 결과 표기
      let pgnResult = '*';
      if (record.result === 'win') {
        pgnResult = record.playerColor === 'w' ? '1-0' : '0-1';
      } else if (record.result === 'lose') {
        pgnResult = record.playerColor === 'w' ? '0-1' : '1-0';
      } else if (record.result === 'draw') {
        pgnResult = '1/2-1/2';
      }

      // PGN 헤더
      const headers = [
        `[Event "Solo Chess Game"]`,
        `[Site "Solo Chess App"]`,
        `[Date "${dateStr}"]`,
        `[White "${record.playerColor === 'w' ? 'Player' : 'AI'}"]`,
        `[Black "${record.playerColor === 'b' ? 'Player' : 'AI'}"]`,
        `[Result "${pgnResult}"]`,
        `[Difficulty "${difficultyLabel(record.difficulty)}"]`,
        `[TimeControl "${record.timeControl}"]`,
        `[Termination "${endReasonLabel(record.endReason)}"]`,
      ];

      // PGN 본문: SAN 기보 수 생성
      let moveText = '';
      if (record.pgn && record.pgn.trim()) {
        moveText = record.pgn;
      } else if (record.moves && record.moves.length > 0) {
        const sanMoves = record.moves.map((m) => m.san);
        const moveLines: string[] = [];
        for (let i = 0; i < sanMoves.length; i += 2) {
          const moveNum = Math.floor(i / 2) + 1;
          const whiteMove = sanMoves[i];
          const blackMove = sanMoves[i + 1] || '';
          moveLines.push(
            `${moveNum}. ${whiteMove}${blackMove ? ' ' + blackMove : ''}`
          );
        }
        moveText = moveLines.join(' ');
      }

      return `${headers.join('\n')}\n\n${moveText} ${pgnResult}\n`;
    })
    .join('\n\n');

  const filename = `solo-chess-games-${getDateStamp()}.pgn`;
  downloadFile(pgnGames, filename, 'application/x-chess-pgn');
}

// =============================================
// 데이터 요약 정보
// =============================================
export interface DataSummary {
  settings: boolean;
  gameRecordsCount: number;
  savedGamesCount: number;
  statisticsTotalGames: number;
  learningPuzzlesSolved: number;
  learningLessonsCompleted: number;
}

export function getDataSummary(
  settings: UserSettings | undefined,
  gameRecords: GameRecord[],
  savedGames: SavedGame[],
  statistics: Statistics | undefined,
  learningProgress: LearningProgress | undefined
): DataSummary {
  return {
    settings: !!settings,
    gameRecordsCount: gameRecords.length,
    savedGamesCount: savedGames.length,
    statisticsTotalGames: statistics?.totalGames ?? 0,
    learningPuzzlesSolved: learningProgress?.puzzlesSolved ?? 0,
    learningLessonsCompleted:
      (learningProgress?.completedPieceLessons.length ?? 0) +
      (learningProgress?.completedSpecialRules.length ?? 0),
  };
}
