import type { Database, Json } from '../database.types';
import { gameStatusForDb } from '../supabaseGameStatus';
import { getTypedSupabaseClient } from '../supabaseClient';
import type { GameStatus } from '../../domain/game';
import type { GameParticipationDocument } from '../../domain/participation';
import { sortParticipationsBySeat } from '../../domain/participation';

export type StartGameSeatInput = {
  /** Joueur existant ; sinon résolu côté serveur par nom (réutilisé ou créé). */
  playerId?: string;
  displayName: string;
};

export type StartedGameSeat = {
  playerId: string;
  gamePlayerId: string;
  displayName: string;
};

export type StartedGame = {
  gameId: string;
  /** Même ordre que les sièges envoyés. */
  players: StartedGameSeat[];
};

function parseStartedGame(raw: Json, expectedSeats: number): StartedGame | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const { game_id: gameId, players } = raw;
  if (typeof gameId !== 'string' || !Array.isArray(players) || players.length !== expectedSeats) {
    return null;
  }
  const seats: StartedGameSeat[] = [];
  for (const p of players) {
    if (typeof p !== 'object' || p === null || Array.isArray(p)) return null;
    const { player_id: playerId, game_player_id: gamePlayerId, display_name: displayName } = p;
    if (typeof playerId !== 'string' || typeof gamePlayerId !== 'string') return null;
    seats.push({ playerId, gamePlayerId, displayName: typeof displayName === 'string' ? displayName : '' });
  }
  return { gameId, players: seats };
}

/**
 * Crée en une transaction (RPC `start_game`) les joueurs manquants, la partie `running`
 * et ses sièges `game_players`.
 */
export async function startGameWithSeats(seats: StartGameSeatInput[]): Promise<StartedGame | null> {
  const client = getTypedSupabaseClient();
  if (!client || seats.length === 0) return null;
  const { data, error } = await client.rpc('start_game', {
    p_seats: seats.map((s) => ({ player_id: s.playerId ?? null, display_name: s.displayName.trim() })),
  });
  if (error || data === null) {
    if (__DEV__) {
      console.warn('[start_game]', error?.message ?? 'no data');
    }
    return null;
  }
  return parseStartedGame(data, seats.length);
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

/** Supprime une partie et, via CASCADE côté Postgres, manches, résultats et liaisons joueurs. */
export async function deleteGameById(gameId: string): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('games').delete().eq('id', gameId);
  if (error && __DEV__) {
    console.warn('[games] delete', error.message);
  }
  return !error;
}
