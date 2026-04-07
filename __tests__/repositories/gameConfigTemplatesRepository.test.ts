import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../src/data/database.types';
import {
  createTemplateWithPlayers,
  getLastUsedTemplateWithPlayers,
  listGameConfigTemplates,
  markTemplateLastUsed,
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

  it('createTemplateWithPlayers enchaîne insert template puis sièges', async () => {
    const tpl = {
      id: 't1',
      name: 'M1',
      player_count: 3,
      is_last_used: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    const seats = [
      {
        id: 's1',
        template_id: 't1',
        seat_order: 1,
        player_id: 'p1',
        display_name_snapshot: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    const single = jest.fn(() => Promise.resolve({ data: tpl, error: null }));
    const selectTpl = jest.fn(() => ({ single }));
    const insertTpl = jest.fn(() => ({ select: selectTpl }));
    const selectSeats = jest.fn(() => Promise.resolve({ data: seats, error: null }));
    const insertSeats = jest.fn(() => ({ select: selectSeats }));
    const from = jest.fn((table: string) => {
      if (table === 'game_config_templates') {
        return { insert: insertTpl };
      }
      return { insert: insertSeats };
    });
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const result = await createTemplateWithPlayers({
      name: 'M1',
      playerCount: 3,
      seats: [{ seatOrder: 0, playerId: 'p1' }],
    });

    expect(result?.template.id).toBe('t1');
    expect(result?.seats).toHaveLength(1);
  });

  it('markTemplateLastUsed met à jour is_last_used', async () => {
    const gte = jest.fn(() => Promise.resolve({ error: null }));
    const eq = jest.fn(() => Promise.resolve({ error: null }));
    const update = jest.fn((patch: { is_last_used?: boolean }) => {
      if (patch.is_last_used === false) {
        return { gte };
      }
      return { eq };
    });
    const from = jest.fn(() => ({ update }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const ok = await markTemplateLastUsed('t1');
    expect(ok).toBe(true);
    expect(update).toHaveBeenCalledWith({ is_last_used: false });
    expect(update).toHaveBeenCalledWith({ is_last_used: true });
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

  it('listGameConfigTemplates retourne les lignes', async () => {
    const rows = [
      {
        id: 't1',
        name: null,
        player_count: 3,
        is_last_used: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ];
    const order = jest.fn(() => Promise.resolve({ data: rows, error: null }));
    const select = jest.fn(() => ({ order }));
    const from = jest.fn(() => ({ select }));
    jest.mocked(getTypedSupabaseClient).mockReturnValue({ from } as unknown as SupabaseClient<Database>);

    const list = await listGameConfigTemplates();
    expect(list).toHaveLength(1);
  });
});
