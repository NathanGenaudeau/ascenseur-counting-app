import { parseRoundResultDocument } from '../src/domain/roundResult';

describe('RoundResultDocument', () => {
  it('parse résultats avec scores et saisie', () => {
    const doc = parseRoundResultDocument({
      _id: 'x1',
      gameId: 'g1',
      roundIndex: 0,
      playerId: 'p1',
      capture: { annonce: 80 },
      roundScore: 12,
      cumulativeScoreAfter: 12,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(doc.capture?.annonce).toBe(80);
    expect(doc.roundScore).toBe(12);
  });

  it('rejette un roundScore non numérique', () => {
    const payload = {
      _id: 'x1',
      gameId: 'g1',
      roundIndex: 0,
      playerId: 'p1',
      roundScore: 'bad',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(() => parseRoundResultDocument(payload as unknown)).toThrow();
  });
});
