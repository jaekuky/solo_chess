// src/data/pieceLessons.ts

import type { PieceLesson } from '@/types';

export const PIECE_LESSONS: PieceLesson[] = [
  {
    piece: 'k',
    name: '킹',
    nameEn: 'King',
    symbol: { w: '♔', b: '♚' },
    value: 0, // 무한한 가치 (잡히면 게임 끝)
    description:
      '킹은 체스에서 가장 중요한 기물입니다. 킹이 잡히면 게임이 끝나기 때문에, 항상 킹을 보호해야 합니다.',
    movementDescription:
      '킹은 모든 방향(가로, 세로, 대각선)으로 한 칸씩 이동할 수 있습니다. 단, 상대 기물이 공격하는 칸으로는 이동할 수 없습니다.',
    specialRules: [
      '캐슬링: 킹이 한 번도 움직이지 않았고, 룩도 움직이지 않았다면 특별한 이동이 가능합니다.',
    ],
    tips: [
      '게임 초반에는 킹을 안전한 곳(캐슬링)으로 피신시키세요.',
      '엔드게임에서는 킹이 적극적으로 참여해야 합니다.',
      '킹 주변에 폰을 배치하면 더 안전합니다.',
    ],
    examplePositions: [
      {
        fen: '8/8/8/4K3/8/8/8/8 w - - 0 1',
        description: '킹은 8방향으로 이동할 수 있습니다.',
        highlightSquares: ['d6', 'e6', 'f6', 'd5', 'f5', 'd4', 'e4', 'f4'],
      },
    ],
  },
  {
    piece: 'q',
    name: '퀸',
    nameEn: 'Queen',
    symbol: { w: '♕', b: '♛' },
    value: 9,
    description:
      '퀸은 가장 강력한 기물입니다. 룩과 비숍의 이동을 합친 것처럼 움직입니다.',
    movementDescription:
      '퀸은 가로, 세로, 대각선 어느 방향으로든 원하는 만큼 이동할 수 있습니다. 단, 다른 기물을 뛰어넘을 수는 없습니다.',
    tips: [
      '퀸을 너무 일찍 활용하면 상대의 공격 대상이 됩니다.',
      '퀸은 체크메이트에서 가장 중요한 역할을 합니다.',
      '퀸의 가치(9점)를 기억하고, 가벼운 기물과 교환하지 마세요.',
    ],
    examplePositions: [
      {
        fen: '8/8/8/4Q3/8/8/8/8 w - - 0 1',
        description: '퀸은 가로, 세로, 대각선으로 자유롭게 이동합니다.',
        highlightSquares: [
          'e1',
          'e2',
          'e3',
          'e4',
          'e6',
          'e7',
          'e8',
          'a5',
          'b5',
          'c5',
          'd5',
          'f5',
          'g5',
          'h5',
          'a1',
          'b2',
          'c3',
          'd4',
          'f6',
          'g7',
          'h8',
          'b8',
          'c7',
          'd6',
          'f4',
          'g3',
          'h2',
        ],
      },
    ],
  },
  {
    piece: 'r',
    name: '룩',
    nameEn: 'Rook',
    symbol: { w: '♖', b: '♜' },
    value: 5,
    description:
      '룩은 직선으로 움직이는 강력한 기물입니다. 특히 열린 파일(폰이 없는 세로줄)에서 위력을 발휘합니다.',
    movementDescription:
      '룩은 가로와 세로 방향으로 원하는 만큼 이동할 수 있습니다. 대각선으로는 이동할 수 없습니다.',
    specialRules: ['캐슬링: 킹과 함께 특별한 이동을 할 수 있습니다.'],
    tips: [
      '열린 파일을 차지하세요.',
      '두 개의 룩을 연결하면 매우 강력합니다.',
      '7랭크(상대 폰 줄)에 룩을 배치하면 위협적입니다.',
    ],
    examplePositions: [
      {
        fen: '8/8/8/4R3/8/8/8/8 w - - 0 1',
        description: '룩은 가로와 세로로 이동합니다.',
        highlightSquares: [
          'e1',
          'e2',
          'e3',
          'e4',
          'e6',
          'e7',
          'e8',
          'a5',
          'b5',
          'c5',
          'd5',
          'f5',
          'g5',
          'h5',
        ],
      },
    ],
  },
  {
    piece: 'b',
    name: '비숍',
    nameEn: 'Bishop',
    symbol: { w: '♗', b: '♝' },
    value: 3,
    description:
      '비숍은 대각선으로 움직입니다. 밝은 칸 비숍과 어두운 칸 비숍이 서로 보완합니다.',
    movementDescription:
      '비숍은 대각선 방향으로 원하는 만큼 이동할 수 있습니다. 시작한 칸의 색상에서 벗어날 수 없습니다.',
    tips: [
      '비숍 쌍(두 비숍)은 매우 강력합니다.',
      '긴 대각선을 지배하세요.',
      '폰 구조가 열려있을 때 비숍이 강합니다.',
    ],
    examplePositions: [
      {
        fen: '8/8/8/4B3/8/8/8/8 w - - 0 1',
        description: '비숍은 대각선으로만 이동합니다.',
        highlightSquares: [
          'a1',
          'b2',
          'c3',
          'd4',
          'f6',
          'g7',
          'h8',
          'b8',
          'c7',
          'd6',
          'f4',
          'g3',
          'h2',
        ],
      },
    ],
  },
  {
    piece: 'n',
    name: '나이트',
    nameEn: 'Knight',
    symbol: { w: '♘', b: '♞' },
    value: 3,
    description:
      '나이트는 L자 모양으로 움직이며, 유일하게 다른 기물을 뛰어넘을 수 있습니다.',
    movementDescription:
      '나이트는 L자 형태로 이동합니다: 한 방향으로 2칸, 그리고 직각으로 1칸. 다른 기물을 뛰어넘을 수 있는 유일한 기물입니다.',
    tips: [
      '나이트는 가장자리보다 중앙에 있을 때 강합니다.',
      '폰 구조가 닫혀있을 때 나이트가 비숍보다 유리합니다.',
      '나이트 포크(동시에 여러 기물 공격)를 노리세요.',
    ],
    examplePositions: [
      {
        fen: '8/8/8/4N3/8/8/8/8 w - - 0 1',
        description: '나이트는 L자 모양으로 8곳으로 점프할 수 있습니다.',
        highlightSquares: ['d7', 'f7', 'c6', 'g6', 'c4', 'g4', 'd3', 'f3'],
      },
    ],
  },
  {
    piece: 'p',
    name: '폰',
    nameEn: 'Pawn',
    symbol: { w: '♙', b: '♟' },
    value: 1,
    description:
      '폰은 가장 약하지만 가장 많은 기물입니다. 마지막 줄에 도달하면 다른 기물로 승격할 수 있습니다.',
    movementDescription:
      '폰은 앞으로 한 칸씩 이동합니다(처음에만 두 칸 가능). 잡을 때는 대각선 앞으로 이동합니다.',
    specialRules: [
      '첫 이동 시 두 칸 전진 가능',
      '앙파상: 상대 폰이 두 칸 전진했을 때 특별한 방법으로 잡기',
      '프로모션: 마지막 줄 도달 시 퀸/룩/비숍/나이트로 승격',
    ],
    tips: [
      '폰 구조를 무너뜨리지 마세요.',
      '패스트 폰(앞을 막는 폰이 없는)은 매우 강력합니다.',
      '폰을 함부로 전진시키면 되돌릴 수 없습니다.',
    ],
    examplePositions: [
      {
        fen: '8/8/8/8/4P3/8/8/8 w - - 0 1',
        description: '폰은 앞으로 한 칸 이동하고, 대각선으로 상대를 잡습니다.',
        highlightSquares: ['e5', 'd5', 'f5'],
      },
    ],
  },
];

// 기물 순서 (학습 권장 순서)
export const PIECE_LESSON_ORDER: PieceLesson['piece'][] = [
  'p',
  'r',
  'b',
  'n',
  'q',
  'k',
];
