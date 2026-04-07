import type { Database } from '../database.types';
import { gameStatusForDb, gameStatusFromDb } from '../supabaseGameStatus';
import { getTypedSupabaseClient } from '../supabaseClient';
import type { GameDocument, GameStatus } from '../../domain/game';
import type { GameParticipationDocument } from '../../domain/participation';
import { sortParticipationsBySeat } from '../../domain/participation';

type GameRow = Database['public']['Tables']['games']['Row'];

function gameRowToDomain(row: GameRow): GameDocument {
  return {
    _id: row.id,
    status: gameStatusFromDb(row.status),
    startedAt: row.started_at ?? undefined,
    endedAt: row.finished_at ?? undefined,
    settings: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Crée une partie. `player_count` est obligatoire côté schéma Supabase. */
export async function createGame(status: GameStatus, playerCount: number): Promise<GameDocument | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const payload: Database['public']['Tables']['games']['Insert'] = {
    status: gameStatusForDb(status),
    player_count: playerCount,
    started_at: status === 'running' ? new Date().toISOString() : null,
  };
  const { data, error } = await client.from('games').insert(payload).select().single();
  if (error || !data) {
    if (__DEV__) {
      console.warn('[games] insert', error?.message ?? error);
    }
    return null;
  }
  return gameRowToDomain(data);
}

export type GamePlayerSeatInput = {
  playerId: string;
  displayNameSnapshot: string;
};

/** Associe les joueurs à une partie (ordre = ordre du tableau). */
export async function addPlayersToGame(gameId: string, seats: GamePlayerSeatInput[]): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;
  if (seats.length === 0) return true;
  const rows: Database['public']['Tables']['game_players']['Insert'][] = seats.map((s, index) => ({
    game_id: gameId,
    player_id: s.playerId,
    /** Schéma Supabase : `seat_order > 0` ; le domaine utilise 0 = premier siège. */
    seat_order: index + 1,
    display_name_snapshot: s.displayNameSnapshot.trim() || null,
  }));
  const { error } = await client.from('game_players').insert(rows);
  if (error && __DEV__) {
    console.warn('[game_players] insert', error.message);
  }
  return !error;
}

/** Participants d’une partie, triés par siège. */
export async function getGameParticipants(gameId: string): Promise<GameParticipationDocument[]> {
  const client = getTypedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from('game_players')
    .select('*')
    .eq('game_id', gameId)
    .order('seat_order', { ascending: true });
  if (error || !data) return [];
  const docs: GameParticipationDocument[] = data.map((row) => ({
    _id: row.id,
    gameId: row.game_id,
    playerId: row.player_id,
    seatOrder: row.seat_order - 1,
    createdAt: row.created_at,
  }));
  return sortParticipationsBySeat(docs);
}

/** Lit une partie par id. */
export async function getGameById(gameId: string): Promise<GameDocument | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('games').select('*').eq('id', gameId).maybeSingle();
  if (error || !data) return null;
  return gameRowToDomain(data);
}

/** Met à jour statut / dates. */
export async function updateGame(
  gameId: string,
  patch: {
    status?: GameStatus;
    started_at?: string | null;
    finished_at?: string | null;
  },
): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;
  const row: Database['public']['Tables']['games']['Update'] = {};
  if (patch.status !== undefined) row.status = gameStatusForDb(patch.status);
  if (patch.started_at !== undefined) row.started_at = patch.started_at;
  if (patch.finished_at !== undefined) row.finished_at = patch.finished_at;
  const { error } = await client.from('games').update(row).eq('id', gameId);
  if (error && __DEV__) {
    console.warn('[games] update', error.message);
  }
  return !error;
}
