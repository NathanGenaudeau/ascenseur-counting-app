import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import {
  addPlayersToGame,
  createGame,
  getGameById,
  getGameParticipants,
} from '../../src/data/repositories/gamesRepository';
import { getTypedSupabaseClient, resetSupabaseClientForTests } from '../../src/data/supabaseClient';

jest.mock('../../src/data/supabaseClient', () => ({
  getTypedSupabaseClient: jest.fn(),
  resetSupabaseClientForTests: jest.requireActual('../../src/data/supabaseClient').resetSupabaseClientForTests,
}));

describe('gamesRepository (ASC-49)', () => {
  afterEach(() => {
    resetSupabaseClientForTests();
    jest.mocked(getTypedSupabaseClient).mockReset();
  });

  it('createGame retourne null sans client', async () => {
    jest.mocked(getTypedSupabaseClient).mockReturnValue(null);
    await expect(createGame('draft', 4)).resolves.toBeNull();
  });

  it('createGame mappe une ligne games (player_count obligatoire)', async () => {
    const row = {
      id: 'g1',
      status: 'in_progress',
      player_count: 4,
      started_at: '2026-01-01T00:00:00.000Z',
      finished_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const single = jest.fn(() => Promise.resolve({ data: row, error: null }));
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const game = await createGame('running', 4);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'in_progress',
        player_count: 4,
        started_at: expect.any(String),
      }),
    );
    expect(game?._id).toBe('g1');
    expect(game?.status).toBe('running');
    expect(game?.settings).toBeUndefined();
  });

  it('addPlayersToGame insère une ligne par joueur avec snapshot', async () => {
    const insert = jest.fn(() => Promise.resolve({ error: null }));
    const from = jest.fn(() => ({ insert }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const ok = await addPlayersToGame('g1', [
      { playerId: 'a', displayNameSnapshot: 'A' },
      { playerId: 'b', displayNameSnapshot: 'B' },
    ]);

    expect(ok).toBe(true);
    expect(insert).toHaveBeenCalledWith([
      { game_id: 'g1', player_id: 'a', seat_order: 1, display_name_snapshot: 'A' },
      { game_id: 'g1', player_id: 'b', seat_order: 2, display_name_snapshot: 'B' },
    ]);
  });

  it('getGameParticipants trie par siège', async () => {
    const order = jest.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 'gp1',
            game_id: 'g1',
            player_id: 'p1',
            seat_order: 1,
            display_name_snapshot: null,
            created_at: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'gp2',
            game_id: 'g1',
            player_id: 'p2',
            seat_order: 2,
            display_name_snapshot: null,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        error: null,
      }),
    );
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const parts = await getGameParticipants('g1');

    expect(parts.map((p) => p.playerId)).toEqual(['p1', 'p2']);
  });

  it('getGameById retourne le document', async () => {
    const row = {
      id: 'g1',
      status: 'finished',
      player_count: 4,
      started_at: null,
      finished_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const maybeSingle = jest.fn(() => Promise.resolve({ data: row, error: null }));
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const g = await getGameById('g1');
    expect(g?.status).toBe('finished');
  });
});
