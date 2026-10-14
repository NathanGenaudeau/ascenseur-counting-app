import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import {
  getLastUsedTemplateWithPlayers,
  saveLastUsedGameConfigTemplate,
} from '../../src/data/repositories/gameConfigTemplatesRepository';
import { getTypedSupabaseClient, resetSupabaseClientForTests } from '../../src/data/supabaseClient';

jest.mock('../../src/data/supabaseClient', () => ({
  getTypedSupabaseClient: jest.fn(),
  resetSupabaseClientForTests: jest.requireActual('../../src/data/supabaseClient').resetSupabaseClientForTests,
}));

describe('gameConfigTemplatesRepository (ASC-52)', () => {
  afterEach(() => {
    resetSupabaseClientForTests();
    jest.mocked(getTypedSupabaseClient).mockReset();
  });

  it('getLastUsedTemplateWithPlayers charge template + sièges', async () => {
    const tpl = {
      id: 't1',
      name: null,
      player_count: 3,
      is_last_used: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-05T00:00:00.000Z',
    };
    const maybeSingle = jest.fn(() => Promise.resolve({ data: tpl, error: null }));
    const limit = jest.fn(() => ({ maybeSingle }));
    const order = jest.fn(() => ({ limit }));
    const eq = jest.fn(() => ({ order }));
    const selectTpl = jest.fn(() => ({ eq }));
    const fromTpl = jest.fn((table: string) => {
      if (table === 'game_config_templates') {
        return { select: selectTpl };
      }
      const orderSeats = jest.fn(() => Promise.resolve({ data: [], error: null }));
      const eqSeats = jest.fn(() => ({ order: orderSeats }));
      const selectSeats = jest.fn(() => ({ eq: eqSeats }));
      return { select: selectSeats };
    });
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from: fromTpl } as unknown as SupabaseClient<Database>);

    const out = await getLastUsedTemplateWithPlayers();
    expect(out?.template.id).toBe('t1');
  });

  it('saveLastUsedGameConfigTemplate appelle la RPC save_last_game_config', async () => {
    const rpc = jest.fn(() => Promise.resolve({ data: 't1', error: null }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ rpc } as unknown as SupabaseClient<Database>);

    const ok = await saveLastUsedGameConfigTemplate({
      name: 'Soirée',
      playerCount: 3,
      seats: [
        { playerId: 'p1', displayNameSnapshot: 'Ann' },
        { playerId: null, displayNameSnapshot: '  Bob  ' },
        { playerId: null, displayNameSnapshot: '   ' },
      ],
    });

    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith('save_last_game_config', {
      p_name: 'Soirée',
      p_player_count: 3,
      p_seats: [
        { player_id: 'p1', display_name: 'Ann' },
        { player_id: null, display_name: 'Bob' },
        { player_id: null, display_name: null },
      ],
    });
  });

  it('saveLastUsedGameConfigTemplate retourne false si la RPC échoue', async () => {
    const rpc = jest.fn(() => Promise.resolve({ data: null, error: { message: 'boom' } }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ rpc } as unknown as SupabaseClient<Database>);

    await expect(saveLastUsedGameConfigTemplate({ playerCount: 3, seats: [] })).resolves.toBe(false);
  });
});
