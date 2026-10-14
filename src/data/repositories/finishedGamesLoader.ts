import { FINISHED_GAME_RECORD_VERSION, type FinishedGameRecord } from '../../domain/finishedGameRecord';
import type { CompletedRound } from '../../domain/gamePlayState';
import type { GameDraftSettings } from '../../domain/gameConfigurationDraft';
import { gameStatusForDb } from '../supabaseGameStatus';
import { getTypedSupabaseClient } from '../supabaseClient';

/**
 * Partie + participants + manches + résultats, chargés en une seule requête PostgREST
 * (ressources imbriquées via les clés étrangères) pour éviter le N+1.
 */
const FINISHED_GAMES_SELECT = `
  id,
  finished_at,
  game_players ( id, seat_order, players ( display_name ) ),
  rounds ( round_number, round_results ( game_player_id, bid, tricks_won, score ) )
`;

/**
 * Reconstruit l’historique des parties terminées depuis Supabase.
 */
export async function loadFinishedGameRecordsFromSupabase(): Promise<FinishedGameRecord[]> {
  const client = getTypedSupabaseClient();
  if (!client) return [];

  const { data: games, error } = await client
    .from('games')
    .select(FINISHED_GAMES_SELECT)
    .eq('status', gameStatusForDb('finished'))
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false });

  if (error || !games) {
    if (error && __DEV__) {
      console.warn('[games] load finished', error.message);
    }
    return [];
  }

  return games.map((g) => {
    const gpOrder = [...(g.game_players ?? [])].sort((a, b) => a.seat_order - b.seat_order);
    const playerNames = gpOrder.map((gp) => gp.players?.display_name ?? '');

    const roundsCompleted: CompletedRound[] = [...(g.rounds ?? [])]
      .sort((a, b) => a.round_number - b.round_number)
      .map((r) => {
        const byGamePlayer = new Map((r.round_results ?? []).map((row) => [row.game_player_id, row]));
        return {
          roundIndex: r.round_number,
          announcements: gpOrder.map((gp) => byGamePlayer.get(gp.id)?.bid ?? 0),
          tricks: gpOrder.map((gp) => byGamePlayer.get(gp.id)?.tricks_won ?? 0),
          scores: gpOrder.map((gp) => byGamePlayer.get(gp.id)?.score ?? 0),
        };
      });

    const settings: GameDraftSettings = { extensions: {} };

    return {
      id: g.id,
      version: FINISHED_GAME_RECORD_VERSION,
      endedAt: g.finished_at as string,
      playerNames,
      settings,
      roundsCompleted,
    };
  });
}
