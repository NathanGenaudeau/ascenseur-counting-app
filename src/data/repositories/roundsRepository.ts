import type { Database } from '../database.types';
import { getTypedSupabaseClient } from '../supabaseClient';
import { computeRoundScoreFromBid } from '../../domain/scoring';
import type { RoundDocument, RoundStatus } from '../../domain/round';

type RoundRow = Database['public']['Tables']['rounds']['Row'];
type RoundResultRow = Database['public']['Tables']['round_results']['Row'];

function roundRowToDomain(row: RoundRow): RoundDocument {
  return {
    _id: row.id,
    gameId: row.game_id,
    roundIndex: row.round_number,
    status: 'completed' as RoundStatus,
    startedAt: undefined,
    endedAt: undefined,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

/** Crée une manche (`round_number` 1-based, aligné sur l’index de manche du domaine). */
export async function createRound(gameId: string, roundNumber: number): Promise<RoundDocument | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const payload: Database['public']['Tables']['rounds']['Insert'] = {
    game_id: gameId,
    round_number: roundNumber,
  };
  const { data, error } = await client.from('rounds').insert(payload).select().single();
  if (error || !data) {
    if (__DEV__) {
      console.warn('[rounds] insert', error?.message ?? error);
    }
    return null;
  }
  return roundRowToDomain(data);
}

export type RoundResultInput = {
  gamePlayerId: string;
  bid: number;
  tricksWon: number;
};

/**
 * Insère ou met à jour les résultats (clé `round_id` + `game_player_id`).
 * Le score est calculé uniquement via `computeRoundScoreFromBid` (ASC-51).
 */
export async function upsertRoundResults(roundId: string, results: RoundResultInput[]): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;
  if (results.length === 0) return true;
  const rows = results.map((r) => ({
    round_id: roundId,
    game_player_id: r.gamePlayerId,
    bid: r.bid,
    tricks_won: r.tricksWon,
    score: computeRoundScoreFromBid(r.bid, r.tricksWon),
  }));
  const { error } = await client.from('round_results').upsert(rows, {
    onConflict: 'round_id,game_player_id',
  });
  if (error && __DEV__) {
    console.warn('[round_results] upsert', error.message);
  }
  return !error;
}

/** Résultats persistés pour une manche. */
export async function getRoundResults(roundId: string): Promise<RoundResultRow[]> {
  const client = getTypedSupabaseClient();
  if (!client) return [];
  const { data, error } = await client.from('round_results').select('*').eq('round_id', roundId);
  if (error || !data) return [];
  return data;
}

/** Manche par identifiant. */
export async function getRoundById(roundId: string): Promise<RoundDocument | null> {
  const client = getTypedSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('rounds').select('*').eq('id', roundId).maybeSingle();
  if (error || !data) return null;
  return roundRowToDomain(data);
}
