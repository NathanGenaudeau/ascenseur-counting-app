import type { Database } from '../database.types';
import { getTypedSupabaseClient } from '../supabaseClient';

type TemplateRow = Database['public']['Tables']['game_config_templates']['Row'];
type TemplatePlayerRow = Database['public']['Tables']['game_config_template_players']['Row'];

export type GameConfigTemplateWithPlayers = {
  template: TemplateRow;
  seats: TemplatePlayerRow[];
};

export type TemplateSeatInput = {
  seatOrder: number;
  playerId?: string | null;
  displayNameSnapshot?: string | null;
};

type CreateTemplateInput = {
  name?: string | null;
  playerCount: number;
  seats: TemplateSeatInput[];
};

/** Crée un modèle et les lignes sièges associées. */
export async function createTemplateWithPlayers(input: CreateTemplateInput): Promise<GameConfigTemplateWithPlayers | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const { data: tpl, error: e1 } = await client
    .from('game_config_templates')
    .insert({
      name: input.name ?? null,
      player_count: input.playerCount,
      is_last_used: false,
    })
    .select()
    .single();
  if (e1 || !tpl) {
    if (__DEV__) {
      console.warn('[game_config_templates] insert', e1?.message ?? e1);
    }
    return null;
  }

  const seatRows: Database['public']['Tables']['game_config_template_players']['Insert'][] = input.seats.map((s) => ({
    template_id: tpl.id,
    /** Schéma : `seat_order > 0` ; les appels passent un index 0-based. */
    seat_order: s.seatOrder + 1,
    player_id: s.playerId ?? null,
    display_name_snapshot: s.displayNameSnapshot?.trim() ? s.displayNameSnapshot.trim() : null,
  }));
  const { data: seats, error: e2 } = await client.from('game_config_template_players').insert(seatRows).select();
  if (e2 || !seats) {
    if (__DEV__) {
      console.warn('[game_config_template_players] insert', e2?.message ?? e2);
    }
    return null;
  }

  return { template: tpl, seats };
}

/** Met à jour un modèle existant : métadonnées + remplace toutes les lignes sièges. */
async function replaceGameConfigTemplateContent(templateId: string, input: CreateTemplateInput): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;

  const { error: e1 } = await client
    .from('game_config_templates')
    .update({
      name: input.name ?? null,
      player_count: input.playerCount,
    })
    .eq('id', templateId);
  if (e1) {
    if (__DEV__) {
      console.warn('[game_config_templates] update', e1.message);
    }
    return false;
  }

  const { error: e2 } = await client.from('game_config_template_players').delete().eq('template_id', templateId);
  if (e2) {
    if (__DEV__) {
      console.warn('[game_config_template_players] delete', e2.message);
    }
    return false;
  }

  const seatRows: Database['public']['Tables']['game_config_template_players']['Insert'][] = input.seats.map((s) => ({
    template_id: templateId,
    seat_order: s.seatOrder + 1,
    player_id: s.playerId ?? null,
    display_name_snapshot: s.displayNameSnapshot?.trim() ? s.displayNameSnapshot.trim() : null,
  }));
  const { error: e3 } = await client.from('game_config_template_players').insert(seatRows);
  if (e3) {
    if (__DEV__) {
      console.warn('[game_config_template_players] insert (replace)', e3.message);
    }
    return false;
  }
  return true;
}

/**
 * Dernière configuration enregistrée : met à jour le modèle marqué `is_last_used` au lieu d’en créer un nouveau
 * à chaque partie (évite l’empilement de lignes identiques).
 */
export async function upsertLastUsedGameConfigTemplate(input: CreateTemplateInput): Promise<boolean> {
  const existing = await getLastUsedTemplateWithPlayers();
  if (existing) {
    const ok = await replaceGameConfigTemplateContent(existing.template.id, input);
    if (!ok) return false;
    return markTemplateLastUsed(existing.template.id);
  }
  const created = await createTemplateWithPlayers(input);
  if (!created) return false;
  return markTemplateLastUsed(created.template.id);
}

/** Liste les modèles (récent en premier). */
export async function listGameConfigTemplates(): Promise<TemplateRow[]> {
  const client = getTypedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('game_config_templates').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
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

/** Marque un modèle comme dernier utilisé (un seul à `true`). */
export async function markTemplateLastUsed(templateId: string): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;
  const { error: e1 } = await client
    .from('game_config_templates')
    .update({ is_last_used: false })
    .gte('player_count', 0);
  if (e1 && __DEV__) {
    console.warn('[game_config_templates] reset is_last_used', e1.message);
  }
  const { error: e2 } = await client.from('game_config_templates').update({ is_last_used: true }).eq('id', templateId);
  if (e2 && __DEV__) {
    console.warn('[game_config_templates] set is_last_used', e2.message);
  }
  return !e2;
}
