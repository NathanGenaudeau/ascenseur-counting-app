import type { GameDraftSettings } from './gameConfigurationDraft';
import type { CompletedRound, GamePlayState, RoundDraft } from './gamePlayState';

export type ActiveSessionPlayer = {
  displayName: string;
  /** Toujours défini après démarrage via Supabase. */
  playerId?: string;
  /** Ligne `game_players` de ce siège ; nécessaire pour persister les manches. */
  gamePlayerId?: string;
};

export type ActiveGameSession = {
  players: ActiveSessionPlayer[];
  settings: GameDraftSettings;
  /** Partie persistée côté Supabase. */
  supabaseGameId?: string;
};

/** Avancement de l’envoi vers Supabase (les manches sont envoyées dans l’ordre). */
export type RemoteSyncProgress = {
  syncedRoundCount: number;
  finishSynced: boolean;
};

export const INITIAL_SYNC_PROGRESS: RemoteSyncProgress = { syncedRoundCount: 0, finishSynced: false };

/** Partie en cours sauvegardée sur l’appareil pour survivre à un redémarrage de l’app. */
export type StoredActiveGame = {
  version: 1;
  session: ActiveGameSession;
  playState: GamePlayState;
  sync: RemoteSyncProgress;
};

/** Identifiants `game_players` dans l’ordre des sièges, ou `null` si incomplets. */
export function orderedGamePlayerIds(session: ActiveGameSession): string[] | null {
  const ids = session.players.map((p) => p.gamePlayerId);
  return ids.every((id): id is string => typeof id === 'string' && id.length > 0) ? ids : null;
}

export function unsyncedRoundCount(roundsCompleted: number, sync: RemoteSyncProgress): number {
  return Math.max(0, roundsCompleted - sync.syncedRoundCount);
}

export function serializeActiveGame(game: StoredActiveGame): string {
  return JSON.stringify(game);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isIntArray(v: unknown, length: number): v is number[] {
  return Array.isArray(v) && v.length === length && v.every((x) => Number.isInteger(x));
}

function isOptionalString(v: unknown): v is string | undefined {
  return v === undefined || typeof v === 'string';
}

function parsePlayer(v: unknown): ActiveSessionPlayer | null {
  if (!isRecord(v) || typeof v.displayName !== 'string') return null;
  if (!isOptionalString(v.playerId) || !isOptionalString(v.gamePlayerId)) return null;
  return { displayName: v.displayName, playerId: v.playerId, gamePlayerId: v.gamePlayerId };
}

function parseRound(v: unknown, n: number): CompletedRound | null {
  if (!isRecord(v) || !Number.isInteger(v.roundIndex)) return null;
  if (!isIntArray(v.announcements, n) || !isIntArray(v.tricks, n) || !isIntArray(v.scores, n)) return null;
  if (v.cardsPerHand !== undefined && !Number.isInteger(v.cardsPerHand)) return null;
  return {
    roundIndex: v.roundIndex as number,
    announcements: v.announcements,
    tricks: v.tricks,
    scores: v.scores,
    cardsPerHand: v.cardsPerHand as number | undefined,
  };
}

function parseDraft(v: unknown, n: number): RoundDraft | null {
  if (!isRecord(v) || (v.step !== 'announce' && v.step !== 'results')) return null;
  if (!isIntArray(v.announcements, n) || !isIntArray(v.tricks, n)) return null;
  if (typeof v.announcementTouched !== 'boolean') return null;
  return {
    step: v.step,
    announcements: v.announcements,
    tricks: v.tricks,
    announcementTouched: v.announcementTouched,
  };
}

function parsePlayState(v: unknown, n: number): GamePlayState | null {
  if (!isRecord(v) || (v.phase !== 'active' && v.phase !== 'finished')) return null;
  if (!Number.isInteger(v.currentRoundIndex)) return null;
  if (v.descentStartRound !== null && !Number.isInteger(v.descentStartRound)) return null;
  if (!Array.isArray(v.roundsCompleted)) return null;
  const roundsCompleted: CompletedRound[] = [];
  for (const r of v.roundsCompleted) {
    const parsed = parseRound(r, n);
    if (!parsed) return null;
    roundsCompleted.push(parsed);
  }
  const draft = parseDraft(v.draft, n);
  if (!draft) return null;
  return {
    phase: v.phase,
    currentRoundIndex: v.currentRoundIndex as number,
    descentStartRound: v.descentStartRound as number | null,
    roundsCompleted,
    draft,
  };
}

/** Relit une partie sauvegardée ; `null` si absente, corrompue ou d’un format inconnu. */
export function parseStoredActiveGame(json: string | null): StoredActiveGame | null {
  if (!json) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(raw) || raw.version !== 1) return null;
  const { session, sync } = raw;
  if (!isRecord(session) || !Array.isArray(session.players) || session.players.length === 0) return null;
  const players: ActiveSessionPlayer[] = [];
  for (const p of session.players) {
    const parsed = parsePlayer(p);
    if (!parsed) return null;
    players.push(parsed);
  }
  if (!isOptionalString(session.supabaseGameId)) return null;
  const playState = parsePlayState(raw.playState, players.length);
  if (!playState) return null;
  if (!isRecord(sync) || !Number.isInteger(sync.syncedRoundCount) || typeof sync.finishSynced !== 'boolean') {
    return null;
  }
  const syncedRoundCount = Math.min(Math.max(0, sync.syncedRoundCount as number), playState.roundsCompleted.length);
  return {
    version: 1,
    session: {
      players,
      settings: isRecord(session.settings) ? (session.settings as GameDraftSettings) : { extensions: {} },
      supabaseGameId: session.supabaseGameId,
    },
    playState,
    sync: { syncedRoundCount, finishSynced: sync.finishSynced },
  };
}
