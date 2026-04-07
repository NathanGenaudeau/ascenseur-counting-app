import { parseRoundDocument, sortRoundsByIndex } from '../src/domain/round';

describe('RoundDocument', () => {
  it('parse une manche et tri par roundIndex', () => {
    const r0 = parseRoundDocument({
      _id: 'r0',
      gameId: 'g1',
      roundIndex: 0,
      status: 'completed',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(r0.roundIndex).toBe(0);

    const r1 = parseRoundDocument({
      _id: 'r1',
      gameId: 'g1',
      roundIndex: 1,
      status: 'pending',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const sorted = sortRoundsByIndex([r1, r0]);
    expect(sorted.map((r) => r.roundIndex)).toEqual([0, 1]);
  });

  it('rejette un roundIndex négatif', () => {
    expect(() =>
      parseRoundDocument({
        _id: 'r0',
        gameId: 'g1',
        roundIndex: -1,
        status: 'pending',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
