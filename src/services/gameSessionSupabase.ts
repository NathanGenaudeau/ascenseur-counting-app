import {
  addPlayersToGame,
  createGame,
  updateGame,
  type GamePlayerSeatInput,
} from '../data/repositories/gamesRepository';
import { createPlayer } from '../data/repositories/playersRepository';
import { createRound, upsertRoundResults } from '../data/repositories/roundsRepository';
import { getTypedSupabaseClient } from '../data/supabaseClient';
import type { GameConfigurationDraft } from '../domain/gameConfigurationDraft';
import type { CompletedRound } from '../domain/gamePlayState';

export type RemoteSessionPlayers = { displayName: string; playerId: string }[];

/**
 * Crée les joueurs manquants, la partie `running` et les lignes `game_players`.
 */
export async function startRemoteGameSession(
  draft: GameConfigurationDraft,
): Promise<{ gameId: string; players: RemoteSessionPlayers } | null> {
  if (!getTypedSupabaseClient()) return null;

  const orderedPlayerIds: string[] = [];
  for (const slot of draft.slots) {
    const name = slot.displayName.trim();
    if (!name) return null;
    if (slot.playerId) {
      orderedPlayerIds.push(slot.playerId);
    } else {
      const created = await createPlayer(name);
      if (!created) return null;
      orderedPlayerIds.push(created._id);
    }
  }

  const game = await createGame('running', draft.playerCount);
  if (!game) return null;

  const seats: GamePlayerSeatInput[] = draft.slots.map((s, i) => ({
    playerId: orderedPlayerIds[i],
    displayNameSnapshot: s.displayName.trim(),
  }));

  const linked = await addPlayersToGame(game._id, seats);
  if (!linked) return null;

  const players: RemoteSessionPlayers = draft.slots.map((s, i) => ({
    displayName: s.displayName.trim(),
    playerId: orderedPlayerIds[i],
  }));

  return { gameId: game._id, players };
}

/**
 * Persiste une manche terminée (round + round_results liés à `game_players`).
 */
export async function persistRemoteRound(
  gameId: string,
  orderedPlayerIds: string[],
  completed: CompletedRound,
): Promise<boolean> {
  const client = getTypedSupabaseClient();
  if (!client) return false;

  const { data: gpRows, error: gpErr } = await client
    .from('game_players')
    .select('id, player_id')
    .eq('game_id', gameId)
    .order('seat_order', { ascending: true });
  if (gpErr || !gpRows || gpRows.length !== orderedPlayerIds.length) {
    if (__DEV__) {
      console.warn('[persistRemoteRound] game_players', gpErr?.message ?? 'count mismatch');
    }
    return false;
  }

  for (let i = 0; i < orderedPlayerIds.length; i++) {
    if (gpRows[i].player_id !== orderedPlayerIds[i]) {
      if (__DEV__) console.warn('[persistRemoteRound] ordre joueurs incohérent');
      return false;
    }
  }

  const round = await createRound(gameId, completed.roundIndex);
  if (!round) return false;

  const results = gpRows.map((gp, i) => ({
    gamePlayerId: gp.id,
    bid: completed.announcements[i] ?? 0,
    tricksWon: completed.tricks[i] ?? 0,
  }));

  return upsertRoundResults(round._id, results);
}

export async function finishRemoteGame(gameId: string): Promise<boolean> {
  return updateGame(gameId, {
    status: 'finished',
    finished_at: new Date().toISOString(),
  });
}
