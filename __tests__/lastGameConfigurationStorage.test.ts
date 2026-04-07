import { createDefaultDraft } from '../src/domain/gameConfigurationDraft';
import {
  loadLastGameConfiguration,
  persistLastGameConfiguration,
} from '../src/services/lastGameConfigurationStorage';
import {
  loadLastGameDraftFromSupabase,
  persistLastGameDraftSupabase,
} from '../src/services/lastGameConfigurationSupabase';

describe('lastGameConfiguration (Supabase)', () => {
  beforeEach(() => {
    jest.mocked(persistLastGameDraftSupabase).mockClear();
    jest.mocked(loadLastGameDraftFromSupabase).mockResolvedValue(null);
  });

  it('persiste via le module Supabase', async () => {
    const draft = createDefaultDraft(3);
    draft.slots[0] = { displayName: 'X' };
    draft.slots[1] = { displayName: 'Y' };
    draft.slots[2] = { displayName: 'Z' };

    await persistLastGameConfiguration(draft);

    expect(persistLastGameDraftSupabase).toHaveBeenCalledWith(draft);
  });

  it('charge via le module Supabase', async () => {
    const draft = createDefaultDraft(3);
    jest.mocked(loadLastGameDraftFromSupabase).mockResolvedValueOnce(draft);

    const loaded = await loadLastGameConfiguration();

    expect(loaded).toEqual(draft);
  });
});
