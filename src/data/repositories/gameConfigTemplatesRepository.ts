import type { Database } from '../database.types';
import { getTypedSupabaseClient } from '../supabaseClient';

type TemplateRow = Database['public']['Tables']['game_config_templates']['Row'];
type TemplatePlayerRow = Database['public']['Tables']['game_config_template_players']['Row'];

export type GameConfigTemplateWithPlayers = {
  template: TemplateRow;
  seats: TemplatePlayerRow[];
};

export type TemplateSeatInput = {
  playerId?: string | null;
  displayNameSnapshot?: string | null;
};

export type SaveTemplateInput = {
  name?: string | null;
  playerCount: number;
  /** Sièges dans l’ordre de jeu. */
  seats: TemplateSeatInput[];
};

/**
 * Remplace la configuration « dernière utilisée » (modèle + sièges) en une transaction
 * (RPC `save_last_game_config`) : un seul modèle reste marqué `is_last_used`.
 */
export async function saveLastUsedGameConfigTemplate(input: SaveTemplateInput): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;
  const { error } = await client.rpc('save_last_game_config', {
    p_name: input.name ?? null,
    p_player_count: input.playerCount,
    p_seats: input.seats.map((s) => ({
      player_id: s.playerId ?? null,
      display_name: s.displayNameSnapshot?.trim() || null,
    })),
  });
  if (error && __DEV__) {
    console.warn('[save_last_game_config]', error.message);
  }
  return !error;
}

/** Dernière configuration marquée `is_last_used`. */
export async function getLastUsedTemplateWithPlayers(): Promise<GameConfigTemplateWithPlayers | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const { data: tpl, error: e1 } = await client
    .from('game_config_templates')
    .select('*')
    .eq('is_last_used', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e1 || !tpl) return null;

  const { data: seats, error: e2 } = await client
    .from('game_config_template_players')
    .select('*')
    .eq('template_id', tpl.id)
    .order('seat_order', { ascending: true });
  if (e2 || !seats) return null;

  return { template: tpl, seats };
}
