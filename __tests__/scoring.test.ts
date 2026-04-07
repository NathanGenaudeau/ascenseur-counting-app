import {
  computeCumulativeScores,
  computeRoundScore,
  computeRoundScoreFromBid,
  computeRoundScoresForPlayers,
} from '../src/domain/scoring';

describe('computeRoundScore (ASC-11)', () => {
  it('retourne le nombre annoncé si égal au réalisé', () => {
    expect(computeRoundScore(3, 3)).toBe(3);
  });

  it('retourne -1 pour annonce 3 et réalisé 2', () => {
    expect(computeRoundScore(3, 2)).toBe(-1);
  });

  it('retourne -2 pour annonce 4 et réalisé 6', () => {
    expect(computeRoundScore(4, 6)).toBe(-2);
  });
});

describe('computeRoundScoreFromBid (ASC-51)', () => {
  it('est équivalent à computeRoundScore pour bid / tricks_won', () => {
    expect(computeRoundScoreFromBid(3, 3)).toBe(computeRoundScore(3, 3));
    expect(computeRoundScoreFromBid(3, 2)).toBe(computeRoundScore(3, 2));
  });
});

describe('computeRoundScoresForPlayers', () => {
  it('applique la règle à chaque joueur', () => {
    const scores = computeRoundScoresForPlayers([3, 4], [2, 4]);
    expect(scores[0]).toBe(-1);
    expect(scores[1]).toBe(4);
  });
});

describe('computeCumulativeScores (ASC-43)', () => {
  it('somme les manches validées', () => {
    const cum = computeCumulativeScores(
      [
        { scores: [3, -1, 0] },
        { scores: [-2, 4, 1] },
      ],
      3,
    );
    expect(cum).toEqual([1, 3, 1]);
  });

  it('supporte les scores négatifs cumulés', () => {
    const cum = computeCumulativeScores([{ scores: [-1, -2] }], 2);
    expect(cum).toEqual([-1, -2]);
  });
});
