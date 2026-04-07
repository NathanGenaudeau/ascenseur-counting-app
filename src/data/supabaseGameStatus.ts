import type { GameStatus } from '../domain/game';

/**
 * Valeurs de l’enum Postgres `game_status` (sensibles à la casse).
 * Schéma cible : `draft` | `in_progress` | `finished` (pas de `aborted` → stocké comme `finished`).
 * Vérifier en SQL : `SELECT unnest(enum_range(NULL::game_status));`
 */
export const GAME_STATUS_DB: Record<GameStatus, string> = {
  draft: 'draft',
  running: 'in_progress',
  finished: 'finished',
  /** Pas de valeur dédiée côté DB : on clôt la ligne comme une partie terminée. */
  aborted: 'finished',
};

export function gameStatusForDb(domain: GameStatus): string {
  return GAME_STATUS_DB[domain];
}

/** Lit une valeur renvoyée par Postgres et la ramène au domaine. */
export function gameStatusFromDb(db: string): GameStatus {
  const map: Record<string, GameStatus> = {
    draft: 'draft',
    in_progress: 'running',
    finished: 'finished',
    // Compat : anciennes bases / tests
    running: 'running',
    DRAFT: 'draft',
    RUNNING: 'running',
    FINISHED: 'finished',
    ABORTED: 'aborted',
    aborted: 'aborted',
    CANCELLED: 'aborted',
  };
  return map[db] ?? 'draft';
}
