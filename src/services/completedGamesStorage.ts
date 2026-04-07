import { loadFinishedGameRecordsFromSupabase } from '../data/repositories/finishedGamesLoader';
import type { FinishedGameRecord } from '../domain/finishedGameRecord';

/**
 * Historique des parties terminées — lu depuis Supabase uniquement.
 */
export async function loadCompletedGames(): Promise<FinishedGameRecord[]> {
  return loadFinishedGameRecordsFromSupabase();
}
