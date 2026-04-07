import {
  parseGameParticipationDocument,
  sortParticipationsBySeat,
} from '../src/domain/participation';

describe('GameParticipationDocument', () => {
  it('parse une participation et trie par seatOrder', () => {
    const a = parseGameParticipationDocument({
      _id: 'p1',
      gameId: 'g1',
      playerId: 'a1',
      seatOrder: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(a.playerId).toBe('a1');

    const b = parseGameParticipationDocument({
      _id: 'p2',
      gameId: 'g1',
      playerId: 'a2',
      seatOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const sorted = sortParticipationsBySeat([a, b]);
    expect(sorted.map((s) => s.playerId)).toEqual(['a2', 'a1']);
  });

  it('rejette seatOrder invalide', () => {
    expect(() =>
      parseGameParticipationDocument({
        _id: 'p1',
        gameId: 'g1',
        playerId: 'a1',
        seatOrder: 1.5,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
