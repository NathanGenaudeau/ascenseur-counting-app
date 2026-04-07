import {
  getLastUsedTemplateWithPlayers,
  upsertLastUsedGameConfigTemplate,
} from '../data/repositories/gameConfigTemplatesRepository';
import { getTypedSupabaseClient } from '../data/supabaseClient';
import {
  ensureSlotsLength,
  type GameConfigurationDraft,
  type GameDraftSettings,
} from '../domain/gameConfigurationDraft';

export async function persistLastGameDraftSupabase(draft: GameConfigurationDraft): Promise<boolean> {
  if (!getTypedSupabaseClient()) return false;

  const seats = draft.slots.map((s, i) => ({
    seatOrder: i,
    playerId: s.playerId ?? null,
    displayNameSnapshot: s.displayName.trim() ? s.displayName.trim() : null,
  }));

  const nameFromNotes = draft.settings.notes ? draft.settings.notes.slice(0, 120) : null;

  return upsertLastUsedGameConfigTemplate({
    name: nameFromNotes,
    playerCount: draft.playerCount,
    seats,
  });
}

export async function loadLastGameDraftFromSupabase(): Promise<GameConfigurationDraft | null> {
  if (!getTypedSupabaseClient()) return null;

  const loaded = await getLastUsedTemplateWithPlayers();
  if (!loaded) return null;

  const t = loaded.template;
  const seats = [...loaded.seats].sort((a, b) => a.seat_order - b.seat_order);
  const slots = seats.map((row) => ({
    displayName: row.display_name_snapshot?.trim() ?? '',
    playerId: row.player_id ?? undefined,
  }));

  const padded = ensureSlotsLength(slots, t.player_count);

  const settings: GameDraftSettings = {
    extensions: {},
    notes: t.name ?? undefined,
  };

  return {
    playerCount: t.player_count,
    slots: padded,
    settings,
  };
}
