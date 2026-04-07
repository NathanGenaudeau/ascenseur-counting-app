import { parseGameDocument } from '../src/domain/game';

describe('GameDocument', () => {
  it('parse une partie avec métadonnées', () => {
    const doc = parseGameDocument({
      _id: 'g1',
      status: 'running',
      startedAt: '2026-01-01T12:00:00.000Z',
      settings: { foo: 1 },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(doc.status).toBe('running');
    expect(doc.settings?.foo).toBe(1);
  });

  it('rejette un status inconnu', () => {
    expect(() =>
      parseGameDocument({
        _id: 'g1',
        status: 'unknown',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
