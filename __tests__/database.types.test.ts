import type { Tables } from '../src/data/database.types';

/**
 * ASC-46 — les types Row restent alignés sur le schéma (vérif compilation).
 */
describe('database.types', () => {
  it('Tables<players> a les champs snake_case attendus', () => {
    const row: Tables<'players'> = {
      id: '00000000-0000-0000-0000-000000000001',
      display_name: 'Test',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    expect(row.display_name).toBe('Test');
  });
});
