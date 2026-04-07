import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import {
  createPlayer,
  fetchPlayersList,
  getPlayerById,
  updatePlayerDisplayName,
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

  it('createPlayer insère et retourne le domaine', async () => {
    const row = {
      id: 'n1',
      display_name: 'Ann',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const single = jest.fn(() => Promise.resolve({ data: row, error: null }));
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const doc = await createPlayer('  Ann  ');

    expect(insert).toHaveBeenCalledWith({ display_name: 'Ann' });
    expect(doc).toEqual({
      _id: 'n1',
      displayName: 'Ann',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  it('getPlayerById retourne null si absent', async () => {
    const maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    await expect(getPlayerById('x')).resolves.toBeNull();
  });

  it('updatePlayerDisplayName met à jour', async () => {
    const row = {
      id: 'p1',
      display_name: 'New',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-03T00:00:00.000Z',
    };
    const single = jest.fn(() => Promise.resolve({ data: row, error: null }));
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ update }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const doc = await updatePlayerDisplayName('p1', 'New');

    expect(update).toHaveBeenCalledWith({ display_name: 'New' });
    expect(doc?._id).toBe('p1');
    expect(doc?.displayName).toBe('New');
  });
});
