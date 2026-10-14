import { startGameWithSeats, updateGame, type StartedGameSeat } from '../data/repositories/gamesRepository';
import { saveRoundWithResults } from '../data/repositories/roundsRepository';
import type { GameConfigurationDraft } from '../domain/gameConfigurationDraft';
import type { CompletedRound } from '../domain/gamePlayState';

export type RemoteSessionPlayers = StartedGameSeat[];

/**
 * Crée la partie distante (joueurs manquants, partie `running`, sièges) en un seul appel atomique.
 */
export async function startRemoteGameSession(
  draft: GameConfigurationDraft,
): Promise<{ gameId: string; players: RemoteSessionPlayers } | null> {
  if (draft.slots.some((s) => !s.displayName.trim())) return null;
  return startGameWithSeats(
    draft.slots.map((s) => ({ playerId: s.playerId, displayName: s.displayName })),
  );
}

/**
 * Persiste une manche terminée. `gamePlayerIds` suit l’ordre des sièges (= index joueur).
 * Idempotent : peut être rejoué après un échec réseau.
 */
export async function persistRemoteRound(
  gameId: string,
  gamePlayerIds: string[],
  completed: CompletedRound,
): Promise<boolean> {
  if (gamePlayerIds.length !== completed.announcements.length) return false;
  return saveRoundWithResults(
    gameId,
    completed.roundIndex,
    gamePlayerIds.map((gamePlayerId, i) => ({
      gamePlayerId,
      bid: completed.announcements[i] ?? 0,
      tricksWon: completed.tricks[i] ?? 0,
    })),
  );
}

export async function finishRemoteGame(gameId: string): Promise<boolean> {
  return updateGame(gameId, {
    status: 'finished',
    finished_at: new Date().toISOString(),
  });
}
