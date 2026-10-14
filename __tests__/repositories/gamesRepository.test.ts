import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import {
  deleteGameById,
  startGameWithSeats,
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

  it('deleteGameById retourne false sans client', async () => {
    jest.mocked(getTypedSupabaseClient).mockReturnValue(null);
    await expect(deleteGameById('g1')).resolves.toBe(false);
  });

  it('deleteGameById supprime la ligne games par id', async () => {
    const eq = jest.fn(() => Promise.resolve({ error: null }));
    const del = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ delete: del }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const ok = await deleteGameById('g1');

    expect(ok).toBe(true);
    expect(from).toHaveBeenCalledWith('games');
    expect(eq).toHaveBeenCalledWith('id', 'g1');
  });

  it('startGameWithSeats appelle la RPC start_game et mappe les sièges', async () => {
    const rpc = jest.fn(() =>
      Promise.resolve({
        data: {
          game_id: 'g1',
          players: [
            { player_id: 'p1', game_player_id: 'gp1', display_name: 'Ann' },
            { player_id: 'p2', game_player_id: 'gp2', display_name: 'Bob' },
          ],
        },
        error: null,
      }),
    );
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ rpc } as unknown as SupabaseClient<Database>);

    const started = await startGameWithSeats([
      { playerId: 'p1', displayName: 'Ann' },
      { displayName: '  Bob ' },
    ]);

    expect(rpc).toHaveBeenCalledWith('start_game', {
      p_seats: [
        { player_id: 'p1', display_name: 'Ann' },
        { player_id: null, display_name: 'Bob' },
      ],
    });
    expect(started).toEqual({
      gameId: 'g1',
      players: [
        { playerId: 'p1', gamePlayerId: 'gp1', displayName: 'Ann' },
        { playerId: 'p2', gamePlayerId: 'gp2', displayName: 'Bob' },
      ],
    });
  });

  it('startGameWithSeats retourne null si la réponse ne couvre pas tous les sièges', async () => {
    const rpc = jest.fn(() =>
      Promise.resolve({
        data: { game_id: 'g1', players: [{ player_id: 'p1', game_player_id: 'gp1', display_name: 'Ann' }] },
        error: null,
      }),
    );
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ rpc } as unknown as SupabaseClient<Database>);

    await expect(
      startGameWithSeats([{ displayName: 'Ann' }, { displayName: 'Bob' }]),
    ).resolves.toBeNull();
  });

  it('startGameWithSeats retourne null si la RPC échoue', async () => {
    const rpc = jest.fn(() => Promise.resolve({ data: null, error: { message: 'boom' } }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ rpc } as unknown as SupabaseClient<Database>);

    await expect(startGameWithSeats([{ displayName: 'Ann' }])).resolves.toBeNull();
  });
});
