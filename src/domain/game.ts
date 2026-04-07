/**
 * Partie — table `games` (Supabase / Postgres).
 */
export type GameStatus = 'draft' | 'running' | 'finished' | 'aborted';

export type GameDocument = {
  _id: string;
  status: GameStatus;
  /** Horodatage ISO 8601. */
  startedAt?: string;
  endedAt?: string;
  /** Paramètres de partie (règles, options) sérialisables en JSON. */
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

const STATUSES: GameStatus[] = ['draft', 'running', 'finished', 'aborted'];

function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === 'string' && STATUSES.includes(value as GameStatus);
}

export function parseGameDocument(input: unknown): GameDocument {
  if (typeof input !== 'object' || input === null) {
    throw new TypeError('Partie invalide : objet attendu');
  }
  const o = input as Record<string, unknown>;
  if (typeof o._id !== 'string' || o._id.length === 0) {
    throw new TypeError('Partie invalide : _id');
  }
  if (!isGameStatus(o.status)) {
    throw new TypeError('Partie invalide : status');
  }
  if (typeof o.createdAt !== 'string' || typeof o.updatedAt !== 'string') {
    throw new TypeError('Partie invalide : dates');
  }
  const startedAt = o.startedAt;
  const endedAt = o.endedAt;
  if (startedAt !== undefined && typeof startedAt !== 'string') {
    throw new TypeError('Partie invalide : startedAt');
  }
  if (endedAt !== undefined && typeof endedAt !== 'string') {
    throw new TypeError('Partie invalide : endedAt');
  }
  let settings: Record<string, unknown> | undefined;
  if (o.settings !== undefined) {
    if (typeof o.settings !== 'object' || o.settings === null || Array.isArray(o.settings)) {
      throw new TypeError('Partie invalide : settings');
    }
    settings = o.settings as Record<string, unknown>;
  }
  return {
    _id: o._id,
    status: o.status,
    startedAt: startedAt as string | undefined,
    endedAt: endedAt as string | undefined,
    settings,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}
