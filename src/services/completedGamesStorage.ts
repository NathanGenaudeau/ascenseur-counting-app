import { deleteGameById } from '../data/repositories/gamesRepository';
import { loadFinishedGameRecordsFromSupabase } from '../data/repositories/finishedGamesLoader';
import type { FinishedGameRecord } from '../domain/finishedGameRecord';

/**
 * Historique des parties terminées — lu depuis Supabase uniquement.
 */
export async function loadCompletedGames(): Promise<FinishedGameRecord[]> {
  return loadFinishedGameRecordsFromSupabase();
}

/** Supprime une partie terminée et toutes les données associées en base (manches, scores, participants de la partie). */
export async function deleteCompletedGame(gameId: string): Promise<boolean> {
  return deleteGameById(gameId);
}
