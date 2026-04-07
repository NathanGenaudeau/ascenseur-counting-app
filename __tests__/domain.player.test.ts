import { parsePlayerDocument } from '../src/domain/player';

describe('PlayerDocument', () => {
  it('parse un document joueur valide', () => {
    const doc = parsePlayerDocument({
      _id: '507f1f77bcf86cd799439011',
      displayName: 'Alice ',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    expect(doc._id).toBe('507f1f77bcf86cd799439011');
    expect(doc.displayName).toBe('Alice');
  });

  it('rejette les entrées invalides', () => {
    expect(() => parsePlayerDocument(null)).toThrow();
    expect(() =>
      parsePlayerDocument({
        _id: '',
        displayName: 'A',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      }),
    ).toThrow();
  });
});
