import { buildFinalRanking, buildFunStats } from '../src/domain/gameOutcome';

describe('buildFinalRanking (ASC-18)', () => {
  it('trie par score décroissant et gère les ex aequo', () => {
    const rows = buildFinalRanking(['A', 'B', 'C'], [3, -1, 3]);
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3]);
    expect(rows.map((r) => r.displayName)).toEqual(['A', 'C', 'B']);
  });
});

describe('buildFunStats (ASC-19)', () => {
  it('compte les manches en tête et les extrêmes', () => {
    const rounds = [
      {
        roundIndex: 1,
        announcements: [],
        tricks: [],
        scores: [5, 2, 2],
      },
      {
        roundIndex: 2,
        announcements: [],
        tricks: [],
        scores: [1, 4, 4],
      },
    ];
    const fun = buildFunStats(rounds, 3);
    expect(fun.roundWinsByPlayer[0]).toBe(1);
    expect(fun.roundWinsByPlayer[1]).toBe(1);
    expect(fun.roundWinsByPlayer[2]).toBe(1);
    expect(fun.bestSingleRound?.score).toBe(5);
    expect(fun.worstSingleRound?.score).toBe(1);
  });
});
