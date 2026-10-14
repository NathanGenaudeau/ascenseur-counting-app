import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import { loadFinishedGameRecordsFromSupabase } from '../../src/data/repositories/finishedGamesLoader';
import { getTypedSupabaseClient, resetSupabaseClientForTests } from '../../src/data/supabaseClient';

jest.mock('../../src/data/supabaseClient', () => ({
  getTypedSupabaseClient: jest.fn(),
  resetSupabaseClientForTests: jest.requireActual('../../src/data/supabaseClient').resetSupabaseClientForTests,
}));

function mockClientResolving(result: { data: unknown; error: { message: string } | null }) {
  const order = jest.fn(() => Promise.resolve(result));
  const not = jest.fn(() => ({ order }));
  const eq = jest.fn(() => ({ not }));
  const select = jest.fn(() => ({ eq }));
  const from = jest.fn(() => ({ select }));
  jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);
  return { from, select, eq, not, order };
}

describe('finishedGamesLoader', () => {
  afterEach(() => {
    resetSupabaseClientForTests();
    jest.mocked(getTypedSupabaseClient).mockReset();
  });

  it('retourne [] sans client', async () => {
    jest.mocked(getTypedSupabaseClient).mockReturnValue(null);
    await expect(loadFinishedGameRecordsFromSupabase()).resolves.toEqual([]);
  });

  it('retourne [] en cas d’erreur Supabase', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockClientResolving({ data: null, error: { message: 'boom' } });
    await expect(loadFinishedGameRecordsFromSupabase()).resolves.toEqual([]);
    warn.mockRestore();
  });

  it('charge tout en une seule requête avec ressources imbriquées', async () => {
    const { from, select, eq, not, order } = mockClientResolving({ data: [], error: null });

    await loadFinishedGameRecordsFromSupabase();

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith('games');
    expect(select).toHaveBeenCalledTimes(1);
    const selectArg = (select.mock.calls[0] as unknown[])[0] as string;
    expect(selectArg).toContain('game_players');
    expect(selectArg).toContain('players ( display_name )');
    expect(selectArg).toContain('round_results');
    expect(eq).toHaveBeenCalledWith('status', 'finished');
    expect(not).toHaveBeenCalledWith('finished_at', 'is', null);
    expect(order).toHaveBeenCalledWith('finished_at', { ascending: false });
  });

  it('trie sièges et manches, aligne les résultats sur l’ordre des sièges', async () => {
    mockClientResolving({
      error: null,
      data: [
        {
          id: 'g1',
          finished_at: '2026-01-02T10:00:00.000Z',
          game_players: [
            { id: 'gp-b', seat_order: 2, players: { display_name: 'Bob' } },
            { id: 'gp-a', seat_order: 1, players: { display_name: 'Alice' } },
            { id: 'gp-c', seat_order: 3, players: null },
          ],
          rounds: [
            {
              round_number: 2,
              round_results: [
                { game_player_id: 'gp-a', bid: 0, tricks_won: 1, score: -1 },
                { game_player_id: 'gp-b', bid: 1, tricks_won: 1, score: 11 },
              ],
            },
            {
              round_number: 1,
              round_results: [
                { game_player_id: 'gp-b', bid: 0, tricks_won: 0, score: 10 },
                { game_player_id: 'gp-a', bid: 1, tricks_won: 1, score: 11 },
                { game_player_id: 'gp-c', bid: 1, tricks_won: 0, score: -1 },
              ],
            },
          ],
        },
      ],
    });

    const records = await loadFinishedGameRecordsFromSupabase();

    expect(records).toEqual([
      {
        id: 'g1',
        version: 1,
        endedAt: '2026-01-02T10:00:00.000Z',
        playerNames: ['Alice', 'Bob', ''],
        settings: { extensions: {} },
        roundsCompleted: [
          { roundIndex: 1, announcements: [1, 0, 1], tricks: [1, 0, 0], scores: [11, 10, -1] },
          { roundIndex: 2, announcements: [0, 1, 0], tricks: [1, 1, 0], scores: [-1, 11, 0] },
        ],
      },
    ]);
  });
});
