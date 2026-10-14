import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import {
  fetchPlayersList,
  getPlayerById,
} from '../../src/data/repositories/playersRepository';
import { getTypedSupabaseClient, resetSupabaseClientForTests } from '../../src/data/supabaseClient';

jest.mock('../../src/data/supabaseClient', () => ({
  getTypedSupabaseClient: jest.fn(),
  resetSupabaseClientForTests: jest.requireActual('../../src/data/supabaseClient').resetSupabaseClientForTests,
}));

describe('playersRepository (ASC-48)', () => {
  afterEach(() => {
    resetSupabaseClientForTests();
    jest.mocked(getTypedSupabaseClient).mockReset();
  });

  it('fetchPlayersList retourne [] sans client', async () => {
    jest.mocked(getTypedSupabaseClient).mockReturnValue(null);
    await expect(fetchPlayersList()).resolves.toEqual([]);
  });

  it('fetchPlayersList mappe les lignes Supabase', async () => {
    const row = {
      id: 'p1',
      display_name: 'Bob',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    };
    const order = jest.fn(() => Promise.resolve({ data: [row], error: null }));
    const select = jest.fn(() => ({ order }));
    const from = jest.fn(() => ({ select }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const list = await fetchPlayersList();

    expect(from).toHaveBeenCalledWith('players');
    expect(list).toEqual([
      {
        _id: 'p1',
        displayName: 'Bob',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    ]);
  });

  it('getPlayerById retourne null si absent', async () => {
    const maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    await expect(getPlayerById('x')).resolves.toBeNull();
  });
});
