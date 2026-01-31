// src/data/specialRuleLessons.ts

import type { SpecialRuleLesson } from '@/types';

export const SPECIAL_RULE_LESSONS: SpecialRuleLesson[] = [
  {
    id: 'castling',
    name: '캐슬링',
    description:
      '킹을 안전하게 보호하면서 룩을 활성화하는 특별한 이동입니다. 게임에서 한 번만 사용할 수 있습니다.',
    steps: [
      {
        instruction: '캐슬링은 킹과 룩이 동시에 움직이는 특별한 수입니다.',
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        highlightSquares: ['e1', 'a1', 'h1'],
      },
      {
        instruction:
          '킹사이드 캐슬링 (O-O): 킹이 g1으로, 룩이 f1으로 이동합니다.',
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        arrowFrom: 'e1',
        arrowTo: 'g1',
        highlightSquares: ['f1', 'g1'],
      },
      {
        instruction:
          '퀸사이드 캐슬링 (O-O-O): 킹이 c1으로, 룩이 d1으로 이동합니다.',
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        arrowFrom: 'e1',
        arrowTo: 'c1',
        highlightSquares: ['c1', 'd1'],
      },
      {
        instruction:
          '캐슬링 조건: 1) 킹과 룩이 한 번도 움직이지 않았어야 합니다.',
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      },
      {
        instruction:
          '캐슬링 조건: 2) 킹과 룩 사이에 다른 기물이 없어야 합니다.',
        fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R2QK2R w KQkq - 0 1',
        highlightSquares: ['d1'],
      },
      {
        instruction:
          '캐슬링 조건: 3) 킹이 체크 상태가 아니어야 하고, 킹이 지나가는 칸이 공격받고 있으면 안 됩니다.',
        fen: 'r3k2r/pppp1ppp/8/4q3/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
        highlightSquares: ['e1', 'f1', 'g1'],
      },
    ],
    interactiveExample: {
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      correctMove: 'e1g1',
      explanation:
        '킹사이드로 캐슬링하세요! 킹을 g1으로 이동하면 됩니다.',
    },
  },
  {
    id: 'en-passant',
    name: '앙파상',
    description:
      '상대 폰이 첫 이동으로 두 칸 전진하여 내 폰 옆에 왔을 때, 마치 한 칸만 전진한 것처럼 잡을 수 있는 특별한 규칙입니다.',
    steps: [
      {
        instruction: '백 폰이 5랭크에, 흑 폰이 시작 위치에 있습니다.',
        fen: '8/4p3/8/3P4/8/8/8/8 w - - 0 1',
        highlightSquares: ['d5', 'e7'],
      },
      {
        instruction: '흑 폰이 두 칸 전진하여 e5로 왔습니다.',
        fen: '8/8/8/3Pp3/8/8/8/8 w - e6 0 1',
        arrowFrom: 'e7',
        arrowTo: 'e5',
        highlightSquares: ['e5'],
      },
      {
        instruction:
          '백은 "앙파상"으로 흑 폰을 잡을 수 있습니다. 마치 e6에서 잡는 것처럼!',
        fen: '8/8/8/3Pp3/8/8/8/8 w - e6 0 1',
        arrowFrom: 'd5',
        arrowTo: 'e6',
        highlightSquares: ['e6'],
      },
      {
        instruction:
          '앙파상 후: 백 폰이 e6으로 이동하고, 흑 폰(e5)이 사라집니다.',
        fen: '8/8/4P3/8/8/8/8/8 b - - 0 1',
        highlightSquares: ['e6'],
      },
      {
        instruction:
          '중요: 앙파상은 상대가 두 칸 전진한 직후에만 가능합니다. 한 턴이 지나면 기회가 사라집니다!',
        fen: '8/8/8/3Pp3/8/8/8/8 w - e6 0 1',
      },
    ],
    interactiveExample: {
      fen: '8/8/8/3Pp3/8/8/8/8 w - e6 0 1',
      correctMove: 'd5e6',
      explanation:
        '앙파상으로 흑 폰을 잡으세요! d5 폰을 e6으로 이동하면 됩니다.',
    },
  },
  {
    id: 'promotion',
    name: '폰 승격(프로모션)',
    description:
      '폰이 상대 진영의 마지막 줄에 도달하면, 퀸/룩/비숍/나이트 중 하나로 승격됩니다.',
    steps: [
      {
        instruction: '백 폰이 7랭크에 도달했습니다. 한 칸만 더 가면 승격!',
        fen: '8/4P3/8/8/8/8/8/8 w - - 0 1',
        highlightSquares: ['e7'],
        arrowFrom: 'e7',
        arrowTo: 'e8',
      },
      {
        instruction:
          '폰이 8랭크에 도달하면 퀸, 룩, 비숍, 나이트 중 하나를 선택합니다.',
        fen: '4Q3/8/8/8/8/8/8/8 w - - 0 1',
        highlightSquares: ['e8'],
      },
      {
        instruction: '대부분의 경우 퀸을 선택합니다. 가장 강력하기 때문이죠!',
        fen: '4Q3/8/8/8/8/8/8/8 w - - 0 1',
      },
      {
        instruction:
          '하지만 때로는 나이트를 선택하는 것이 더 좋을 수 있습니다. (나이트 포크 등)',
        fen: '8/1P6/8/k1K5/8/8/8/8 w - - 0 1',
        highlightSquares: ['b7'],
      },
      {
        instruction:
          'b8에서 나이트로 승격하면 킹과 다른 기물을 동시에 공격할 수 있습니다!',
        fen: '1N6/8/8/k1K5/8/8/8/8 w - - 0 1',
        highlightSquares: ['b8', 'a6'],
      },
    ],
    interactiveExample: {
      fen: '8/4P3/8/8/8/8/8/4k2K w - - 0 1',
      correctMove: 'e7e8q',
      explanation: '폰을 8랭크로 전진시켜 퀸으로 승격하세요!',
    },
  },
  {
    id: 'check',
    name: '체크',
    description:
      '킹이 상대 기물의 공격을 받고 있는 상태입니다. 반드시 체크를 해소해야 합니다.',
    steps: [
      {
        instruction:
          '백 퀸이 흑 킹을 공격하고 있습니다. 이것이 "체크"입니다.',
        fen: '4k3/8/8/8/8/8/8/4Q2K w - - 0 1',
        highlightSquares: ['e8', 'e1'],
        arrowFrom: 'e1',
        arrowTo: 'e8',
      },
      {
        instruction: '체크를 해소하는 방법 1: 킹을 안전한 곳으로 이동',
        fen: '4k3/8/8/8/8/8/8/4Q2K b - - 0 1',
        highlightSquares: ['d8', 'd7', 'f8', 'f7'],
      },
      {
        instruction: '체크를 해소하는 방법 2: 다른 기물로 공격을 막기',
        fen: '4k3/3r4/8/8/8/8/8/4Q2K b - - 0 1',
        arrowFrom: 'd7',
        arrowTo: 'd1',
      },
      {
        instruction: '체크를 해소하는 방법 3: 공격하는 기물을 잡기',
        fen: '4k3/4r3/8/8/8/8/8/4Q2K b - - 0 1',
        arrowFrom: 'e7',
        arrowTo: 'e1',
      },
    ],
  },
  {
    id: 'checkmate',
    name: '체크메이트',
    description:
      '체크 상태에서 어떤 수를 두어도 체크를 피할 수 없는 상태입니다. 게임이 즉시 종료됩니다.',
    steps: [
      {
        instruction:
          '이것이 체크메이트입니다. 흑 킹은 도망갈 곳이 없습니다.',
        fen: '6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1',
        highlightSquares: ['g8', 'e8'],
      },
      {
        instruction: '백 룩이 8랭크에서 체크를 하고 있습니다.',
        fen: '4R1k1/5ppp/8/8/8/8/8/7K b - - 0 1',
        arrowFrom: 'e8',
        arrowTo: 'g8',
      },
      {
        instruction:
          '킹은 f8, g7, h8로 이동할 수 없습니다 (자신의 폰이나 룩이 막고 있음).',
        fen: '4R1k1/5ppp/8/8/8/8/8/7K b - - 0 1',
        highlightSquares: ['f8', 'g7', 'h8', 'f7', 'h7'],
      },
      {
        instruction:
          '막을 기물도 없고, 룩을 잡을 수도 없습니다. 체크메이트!',
        fen: '4R1k1/5ppp/8/8/8/8/8/7K b - - 0 1',
      },
    ],
  },
  {
    id: 'stalemate',
    name: '스테일메이트',
    description:
      '자신의 차례에 합법적인 수가 없지만 체크 상태가 아닌 경우입니다. 무승부가 됩니다.',
    steps: [
      {
        instruction: '흑의 차례입니다. 킹은 체크 상태가 아닙니다.',
        fen: '7k/8/6K1/8/8/8/8/6Q1 b - - 0 1',
        highlightSquares: ['h8'],
      },
      {
        instruction:
          '하지만 킹이 이동할 수 있는 모든 칸이 백 퀸이나 킹에 의해 공격받고 있습니다.',
        fen: '7k/8/6K1/8/8/8/8/6Q1 b - - 0 1',
        highlightSquares: ['g8', 'h7', 'g7'],
      },
      {
        instruction:
          '이것이 스테일메이트입니다. 합법적인 수가 없으므로 무승부!',
        fen: '7k/8/6K1/8/8/8/8/6Q1 b - - 0 1',
      },
      {
        instruction: '주의: 상대를 완전히 이기려면 스테일메이트를 피해야 합니다!',
        fen: '7k/8/6K1/8/8/8/8/6Q1 b - - 0 1',
      },
    ],
  },
];
