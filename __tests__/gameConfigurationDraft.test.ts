import {
  createDefaultDraft,
  PLAYER_COUNT_MAX,
  PLAYER_COUNT_MIN,
  parseGameConfigurationDraft,
  serializeGameConfigurationDraft,
  validateGameConfigurationDraft,
} from '../src/domain/gameConfigurationDraft';

describe('validateGameConfigurationDraft', () => {
  it('accepte une configuration minimale valide', () => {
    const draft = createDefaultDraft(3);
    draft.slots[0] = { displayName: 'A' };
    draft.slots[1] = { displayName: 'B' };
    draft.slots[2] = { displayName: 'C' };
    const r = validateGameConfigurationDraft(draft);
    expect(r.valid).toBe(true);
  });

  it('refuse un nombre de joueurs hors plage', () => {
    const draft = createDefaultDraft(4);
    draft.playerCount = 2;
    const r = validateGameConfigurationDraft(draft);
    expect(r.valid).toBe(false);
    expect(r.playerCountError).toBeDefined();
  });

  it('refuse un nom vide', () => {
    const draft = createDefaultDraft(3);
    draft.slots[0] = { displayName: 'A' };
    draft.slots[1] = { displayName: '' };
    draft.slots[2] = { displayName: 'C' };
    const r = validateGameConfigurationDraft(draft);
    expect(r.valid).toBe(false);
    expect(r.slotErrors[1]).toBe('Nom requis');
  });

  it('refuse deux noms identiques (casse / espaces)', () => {
    const draft = createDefaultDraft(3);
    draft.slots[0] = { displayName: ' same ' };
    draft.slots[1] = { displayName: 'Same' };
    draft.slots[2] = { displayName: 'Other' };
    const r = validateGameConfigurationDraft(draft);
    expect(r.valid).toBe(false);
    expect(r.duplicateNamesError).toBeDefined();
  });
});

describe('sérialisation configuration', () => {
  it('round-trip JSON', () => {
    const draft = createDefaultDraft(PLAYER_COUNT_MIN);
    draft.slots[0] = { displayName: 'A', playerId: 'id1' };
    draft.slots[1] = { displayName: 'B' };
    draft.slots[2] = { displayName: 'C' };
    draft.settings.notes = 'hello';
    const json = serializeGameConfigurationDraft(draft);
    const back = parseGameConfigurationDraft(json);
    expect(back?.playerCount).toBe(PLAYER_COUNT_MIN);
    expect(back?.slots[0].playerId).toBe('id1');
    expect(back?.settings.notes).toBe('hello');
  });

  it('respecte les bornes min/max pour createDefaultDraft', () => {
    expect(createDefaultDraft(2).playerCount).toBe(PLAYER_COUNT_MIN);
    expect(createDefaultDraft(99).playerCount).toBe(PLAYER_COUNT_MAX);
  });
});
