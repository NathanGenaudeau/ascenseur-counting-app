import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import {
  createRound,
  getRoundResults,
  upsertRoundResults,
} from '../../src/data/repositories/roundsRepository';
import { getTypedSupabaseClient, resetSupabaseClientForTests } from '../../src/data/supabaseClient';

jest.mock('../../src/data/supabaseClient', () => ({
  getTypedSupabaseClient: jest.fn(),
  resetSupabaseClientForTests: jest.requireActual('../../src/data/supabaseClient').resetSupabaseClientForTests,
}));

describe('roundsRepository (ASC-50 / ASC-51)', () => {
  afterEach(() => {
    resetSupabaseClientForTests();
    jest.mocked(getTypedSupabaseClient).mockReset();
  });

  it('createRound mappe rounds (round_number)', async () => {
    const row = {
      id: 'r1',
      game_id: 'g1',
      round_number: 1,
      created_at: '2026-01-01T00:00:00.000Z',
    };
    const single = jest.fn(() => Promise.resolve({ data: row, error: null }));
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const from = jest.fn(() => ({ insert }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const round = await createRound('g1', 1);

    expect(insert).toHaveBeenCalledWith({ game_id: 'g1', round_number: 1 });
    expect(round?._id).toBe('r1');
    expect(round?.roundIndex).toBe(1);
  });

  it('upsertRoundResults envoie le score issu de computeRoundScoreFromBid', async () => {
    const upsert = jest.fn(() => Promise.resolve({ error: null }));
    const from = jest.fn(() => ({ upsert }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const ok = await upsertRoundResults('r1', [{ gamePlayerId: 'gp1', bid: 3, tricksWon: 2 }]);

    expect(ok).toBe(true);
    expect(upsert).toHaveBeenCalledWith(
      [
        {
          round_id: 'r1',
          game_player_id: 'gp1',
          bid: 3,
          tricks_won: 2,
          score: -1,
        },
      ],
      { onConflict: 'round_id,game_player_id' },
    );
  });

  it('upsertRoundResults score 3/3 = 3', async () => {
    const upsert = jest.fn(() => Promise.resolve({ error: null }));
    const from = jest.fn(() => ({ upsert }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    await upsertRoundResults('r1', [{ gamePlayerId: 'gp1', bid: 3, tricksWon: 3 }]);

    expect(upsert.mock.calls[0][0][0].score).toBe(3);
  });

  it('getRoundResults retourne les lignes', async () => {
    const rows = [
      {
        id: 'x',
        round_id: 'r1',
        game_player_id: 'gp1',
        bid: 1,
        tricks_won: 1,
        score: 1,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    const eq = jest.fn(() => Promise.resolve({ data: rows, error: null }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const out = await getRoundResults('r1');
    expect(out).toHaveLength(1);
    expect(out[0].bid).toBe(1);
  });
});
