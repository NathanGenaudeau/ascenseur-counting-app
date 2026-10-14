import type { FinishedGameRecord } from '../src/domain/finishedGameRecord';
import type { CompletedRound } from '../src/domain/gamePlayState';
import {
  aggregatePlayerStats,
  buildLeaderboards,
  formatLeaderboardValue,
  MIN_GAMES_FOR_STATS,
  normalizePlayerKey,
  playersEligibleForStats,
  type PlayerGlobalStats,
} from '../src/domain/globalStats';
import { computeRoundScoresForPlayers } from '../src/domain/scoring';

function round(roundIndex: number, announcements: number[], tricks: number[]): CompletedRound {
  return {
    roundIndex,
    announcements,
    tricks,
    scores: computeRoundScoresForPlayers(announcements, tricks),
  };
}

function game(
  id: string,
  playerNames: string[],
  roundsCompleted: CompletedRound[],
): FinishedGameRecord {
  return {
    id,
    version: 1,
    endedAt: '2026-01-01T00:00:00.000Z',
    playerNames,
    settings: {},
    roundsCompleted,
  };
}

/**
 * Partie 1 (A, B, C) : A gagne (4), B 2e (-1), C 3e (-2).
 *   M1 : A 1/1 ✓, B 0/0 ✓, C 1/0 ✗   M2 : A 2/2 ✓, B 1/2 ✗, C 0/0 ✓   M3 : A 1/1 ✓, B 0/0 ✓, C 2/1 ✗
 * Partie 2 (A, B) : B gagne 3, A 2e (-1).
 *   M1 : A 1/0 ✗, B 1/1 ✓   M2 : A 0/0 ✓, B 2/2 ✓
 */
const games = [
  game(
    'g1',
    ['A', 'B', 'C'],
    [
      round(1, [1, 0, 1], [1, 0, 0]),
      round(2, [2, 1, 0], [2, 2, 0]),
      round(3, [1, 0, 2], [1, 0, 1]),
    ],
  ),
  game('g2', ['a ', 'B'], [round(1, [1, 1], [0, 1]), round(2, [0, 2], [0, 2])]),
];

function byName(stats: PlayerGlobalStats[], name: string): PlayerGlobalStats {
  const s = stats.find((x) => x.displayName === name);
  if (!s) throw new Error(`joueur ${name} absent`);
  return s;
}

describe('aggregatePlayerStats (ASC-23)', () => {
  it('regroupe les joueurs par nom normalisé', () => {
    expect(normalizePlayerKey('  Alice  ')).toBe('alice');
    expect(aggregatePlayerStats(games)).toHaveLength(3);
  });

  it('calcule taux de victoire, place moyenne et points moyens', () => {
    const stats = aggregatePlayerStats(games);
    const a = byName(stats, 'A');
    expect(a.gamesPlayed).toBe(2);
    expect(a.gamesWon).toBe(1);
    expect(a.winRate).toBe(0.5);
    // 1er sur 3 puis 2e sur 2 : (1/3 + 1) / 2
    expect(a.averagePlacement).toBeCloseTo(2 / 3);
    expect(a.totalScore).toBe(3);
    expect(a.averagePoints).toBe(1.5);

    const c = byName(stats, 'C');
    expect(c.winRate).toBe(0);
    expect(c.averagePlacement).toBe(1);
  });

  it('retient la plus longue série de paris réussis sur une seule partie', () => {
    const stats = aggregatePlayerStats(games);
    expect(byName(stats, 'A').bestBetStreak).toBe(3);
    // B : ✓✗✓ puis ✓✓ dans l’autre partie, les séries ne se cumulent pas entre parties
    expect(byName(stats, 'B').bestBetStreak).toBe(2);
    expect(byName(stats, 'C').bestBetStreak).toBe(1);
  });

  it('moyenne le taux de paris réussis partie par partie', () => {
    const stats = aggregatePlayerStats(games);
    // A : 3/3 puis 1/2
    expect(byName(stats, 'A').averageBetSuccessRate).toBeCloseTo(0.75);
    // B : 2/3 puis 2/2
    expect(byName(stats, 'B').averageBetSuccessRate).toBeCloseTo(5 / 6);
  });

  it('ignore les parties sans manche', () => {
    expect(aggregatePlayerStats([game('empty', ['A', 'B'], [])])).toEqual([]);
  });
});

describe('playersEligibleForStats', () => {
  it('ne garde que les joueurs ayant au moins 3 parties', () => {
    expect(MIN_GAMES_FOR_STATS).toBe(3);
    const three = [game('x1', ['A', 'B'], [round(1, [0, 0], [1, 0])])];
    const games3 = [
      ...three,
      game('x2', ['A', 'B'], [round(1, [0, 0], [1, 0])]),
      game('x3', ['A', 'C'], [round(1, [0, 0], [1, 0])]),
    ];
    expect(playersEligibleForStats(aggregatePlayerStats(games3)).map((s) => s.displayName)).toEqual(
      ['A'],
    );
  });
});

describe('buildLeaderboards', () => {
  it('produit les cinq classements dans l’ordre demandé', () => {
    const boards = buildLeaderboards(aggregatePlayerStats(games));
    expect(boards.map((b) => b.id)).toEqual([
      'winRate',
      'averagePlacement',
      'averagePoints',
      'bestBetStreak',
      'betSuccessRate',
    ]);
  });

  it('classe la place moyenne du plus petit au plus grand pourcentage', () => {
    const boards = buildLeaderboards(aggregatePlayerStats(games));
    const placement = boards.find((b) => b.id === 'averagePlacement')!;
    // B : (2/3 + 1/2) / 2 ≈ 0,583 ; A ≈ 0,667 ; C = 1
    expect(placement.podium.map((e) => e.displayName)).toEqual(['B', 'A', 'C']);
  });

  it('fait partager le rang aux ex aequo et départage l’affichage au nombre de parties', () => {
    const boards = buildLeaderboards(aggregatePlayerStats(games));
    const winRate = boards.find((b) => b.id === 'winRate')!;
    expect(winRate.podium.map((e) => [e.displayName, e.rank])).toEqual([
      ['A', 1],
      ['B', 1],
      ['C', 3],
    ]);
  });

  it('limite le podium à trois joueurs', () => {
    const many = [
      game('g', ['A', 'B', 'C', 'D', 'E'], [round(1, [0, 0, 0, 0, 0], [1, 0, 0, 0, 0])]),
    ];
    for (const board of buildLeaderboards(aggregatePlayerStats(many))) {
      expect(board.podium.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('formatLeaderboardValue', () => {
  it('formate pourcentages, place, points et série', () => {
    expect(formatLeaderboardValue('winRate', 2 / 3)).toBe('67 %');
    expect(formatLeaderboardValue('averagePlacement', 0.4)).toBe('Top 40 %');
    expect(formatLeaderboardValue('averagePoints', 12.345)).toBe('12,3 pts');
    expect(formatLeaderboardValue('bestBetStreak', 1)).toBe('1 pari');
    expect(formatLeaderboardValue('bestBetStreak', 5)).toBe('5 paris');
  });
});
