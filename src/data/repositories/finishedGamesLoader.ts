import { FINISHED_GAME_RECORD_VERSION, type FinishedGameRecord } from '../../domain/finishedGameRecord';
import type { CompletedRound } from '../../domain/gamePlayState';
import type { GameDraftSettings } from '../../domain/gameConfigurationDraft';
import { gameStatusForDb } from '../supabaseGameStatus';
import { getGameParticipants } from './gamesRepository';
import { getPlayerById } from './playersRepository';
import { getTypedSupabaseClient } from '../supabaseClient';

/**
 * Reconstruit l’historique des parties terminées depuis Supabase.
 */
export async function loadFinishedGameRecordsFromSupabase(): Promise<FinishedGameRecord[]> {
  const client = getTypedSupabaseClient();
  if (!client) return [];

  const { data: games, error } = await client
    .from('games')
    .select('id, finished_at')
    .eq('status', gameStatusForDb('finished'))
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false });

  if (error || !games) return [];

  const out: FinishedGameRecord[] = [];

  for (const g of games) {
    const parts = await getGameParticipants(g.id);
    const playerIdsOrdered = parts.map((p) => p.playerId);
    const playerNames: string[] = [];
    for (const pid of playerIdsOrdered) {
      const pl = await getPlayerById(pid);
      playerNames.push(pl?.displayName ?? '');
    }

    const { data: gpRows } = await client
      .from('game_players')
      .select('id, player_id')
      .eq('game_id', g.id)
      .order('seat_order', { ascending: true });

    const gpOrder = gpRows ?? [];

    const { data: roundRows } = await client
      .from('rounds')
      .select('id, round_number')
      .eq('game_id', g.id)
      .order('round_number', { ascending: true });

    const roundsCompleted: CompletedRound[] = [];
    for (const r of roundRows ?? []) {
      const { data: rr } = await client.from('round_results').select('*').eq('round_id', r.id);
      const byGamePlayer = new Map((rr ?? []).map((row) => [row.game_player_id, row]));
      const announcements = gpOrder.map((gp) => byGamePlayer.get(gp.id)?.bid ?? 0);
      const tricks = gpOrder.map((gp) => byGamePlayer.get(gp.id)?.tricks_won ?? 0);
      const scores = gpOrder.map((gp) => byGamePlayer.get(gp.id)?.score ?? 0);
      roundsCompleted.push({
        roundIndex: r.round_number,
        announcements,
        tricks,
        scores,
      });
    }

    const settings: GameDraftSettings = { extensions: {} };

    out.push({
      id: g.id,
      version: FINISHED_GAME_RECORD_VERSION,
      endedAt: g.finished_at as string,
      playerNames,
      settings,
      roundsCompleted,
    });
  }

  return out;
}
