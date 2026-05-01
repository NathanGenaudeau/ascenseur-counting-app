import {
  buildBettingHighlights,
  buildFinalRanking,
  buildFunStats,
  currentBetSuccessStreak,
} from '../src/domain/gameOutcome';

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

describe('buildBettingHighlights', () => {
  it('calcule taux et séries à partir des annonces et plis', () => {
    const rounds = [
      {
        roundIndex: 1,
        announcements: [2, 1],
        tricks: [2, 0],
        scores: [2, -1],
      },
      {
        roundIndex: 2,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [1, 1],
      },
      {
        roundIndex: 3,
        announcements: [2, 2],
        tricks: [2, 1],
        scores: [2, -1],
      },
    ];
    const h = buildBettingHighlights(rounds, 2);
    expect(h.bestSuccessRate).toEqual({ playerIndices: [0], percent: 100 });
    expect(h.biggestDrop).toEqual({ playerIndices: [1], lossPoints: 1, roundCount: 3 });
    expect(h.bestStreak).toEqual({ playerIndices: [0], streak: 3 });
    expect(h.mostZeroBets).toEqual({ playerIndices: [0, 1], count: 0 });
  });

  it('retourne null partout sans manche', () => {
    const h = buildBettingHighlights([], 2);
    expect(h.bestSuccessRate).toBeNull();
    expect(h.biggestDrop).toBeNull();
    expect(h.bestStreak).toBeNull();
    expect(h.mostZeroBets).toBeNull();
  });

  it('compte les annonces à 0 par joueur', () => {
    const rounds = [
      {
        roundIndex: 1,
        announcements: [2, 0],
        tricks: [2, 0],
        scores: [2, 0],
      },
      {
        roundIndex: 2,
        announcements: [1, 0],
        tricks: [1, 0],
        scores: [1, 0],
      },
      {
        roundIndex: 3,
        announcements: [2, 0],
        tricks: [2, 0],
        scores: [2, 0],
      },
    ];
    const h = buildBettingHighlights(rounds, 2);
    expect(h.mostZeroBets).toEqual({ playerIndices: [1], count: 3 });
  });

  it('currentBetSuccessStreak : série en partant de la dernière manche', () => {
    const rounds = [
      {
        roundIndex: 1,
        announcements: [1, 0],
        tricks: [1, 2],
        scores: [1, -2],
      },
      {
        roundIndex: 2,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [1, 1],
      },
      {
        roundIndex: 3,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [1, 1],
      },
    ];
    expect(currentBetSuccessStreak(rounds, 0)).toBe(3);
    expect(currentBetSuccessStreak(rounds, 1)).toBe(2);
  });

  it('plus grosse chute de points sur manches consécutives', () => {
    const rounds = [
      {
        roundIndex: 1,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [2, -1],
      },
      {
        roundIndex: 2,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [-1, -2],
      },
      {
        roundIndex: 3,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [-2, -1],
      },
      {
        roundIndex: 4,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [-1, -2],
      },
    ];
    const h = buildBettingHighlights(rounds, 2);
    expect(h.biggestDrop).toEqual({ playerIndices: [1], lossPoints: 6, roundCount: 4 });
  });

  it('liste tous les ex aequo (taux de réussite)', () => {
    const rounds = [
      {
        roundIndex: 1,
        announcements: [1, 1],
        tricks: [1, 1],
        scores: [1, 1],
      },
    ];
    const h = buildBettingHighlights(rounds, 2);
    expect(h.bestSuccessRate).toEqual({ playerIndices: [0, 1], percent: 100 });
  });
});
