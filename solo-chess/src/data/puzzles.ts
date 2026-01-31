// src/data/puzzles.ts

import type { Puzzle } from '@/types';

export const PUZZLES: Puzzle[] = [
  // 초급 퍼즐 (1수 체크메이트)
  {
    id: 'beginner-001',
    title: '백 투 메이트',
    description: '한 수로 체크메이트를 완성하세요.',
    difficulty: 'beginner',
    fen: '6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1',
    solution: ['e1e8'],
    hints: [
      '룩을 8랭크로 이동하세요.',
      '킹이 도망갈 곳이 있는지 확인하세요.',
    ],
    themes: ['back-rank', 'mate-in-1'],
    playerColor: 'w',
  },
  {
    id: 'beginner-002',
    title: '퀸의 힘',
    description: '퀸으로 체크메이트를 완성하세요.',
    difficulty: 'beginner',
    fen: '6k1/8/5K2/8/8/8/8/7Q w - - 0 1',
    solution: ['h1g2'],
    hints: ['퀸을 g2로 이동하면?', '킹이 도망갈 수 없습니다.'],
    themes: ['queen', 'mate-in-1'],
    playerColor: 'w',
  },
  {
    id: 'beginner-003',
    title: '기사의 체크메이트',
    description: '나이트로 체크메이트를 완성하세요.',
    difficulty: 'beginner',
    fen: '5rk1/5ppp/8/8/8/5N2/8/7K w - - 0 1',
    solution: ['f3h4'],
    hints: [
      '나이트를 h4로 이동하세요.',
      '나이트가 g6을 공격합니다.',
    ],
    themes: ['knight', 'smothered-mate'],
    playerColor: 'w',
  },
  {
    id: 'beginner-004',
    title: '비숍 체크메이트',
    description: '비숍과 룩의 협력으로 체크메이트!',
    difficulty: 'beginner',
    fen: '2kr4/ppp5/8/8/8/8/5B2/4R2K w - - 0 1',
    solution: ['f2a7'],
    hints: [
      '비숍으로 a7을 공격하세요.',
      '킹의 도주로를 막습니다.',
    ],
    themes: ['bishop', 'mate-in-1'],
    playerColor: 'w',
  },
  {
    id: 'beginner-005',
    title: '더블 룩 메이트',
    description: '두 룩으로 체크메이트를 완성하세요.',
    difficulty: 'beginner',
    fen: '6k1/8/8/8/8/8/8/R3R2K w - - 0 1',
    solution: ['e1e8'],
    hints: [
      '룩 중 하나를 8랭크로!',
      '다른 룩이 백업하고 있습니다.',
    ],
    themes: ['rook', 'back-rank', 'mate-in-1'],
    playerColor: 'w',
  },

  // 쉬움 퍼즐 (1수 체크메이트, 약간 복잡)
  {
    id: 'easy-001',
    title: '퀸 새크리파이스',
    description: '퀸을 희생하여 체크메이트!',
    difficulty: 'easy',
    fen: '3r2k1/5ppp/8/8/8/2Q5/8/7K w - - 0 1',
    solution: ['c3g7'],
    hints: ['퀸을 g7으로...', '킹이 잡을 수밖에 없지만?'],
    themes: ['queen-sacrifice', 'mate-in-1'],
    playerColor: 'w',
  },
  {
    id: 'easy-002',
    title: '발견된 체크메이트',
    description: '발견 체크로 메이트!',
    difficulty: 'easy',
    fen: '3qk3/8/4B3/8/8/8/8/4R2K w - - 0 1',
    solution: ['e6d7'],
    hints: [
      '비숍을 움직이면 룩이 체크!',
      'd7이 정답입니다.',
    ],
    themes: ['discovered-attack', 'mate-in-1'],
    playerColor: 'w',
  },

  // 중급 퍼즐 (2수 체크메이트)
  {
    id: 'medium-001',
    title: '2수 메이트',
    description: '두 수만에 체크메이트를 완성하세요.',
    difficulty: 'medium',
    fen: '6k1/5p2/6p1/8/8/8/8/4R2K w - - 0 1',
    solution: ['e1e8', 'f7f6', 'e8f8'],
    hints: [
      '먼저 체크를 하세요.',
      '킹을 구석으로 몰아넣습니다.',
    ],
    themes: ['back-rank', 'mate-in-2'],
    playerColor: 'w',
  },
  {
    id: 'medium-002',
    title: '퀸 희생 후 메이트',
    description: '퀸을 희생하고 메이트!',
    difficulty: 'medium',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    solution: ['h5f7'],
    hints: [
      '퀸으로 f7을 공격하세요.',
      '킹이 잡으면?',
    ],
    themes: ['scholars-mate', 'mate-in-1'],
    playerColor: 'w',
  },
  {
    id: 'medium-003',
    title: '나이트 포크 후 메이트',
    description: '나이트로 포크를 만들어 메이트!',
    difficulty: 'medium',
    fen: '5rk1/5ppp/8/8/2N5/8/8/7K w - - 0 1',
    solution: ['c4e5', 'g7g6', 'e5f7'],
    hints: [
      '나이트를 e5로!',
      '그 다음 f7로 이동합니다.',
    ],
    themes: ['knight', 'fork', 'mate-in-2'],
    playerColor: 'w',
  },

  // 어려움 퍼즐 (3수 이상)
  {
    id: 'hard-001',
    title: '조용한 수',
    description: '3수 만에 메이트. 첫 수가 핵심!',
    difficulty: 'hard',
    fen: '6k1/5p2/4p1p1/8/7Q/8/8/7K w - - 0 1',
    solution: ['h4d8', 'g8h7', 'd8h4', 'h7g8', 'h4h8'],
    hints: [
      '퀸을 d8로 조용히 이동',
      '킹을 강제로 h7로',
      '그리고 h8로 메이트',
    ],
    themes: ['quiet-move', 'mate-in-3'],
    playerColor: 'w',
  },
  {
    id: 'hard-002',
    title: '희생의 연속',
    description: '여러 기물을 희생하여 메이트!',
    difficulty: 'hard',
    fen: 'r1bqk2r/pppp1Qpp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    solution: ['f7f6', 'e8f7', 'c4g8'],
    hints: [
      '퀸으로 f6 체크',
      '킹이 f7로 도망하면 비숍이...',
    ],
    themes: ['sacrifice', 'mate-in-2'],
    playerColor: 'w',
  },
];

// 퍼즐 난이도별 필터
export function getPuzzlesByDifficulty(
  difficulty: Puzzle['difficulty'],
): Puzzle[] {
  return PUZZLES.filter((p) => p.difficulty === difficulty);
}

// 랜덤 퍼즐 가져오기
export function getRandomPuzzle(difficulty?: Puzzle['difficulty']): Puzzle {
  const puzzles = difficulty ? getPuzzlesByDifficulty(difficulty) : PUZZLES;
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

// 특정 테마의 퍼즐 가져오기
export function getPuzzlesByTheme(theme: string): Puzzle[] {
  return PUZZLES.filter((p) => p.themes.includes(theme));
}
