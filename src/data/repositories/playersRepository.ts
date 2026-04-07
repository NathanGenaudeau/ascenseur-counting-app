import type { Database } from '../database.types';
import { getTypedSupabaseClient } from '../supabaseClient';
import type { PlayerDocument } from '../../domain/player';

type PlayerRow = Database['public']['Tables']['players']['Row'];

function rowToPlayer(row: PlayerRow): PlayerDocument {
  return {
    _id: row.id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Liste les joueurs du référentiel (ordre alphabétique sur le nom affiché). */
export async function fetchPlayersList(): Promise<PlayerDocument[]> {
  const client = getTypedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('players').select('*').order('display_name');
  if (error || !data) return [];
  return data.map(rowToPlayer);
}

/** Crée un joueur. */
export async function createPlayer(displayName: string): Promise<PlayerDocument | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const trimmed = displayName.trim();
  if (!trimmed) return null;
  const { data, error } = await client.from('players').insert({ display_name: trimmed }).select().single();
  if (error || !data) return null;
  return rowToPlayer(data);
}

/** Lit un joueur par identifiant. */
export async function getPlayerById(id: string): Promise<PlayerDocument | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('players').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return rowToPlayer(data);
}

/** Met à jour le nom affiché. */
export async function updatePlayerDisplayName(id: string, displayName: string): Promise<PlayerDocument | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const trimmed = displayName.trim();
  if (!trimmed) return null;
  const { data, error } = await client
    .from('players')
    .update({ display_name: trimmed })
    .eq('id', id)
    .select()
    .single();
  if (error || !data) return null;
  return rowToPlayer(data);
}
