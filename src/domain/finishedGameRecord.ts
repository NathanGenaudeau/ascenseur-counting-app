import type { GameDraftSettings } from './gameConfigurationDraft';
import type { CompletedRound, GamePlayState } from './gamePlayState';

export const FINISHED_GAME_RECORD_VERSION = 1 as const;

export type FinishedGameRecord = {
  id: string;
  version: typeof FINISHED_GAME_RECORD_VERSION;
  endedAt: string;
  playerNames: string[];
  settings: GameDraftSettings;
  roundsCompleted: CompletedRound[];
};

type SessionLike = {
  players: { displayName: string }[];
  settings: GameDraftSettings;
};

export function buildFinishedGameRecord(session: SessionLike, playState: GamePlayState): FinishedGameRecord {
  return {
    id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    version: FINISHED_GAME_RECORD_VERSION,
    endedAt: new Date().toISOString(),
    playerNames: session.players.map((p) => p.displayName),
    settings: session.settings,
    roundsCompleted: playState.roundsCompleted,
  };
}

function isCompletedRound(value: unknown): value is CompletedRound {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.roundIndex !== 'number') return false;
  if (!Array.isArray(o.announcements) || !Array.isArray(o.tricks) || !Array.isArray(o.scores)) return false;
  return true;
}

export function parseFinishedGameRecord(input: unknown): FinishedGameRecord | null {
  if (typeof input !== 'object' || input === null) return null;
  const o = input as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id.length === 0) return null;
  if (o.version !== FINISHED_GAME_RECORD_VERSION) return null;
  if (typeof o.endedAt !== 'string') return null;
  if (!Array.isArray(o.playerNames) || o.playerNames.some((n) => typeof n !== 'string')) return null;
  if (typeof o.settings !== 'object' || o.settings === null) return null;
  if (!Array.isArray(o.roundsCompleted) || !o.roundsCompleted.every(isCompletedRound)) return null;
  return {
    id: o.id,
    version: FINISHED_GAME_RECORD_VERSION,
    endedAt: o.endedAt,
    playerNames: o.playerNames as string[],
    settings: o.settings as GameDraftSettings,
    roundsCompleted: o.roundsCompleted as CompletedRound[],
  };
}

export function serializeFinishedGamesList(games: FinishedGameRecord[]): string {
  return JSON.stringify(games);
}

export function parseFinishedGamesList(raw: string): FinishedGameRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: FinishedGameRecord[] = [];
  for (const item of parsed) {
    const g = parseFinishedGameRecord(item);
    if (g) out.push(g);
  }
  return out;
}
