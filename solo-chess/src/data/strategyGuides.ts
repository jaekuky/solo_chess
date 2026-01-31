// src/data/strategyGuides.ts

import type { StrategyGuide } from '@/types';

export const STRATEGY_GUIDES: StrategyGuide[] = [
  // 기본 원칙
  {
    id: 'basic-principles',
    category: 'principles',
    title: '체스의 기본 원칙',
    summary: '모든 체스 플레이어가 알아야 할 핵심 원칙들',
    difficulty: 'beginner',
    content: `
# 체스의 기본 원칙

체스를 잘 두기 위해서는 몇 가지 기본 원칙을 이해해야 합니다.

## 1. 중앙을 지배하라
체스판의 중앙(d4, d5, e4, e5)은 가장 중요한 영역입니다. 중앙을 지배하면:
- 기물들의 활동 범위가 넓어집니다
- 킹사이드와 퀸사이드 모두로 빠르게 이동할 수 있습니다

## 2. 기물을 빨리 전개하라
게임 초반에는 기물들을 활성화하는 것이 중요합니다:
- 나이트와 비숍을 먼저 전개하세요
- 같은 기물을 두 번 움직이는 것을 피하세요
- 퀸을 너무 일찍 전개하지 마세요

## 3. 킹의 안전을 확보하라
- 가능하면 빨리 캐슬링하세요
- 킹 주변의 폰을 함부로 움직이지 마세요
- 상대의 공격 기물들을 주시하세요

## 4. 시간을 낭비하지 마라
체스에서 "템포"는 매우 중요합니다:
- 한 수 한 수가 목적이 있어야 합니다
- 무의미한 위협을 피하세요
- 발전을 방해하는 수를 피하세요
`,
    examples: [
      {
        fen: 'r1bqkbnr/pppppppp/2n5/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1',
        description:
          '백은 e4로 중앙을 점령하고 나이트를 전개했습니다. 좋은 시작!',
      },
    ],
  },

  // 오프닝
  {
    id: 'opening-basics',
    category: 'opening',
    title: '오프닝 기초',
    summary: '게임 시작 단계의 기본 전략',
    difficulty: 'beginner',
    content: `
# 오프닝 기초

오프닝(게임 초반)의 목표는 세 가지입니다:

## 1. 기물 전개
- 나이트: f3/c3 (백), f6/c6 (흑)
- 비숍: 좋은 대각선 확보
- 캐슬링으로 룩을 연결

## 2. 중앙 통제
- e4/d4 폰을 전진
- 중앙에 영향력 행사

## 3. 킹 안전
- 10수 이내에 캐슬링 목표
- 킹 앞 폰 구조 유지

## 추천 오프닝
초보자에게 추천하는 오프닝:

### 백일 때
- **이탈리안 게임**: 1.e4 e5 2.Nf3 Nc6 3.Bc4
- **런던 시스템**: 1.d4 Nf6 2.Bf4

### 흑일 때
- e4에 대해: 1...e5 (시메트리컬)
- d4에 대해: 1...Nf6 (인디안 방어)
`,
    examples: [
      {
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
        description:
          '이탈리안 게임 기본 포지션. 비숍이 f7을 노립니다.',
      },
    ],
  },

  // 미들게임
  {
    id: 'middlegame-tactics',
    category: 'middlegame',
    title: '미들게임 전술',
    summary: '게임 중반의 전술적 요소들',
    difficulty: 'intermediate',
    content: `
# 미들게임 전술

미들게임에서는 전술적 기회를 포착하는 것이 중요합니다.

## 포크 (Fork)
한 기물이 동시에 두 개 이상의 기물을 공격하는 것
- 나이트 포크가 가장 흔함
- 폰, 비숍, 퀸, 킹 모두 포크 가능

## 핀 (Pin)
기물이 더 가치있는 기물 앞에 있어서 움직일 수 없는 상태
- 절대 핀: 킹 앞에 있어서 움직일 수 없음
- 상대 핀: 움직일 수는 있지만 가치 손실

## 스큐어 (Skewer)
핀의 반대 - 가치 높은 기물이 앞에 있고 낮은 기물이 뒤에 있음

## 발견 공격 (Discovered Attack)
기물이 움직이면서 뒤에 있던 기물의 공격선을 열어주는 것

## 더블 체크 (Double Check)
두 기물이 동시에 체크를 하는 것 - 킹이 반드시 움직여야 함
`,
    examples: [
      {
        fen: 'r1bqkbnr/pppp1ppp/2n5/4N3/4P3/8/PPPP1PPP/RNBQKB1R b KQkq - 0 1',
        description:
          '나이트가 c6 나이트와 f7 폰을 동시에 공격하는 포크!',
      },
    ],
  },

  // 엔드게임
  {
    id: 'endgame-basics',
    category: 'endgame',
    title: '엔드게임 기초',
    summary: '게임 종반의 기본 기술',
    difficulty: 'intermediate',
    content: `
# 엔드게임 기초

엔드게임(게임 종반)에서는 작은 우위가 승리로 이어집니다.

## 킹의 활성화
- 엔드게임에서 킹은 강력한 전투 기물!
- 중앙으로 킹을 진출시키세요

## 패스트 폰
- 앞을 막는 상대 폰이 없는 폰
- 승격 위협이 있어 매우 강력

## 기본 메이트 패턴

### 퀸 vs 킹
1. 킹을 가장자리로 몰기
2. 퀸과 킹의 협력

### 룩 vs 킹
1. 킹을 가장자리로 몰기
2. 룩으로 끊어서 몰아넣기

### 두 비숍 vs 킹
1. 대각선으로 영역 제한
2. 구석으로 몰아넣기

## 중요한 원칙
- 룩은 패스트 폰 뒤에!
- 오퍼지션(대각선 마주보기) 활용
- 삼각 이동으로 템포 획득
`,
    examples: [
      {
        fen: '8/8/8/8/4k3/8/4P3/4K3 w - - 0 1',
        description:
          '기본 킹+폰 vs 킹 엔드게임. 오퍼지션이 핵심!',
      },
    ],
  },

  // 전술
  {
    id: 'tactical-patterns',
    category: 'tactics',
    title: '전술 패턴 익히기',
    summary: '자주 등장하는 전술 패턴들',
    difficulty: 'beginner',
    content: `
# 전술 패턴 익히기

체스에서 자주 등장하는 전술 패턴들을 알아봅시다.

## 백랭크 메이트
- 킹이 마지막 줄에 갇혀있고
- 룩이나 퀸이 마지막 줄로 침투
- 킹 앞 폰들이 탈출로를 막음

## 스모더드 메이트 (질식 메이트)
- 킹 주변이 자신의 기물로 둘러싸임
- 나이트가 체크메이트 완성
- 탈출 불가능!

## 그릭 기프트 희생
- h7(또는 h2) 폰에 비숍 희생
- 킹을 노출시켜 공격
- Bxh7+, Kg8(h8), Ng5+ 패턴

## 더블 비숍 희생
- 두 비숍을 연속으로 희생
- 킹 앞 폰 구조 파괴
- 강력한 공격 시작

## 실전 팁
1. 상대 킹 주변을 항상 관찰
2. 자신의 기물 배치 최적화
3. 희생 가능성을 항상 고려
4. 체크, 잡기, 위협 순서로 분석
`,
    examples: [
      {
        fen: '6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1',
        description: '전형적인 백랭크 메이트 위협. Re8#가 메이트!',
      },
    ],
  },
];

// 카테고리별 가이드 필터
export function getGuidesByCategory(
  category: StrategyGuide['category'],
): StrategyGuide[] {
  return STRATEGY_GUIDES.filter((g) => g.category === category);
}

// 난이도별 가이드 필터
export function getGuidesByDifficulty(
  difficulty: StrategyGuide['difficulty'],
): StrategyGuide[] {
  return STRATEGY_GUIDES.filter((g) => g.difficulty === difficulty);
}
