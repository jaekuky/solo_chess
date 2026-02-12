// src/utils/openings.ts
// ECO 오프닝 데이터베이스 및 오프닝 감지 유틸리티

import type { Move, GameRecord, GameResult } from '@/types';

// ── 오프닝 정보 ────────────────────────────────────────────────
export interface OpeningInfo {
  eco: string;
  name: string;
  nameKo: string;
  moves: string; // SAN 시퀀스 (space-separated)
}

// ── 오프닝 통계 (계산 결과) ──────────────────────────────────────
export interface OpeningStatEntry {
  eco: string;
  name: string;
  nameKo: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgMoves: number;
}

// ── ECO 오프닝 데이터베이스 ─────────────────────────────────────
// 가장 일반적인 오프닝들을 포함 (구체적 변형 → 일반 카테고리 순)
const ECO_DATABASE: OpeningInfo[] = [
  // ─── A: 플랭크 오프닝 ───
  { eco: 'A00', name: 'Uncommon Opening', nameKo: '비정규 오프닝', moves: '' },
  { eco: 'A04', name: "Réti Opening", nameKo: '레티 오프닝', moves: 'Nf3' },
  { eco: 'A05', name: "Réti Opening", nameKo: '레티 오프닝', moves: 'Nf3 Nf6' },
  { eco: 'A10', name: 'English Opening', nameKo: '잉글리시 오프닝', moves: 'c4' },
  { eco: 'A13', name: 'English Opening', nameKo: '잉글리시 오프닝', moves: 'c4 e6' },
  { eco: 'A15', name: 'English Opening: Anglo-Indian', nameKo: '잉글리시: 앵글로-인디언', moves: 'c4 Nf6' },
  { eco: 'A20', name: 'English Opening: Reversed Sicilian', nameKo: '잉글리시: 역 시실리안', moves: 'c4 e5' },

  // ─── B: 세미오픈 (1. e4, 시실리안/프렌치/카로칸 등) ───
  { eco: 'B00', name: 'Nimzowitsch Defense', nameKo: '님초비치 디펜스', moves: 'e4 Nc6' },
  { eco: 'B01', name: 'Scandinavian Defense', nameKo: '스칸디나비안 디펜스', moves: 'e4 d5' },
  { eco: 'B02', name: "Alekhine's Defense", nameKo: '알레힌 디펜스', moves: 'e4 Nf6' },
  { eco: 'B06', name: 'Modern Defense', nameKo: '모던 디펜스', moves: 'e4 g6' },
  { eco: 'B07', name: 'Pirc Defense', nameKo: '피르츠 디펜스', moves: 'e4 d6 d4 Nf6' },

  // 카로-칸
  { eco: 'B10', name: 'Caro-Kann Defense', nameKo: '카로-칸 디펜스', moves: 'e4 c6' },
  { eco: 'B12', name: 'Caro-Kann: Advance Variation', nameKo: '카로-칸: 전진 변형', moves: 'e4 c6 d4 d5 e5' },
  { eco: 'B13', name: 'Caro-Kann: Exchange Variation', nameKo: '카로-칸: 교환 변형', moves: 'e4 c6 d4 d5 exd5 cxd5' },
  { eco: 'B15', name: 'Caro-Kann: Main Line', nameKo: '카로-칸: 메인 라인', moves: 'e4 c6 d4 d5 Nc3' },

  // 시실리안
  { eco: 'B20', name: 'Sicilian Defense', nameKo: '시실리안 디펜스', moves: 'e4 c5' },
  { eco: 'B21', name: 'Sicilian: Smith-Morra Gambit', nameKo: '시실리안: 스미스-모라 갬빗', moves: 'e4 c5 d4 cxd4 c3' },
  { eco: 'B22', name: 'Sicilian: Alapin Variation', nameKo: '시실리안: 알라핀 변형', moves: 'e4 c5 c3' },
  { eco: 'B23', name: 'Sicilian: Closed', nameKo: '시실리안: 폐쇄형', moves: 'e4 c5 Nc3' },
  { eco: 'B27', name: 'Sicilian: Hyper-Accelerated Dragon', nameKo: '시실리안: 초가속 드래곤', moves: 'e4 c5 Nf3 g6' },
  { eco: 'B30', name: 'Sicilian: Rossolimo Variation', nameKo: '시실리안: 로솔리모 변형', moves: 'e4 c5 Nf3 Nc6 Bb5' },
  { eco: 'B32', name: 'Sicilian: Open', nameKo: '시실리안: 개방형', moves: 'e4 c5 Nf3 Nc6 d4' },
  { eco: 'B33', name: 'Sicilian: Sveshnikov', nameKo: '시실리안: 스베시니코프', moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5' },
  { eco: 'B40', name: 'Sicilian: French Variation', nameKo: '시실리안: 프랑스 변형', moves: 'e4 c5 Nf3 e6' },
  { eco: 'B50', name: 'Sicilian: Modern Variation', nameKo: '시실리안: 모던 변형', moves: 'e4 c5 Nf3 d6' },
  { eco: 'B54', name: 'Sicilian: Dragon Variation', nameKo: '시실리안: 드래곤 변형', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6' },
  { eco: 'B60', name: 'Sicilian: Najdorf Variation', nameKo: '시실리안: 나이도르프 변형', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6' },
  { eco: 'B80', name: 'Sicilian: Scheveningen', nameKo: '시실리안: 스케베닝겐', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6' },

  // 프렌치
  { eco: 'C00', name: 'French Defense', nameKo: '프렌치 디펜스', moves: 'e4 e6' },
  { eco: 'C01', name: 'French: Exchange Variation', nameKo: '프렌치: 교환 변형', moves: 'e4 e6 d4 d5 exd5 exd5' },
  { eco: 'C02', name: 'French: Advance Variation', nameKo: '프렌치: 전진 변형', moves: 'e4 e6 d4 d5 e5' },
  { eco: 'C03', name: 'French: Tarrasch Variation', nameKo: '프렌치: 타라시 변형', moves: 'e4 e6 d4 d5 Nd2' },
  { eco: 'C11', name: 'French: Classical Variation', nameKo: '프렌치: 클래식 변형', moves: 'e4 e6 d4 d5 Nc3 Nf6' },
  { eco: 'C15', name: 'French: Winawer Variation', nameKo: '프렌치: 비나베르 변형', moves: 'e4 e6 d4 d5 Nc3 Bb4' },

  // ─── C: 오픈 게임 (1. e4 e5) ───
  { eco: 'C20', name: "King's Pawn Game", nameKo: '킹스 폰 게임', moves: 'e4 e5' },
  { eco: 'C21', name: 'Danish Gambit', nameKo: '데니시 갬빗', moves: 'e4 e5 d4 exd4 c3' },
  { eco: 'C22', name: 'Center Game', nameKo: '센터 게임', moves: 'e4 e5 d4 exd4 Qxd4' },
  { eco: 'C23', name: "Bishop's Opening", nameKo: '비숍 오프닝', moves: 'e4 e5 Bc4' },
  { eco: 'C25', name: 'Vienna Game', nameKo: '비엔나 게임', moves: 'e4 e5 Nc3' },
  { eco: 'C29', name: 'Vienna Gambit', nameKo: '비엔나 갬빗', moves: 'e4 e5 Nc3 Nf6 f4' },
  { eco: 'C30', name: "King's Gambit", nameKo: '킹스 갬빗', moves: 'e4 e5 f4' },
  { eco: 'C33', name: "King's Gambit Accepted", nameKo: '킹스 갬빗 억셉티드', moves: 'e4 e5 f4 exf4' },
  { eco: 'C40', name: "King's Knight Opening", nameKo: '킹스 나이트 오프닝', moves: 'e4 e5 Nf3' },
  { eco: 'C41', name: 'Philidor Defense', nameKo: '필리도르 디펜스', moves: 'e4 e5 Nf3 d6' },
  { eco: 'C42', name: 'Petrov Defense', nameKo: '페트로프 디펜스', moves: 'e4 e5 Nf3 Nf6' },
  { eco: 'C44', name: 'Scotch Game', nameKo: '스카치 게임', moves: 'e4 e5 Nf3 Nc6 d4' },
  { eco: 'C45', name: 'Scotch Game: Classical', nameKo: '스카치: 클래식', moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4' },
  { eco: 'C46', name: 'Three Knights Game', nameKo: '쓰리 나이트 게임', moves: 'e4 e5 Nf3 Nc6 Nc3' },
  { eco: 'C47', name: 'Four Knights Game', nameKo: '포 나이트 게임', moves: 'e4 e5 Nf3 Nc6 Nc3 Nf6' },
  { eco: 'C50', name: 'Italian Game', nameKo: '이탈리안 게임', moves: 'e4 e5 Nf3 Nc6 Bc4' },
  { eco: 'C51', name: 'Italian: Evans Gambit', nameKo: '이탈리안: 에반스 갬빗', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4' },
  { eco: 'C53', name: 'Italian: Giuoco Piano', nameKo: '이탈리안: 주오코 피아노', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5' },
  { eco: 'C54', name: 'Italian: Giuoco Piano Main Line', nameKo: '이탈리안: 주오코 피아노 메인', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3' },
  { eco: 'C55', name: 'Italian: Two Knights Defense', nameKo: '이탈리안: 투 나이츠 디펜스', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6' },
  { eco: 'C57', name: 'Italian: Fried Liver Attack', nameKo: '이탈리안: 프라이드 리버 어택', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7' },

  // 루이 로페즈
  { eco: 'C60', name: 'Ruy Lopez', nameKo: '루이 로페즈', moves: 'e4 e5 Nf3 Nc6 Bb5' },
  { eco: 'C63', name: 'Ruy Lopez: Schliemann Defense', nameKo: '루이 로페즈: 슐리만 디펜스', moves: 'e4 e5 Nf3 Nc6 Bb5 f5' },
  { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', nameKo: '루이 로페즈: 베를린 디펜스', moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6' },
  { eco: 'C68', name: 'Ruy Lopez: Exchange Variation', nameKo: '루이 로페즈: 교환 변형', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6' },
  { eco: 'C70', name: 'Ruy Lopez: Morphy Defense', nameKo: '루이 로페즈: 모피 디펜스', moves: 'e4 e5 Nf3 Nc6 Bb5 a6' },
  { eco: 'C78', name: 'Ruy Lopez: Archangelsk', nameKo: '루이 로페즈: 아르한겔스크', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O b5' },
  { eco: 'C80', name: 'Ruy Lopez: Open Variation', nameKo: '루이 로페즈: 개방 변형', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4' },
  { eco: 'C84', name: 'Ruy Lopez: Closed Variation', nameKo: '루이 로페즈: 폐쇄 변형', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7' },
  { eco: 'C88', name: 'Ruy Lopez: Marshall Attack', nameKo: '루이 로페즈: 마샬 어택', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5' },

  // ─── D: 퀸즈 갬빗, 슬라브 ───
  { eco: 'D00', name: "Queen's Pawn Game", nameKo: '퀸즈 폰 게임', moves: 'd4 d5' },
  { eco: 'D02', name: 'London System', nameKo: '런던 시스템', moves: 'd4 d5 Nf3 Nf6 Bf4' },
  { eco: 'D03', name: 'Torre Attack', nameKo: '토레 어택', moves: 'd4 d5 Nf3 Nf6 Bg5' },
  { eco: 'D06', name: "Queen's Gambit", nameKo: '퀸즈 갬빗', moves: 'd4 d5 c4' },
  { eco: 'D07', name: "Chigorin Defense", nameKo: '치고린 디펜스', moves: 'd4 d5 c4 Nc6' },
  { eco: 'D10', name: 'Slav Defense', nameKo: '슬라브 디펜스', moves: 'd4 d5 c4 c6' },
  { eco: 'D15', name: 'Slav: Three Knights', nameKo: '슬라브: 쓰리 나이트', moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3' },
  { eco: 'D20', name: "Queen's Gambit Accepted", nameKo: '퀸즈 갬빗 억셉티드', moves: 'd4 d5 c4 dxc4' },
  { eco: 'D30', name: "Queen's Gambit Declined", nameKo: '퀸즈 갬빗 디클라인드', moves: 'd4 d5 c4 e6' },
  { eco: 'D35', name: "QGD: Exchange Variation", nameKo: 'QGD: 교환 변형', moves: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5' },
  { eco: 'D37', name: "QGD: Classical Variation", nameKo: 'QGD: 클래식 변형', moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 Be7' },

  // ─── D: 인디언 디펜스 계열 ───
  { eco: 'D70', name: 'Grünfeld Defense', nameKo: '그린펠트 디펜스', moves: 'd4 Nf6 c4 g6 Nc3 d5' },
  { eco: 'D80', name: 'Grünfeld: Main Line', nameKo: '그린펠트: 메인 라인', moves: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5' },

  // ─── E: 인디언 디펜스 ───
  { eco: 'E00', name: 'Catalan Opening', nameKo: '카탈란 오프닝', moves: 'd4 Nf6 c4 e6 g3' },
  { eco: 'E10', name: "Queen's Indian Defense", nameKo: '퀸즈 인디언 디펜스', moves: 'd4 Nf6 c4 e6 Nf3 b6' },
  { eco: 'E12', name: "Queen's Indian: Petrosian", nameKo: '퀸즈 인디언: 페트로시안', moves: 'd4 Nf6 c4 e6 Nf3 b6 a3' },
  { eco: 'E20', name: 'Nimzo-Indian Defense', nameKo: '님조-인디언 디펜스', moves: 'd4 Nf6 c4 e6 Nc3 Bb4' },
  { eco: 'E32', name: 'Nimzo-Indian: Classical', nameKo: '님조-인디언: 클래식', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2' },
  { eco: 'E40', name: 'Nimzo-Indian: Rubinstein', nameKo: '님조-인디언: 루빈스타인', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 e3' },
  { eco: 'E60', name: "King's Indian Defense", nameKo: '킹스 인디언 디펜스', moves: 'd4 Nf6 c4 g6' },
  { eco: 'E62', name: "King's Indian: Fianchetto", nameKo: '킹스 인디언: 피안게토', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 Nf3 d6 g3' },
  { eco: 'E70', name: "King's Indian: Classical", nameKo: '킹스 인디언: 클래식', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4' },
  { eco: 'E73', name: "King's Indian: Averbakh", nameKo: '킹스 인디언: 아베르바흐', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Be2 O-O Bg5' },
  { eco: 'E76', name: "King's Indian: Four Pawns Attack", nameKo: '킹스 인디언: 포 폰 어택', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4' },
  { eco: 'E80', name: "King's Indian: Sämisch", nameKo: '킹스 인디언: 제미시', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3' },
  { eco: 'E90', name: "King's Indian: Main Line", nameKo: '킹스 인디언: 메인 라인', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3' },
  { eco: 'E97', name: "King's Indian: Mar del Plata", nameKo: '킹스 인디언: 마르 델 플라타', moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6' },

  // ─── 기타 d4 오프닝 ───
  { eco: 'A40', name: "Queen's Pawn Game", nameKo: '퀸즈 폰 게임', moves: 'd4' },
  { eco: 'A45', name: 'Trompowsky Attack', nameKo: '트롬포프스키 어택', moves: 'd4 Nf6 Bg5' },
  { eco: 'A46', name: "Queen's Pawn: Indian", nameKo: '퀸즈 폰: 인디언', moves: 'd4 Nf6' },
  { eco: 'A48', name: 'London System', nameKo: '런던 시스템', moves: 'd4 Nf6 Nf3 g6 Bf4' },
  { eco: 'A50', name: "Indian Defense", nameKo: '인디언 디펜스', moves: 'd4 Nf6 c4' },
  { eco: 'A56', name: 'Benoni Defense', nameKo: '베노니 디펜스', moves: 'd4 Nf6 c4 c5' },
  { eco: 'A57', name: 'Benko Gambit', nameKo: '벤코 갬빗', moves: 'd4 Nf6 c4 c5 d5 b5' },
  { eco: 'A60', name: 'Benoni: Modern', nameKo: '베노니: 모던', moves: 'd4 Nf6 c4 c5 d5 e6' },
  { eco: 'A80', name: 'Dutch Defense', nameKo: '더치 디펜스', moves: 'd4 f5' },
  { eco: 'A85', name: 'Dutch: Stonewall', nameKo: '더치: 스톤월', moves: 'd4 f5 c4 Nf6 Nc3 e6' },

  // ─── 기타 1수 오프닝 ───
  { eco: 'A01', name: "Larsen's Opening", nameKo: '라르센 오프닝', moves: 'b3' },
  { eco: 'A02', name: "Bird's Opening", nameKo: '버드 오프닝', moves: 'f4' },
  { eco: 'B00', name: "King's Pawn Opening", nameKo: '킹스 폰 오프닝', moves: 'e4' },
];

// 오프닝 DB를 수 길이 내림차순으로 정렬 (가장 구체적인 매칭 우선)
const SORTED_DB = [...ECO_DATABASE].sort(
  (a, b) => b.moves.split(' ').filter(Boolean).length - a.moves.split(' ').filter(Boolean).length,
);

// ── 오프닝 감지 ─────────────────────────────────────────────────

/**
 * Move 배열에서 SAN 시퀀스 문자열을 추출
 */
function movesToSanSequence(moves: Move[]): string {
  return moves.map((m) => m.san).join(' ');
}

/**
 * PGN 문자열에서 순수 수 시퀀스만 추출 (번호 제거)
 */
function pgnToSanSequence(pgn: string): string {
  return pgn
    .replace(/\{[^}]*\}/g, '') // 코멘트 제거
    .replace(/\d+\.\s*/g, '') // 수 번호 제거
    .replace(/\s*(1-0|0-1|1\/2-1\/2|\*)\s*$/, '') // 결과 제거
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 게임의 오프닝을 감지
 * moves 배열 또는 PGN에서 처음 N수를 ECO DB와 매칭
 */
export function detectOpening(
  movesOrPgn: Move[] | string,
): OpeningInfo {
  const sanSeq =
    typeof movesOrPgn === 'string'
      ? pgnToSanSequence(movesOrPgn)
      : movesToSanSequence(movesOrPgn);

  // 가장 길게 매칭되는 오프닝 찾기
  for (const opening of SORTED_DB) {
    if (opening.moves === '') continue; // 빈 시퀀스는 폴백
    if (sanSeq.startsWith(opening.moves)) {
      return opening;
    }
    // 수가 정확히 일치하는지도 확인 (수 뒤에 공백이나 끝)
    if (sanSeq.startsWith(opening.moves + ' ') || sanSeq === opening.moves) {
      return opening;
    }
  }

  // 매칭 실패: 첫 수 기반 기본 카테고리
  const firstMove = sanSeq.split(' ')[0] || '';
  if (firstMove === 'e4') {
    return { eco: 'B00', name: "King's Pawn Opening", nameKo: '킹스 폰 오프닝', moves: 'e4' };
  }
  if (firstMove === 'd4') {
    return { eco: 'A40', name: "Queen's Pawn Game", nameKo: '퀸즈 폰 게임', moves: 'd4' };
  }

  return { eco: 'A00', name: 'Uncommon Opening', nameKo: '비정규 오프닝', moves: '' };
}

// ── 오프닝 통계 계산 ────────────────────────────────────────────

/**
 * 게임 기록 배열에서 오프닝별 통계를 계산
 */
export function calculateOpeningStats(
  gameRecords: GameRecord[],
): OpeningStatEntry[] {
  const statsMap = new Map<
    string,
    {
      eco: string;
      name: string;
      nameKo: string;
      gamesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
      totalMoves: number;
    }
  >();

  for (const record of gameRecords) {
    const opening = detectOpening(
      record.moves.length > 0 ? record.moves : record.pgn,
    );

    // ECO + name 조합을 키로 사용 (같은 ECO에 다른 이름이 매핑될 수 있음)
    const key = `${opening.eco}:${opening.name}`;
    const existing = statsMap.get(key);

    if (existing) {
      existing.gamesPlayed += 1;
      if (record.result === 'win') existing.wins += 1;
      else if (record.result === 'lose') existing.losses += 1;
      else existing.draws += 1;
      existing.totalMoves += record.moveCount;
    } else {
      statsMap.set(key, {
        eco: opening.eco,
        name: opening.name,
        nameKo: opening.nameKo,
        gamesPlayed: 1,
        wins: record.result === 'win' ? 1 : 0,
        losses: record.result === 'lose' ? 1 : 0,
        draws: record.result === 'draw' ? 1 : 0,
        totalMoves: record.moveCount,
      });
    }
  }

  return Array.from(statsMap.values())
    .map((s) => ({
      ...s,
      winRate: s.gamesPlayed > 0 ? (s.wins / s.gamesPlayed) * 100 : 0,
      avgMoves: s.gamesPlayed > 0 ? Math.round(s.totalMoves / s.gamesPlayed) : 0,
    }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}

/**
 * 특정 오프닝의 게임 기록 목록 반환
 */
export function getGamesForOpening(
  gameRecords: GameRecord[],
  eco: string,
  name: string,
): GameRecord[] {
  return gameRecords.filter((record) => {
    const opening = detectOpening(
      record.moves.length > 0 ? record.moves : record.pgn,
    );
    return opening.eco === eco && opening.name === name;
  });
}
