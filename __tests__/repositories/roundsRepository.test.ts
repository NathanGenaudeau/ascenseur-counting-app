import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import { saveRoundWithResults } from '../../src/data/repositories/roundsRepository';
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

  it('saveRoundWithResults retourne false sans client', async () => {
    jest.mocked(getTypedSupabaseClient).mockReturnValue(null);
    await expect(saveRoundWithResults('g1', 1, [])).resolves.toBe(false);
  });

  it('saveRoundWithResults appelle la RPC save_round avec le score de computeRoundScore', async () => {
    const rpc = jest.fn(() => Promise.resolve({ data: 'r1', error: null }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ rpc } as unknown as SupabaseClient<Database>);

    const ok = await saveRoundWithResults('g1', 3, [
      { gamePlayerId: 'gp1', bid: 3, tricksWon: 2 },
      { gamePlayerId: 'gp2', bid: 1, tricksWon: 1 },
    ]);

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith('save_round', {
      p_game_id: 'g1',
      p_round_number: 3,
      p_results: [
        { game_player_id: 'gp1', bid: 3, tricks_won: 2, score: -1 },
        { game_player_id: 'gp2', bid: 1, tricks_won: 1, score: 1 },
      ],
    });
  });

  it('saveRoundWithResults retourne false si la RPC échoue', async () => {
    const rpc = jest.fn(() => Promise.resolve({ data: null, error: { message: 'offline' } }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ rpc } as unknown as SupabaseClient<Database>);

    await expect(
      saveRoundWithResults('g1', 1, [{ gamePlayerId: 'gp1', bid: 0, tricksWon: 0 }]),
    ).resolves.toBe(false);
  });
});
