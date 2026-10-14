import { getTypedSupabaseClient } from '../supabaseClient';
import { computeRoundScore } from '../../domain/scoring';

export type RoundResultInput = {
  gamePlayerId: string;
  bid: number;
  tricksWon: number;
};

/**
 * Enregistre une manche et ses résultats en une transaction (RPC `save_round`).
 * Idempotent : rejouer le même appel met à jour les lignes existantes, d’où un retry sans risque.
 * Le score est calculé uniquement via `computeRoundScore` (ASC-51).
 */
export async function saveRoundWithResults(
  gameId: string,
  roundNumber: number,
  results: RoundResultInput[],
): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;
  const { error } = await client.rpc('save_round', {
    p_game_id: gameId,
    p_round_number: roundNumber,
    p_results: results.map((r) => ({
      game_player_id: r.gamePlayerId,
      bid: r.bid,
      tricks_won: r.tricksWon,
      score: computeRoundScore(r.bid, r.tricksWon),
    })),
  });
  if (error && __DEV__) {
    console.warn('[save_round]', error.message);
  }
  return !error;
}
