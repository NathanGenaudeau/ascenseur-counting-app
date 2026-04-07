/**
 * Manche — table `rounds` (Supabase / Postgres).
 */
export type RoundStatus = 'pending' | 'active' | 'completed';

export type RoundDocument = {
  _id: string;
  gameId: string;
  /** Index de manche dans la partie (0 = première manche). */
  roundIndex: number;
  status: RoundStatus;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const ROUND_STATUSES: RoundStatus[] = ['pending', 'active', 'completed'];

function isRoundStatus(value: unknown): value is RoundStatus {
  return typeof value === 'string' && ROUND_STATUSES.includes(value as RoundStatus);
}

export function parseRoundDocument(input: unknown): RoundDocument {
  if (typeof input !== 'object' || input === null) {
    throw new TypeError('Manche invalide : objet attendu');
  }
  const o = input as Record<string, unknown>;
  if (typeof o._id !== 'string' || o._id.length === 0) {
    throw new TypeError('Manche invalide : _id');
  }
  if (typeof o.gameId !== 'string' || o.gameId.length === 0) {
    throw new TypeError('Manche invalide : gameId');
  }
  if (typeof o.roundIndex !== 'number' || !Number.isInteger(o.roundIndex) || o.roundIndex < 0) {
    throw new TypeError('Manche invalide : roundIndex');
  }
  if (!isRoundStatus(o.status)) {
    throw new TypeError('Manche invalide : status');
  }
  if (typeof o.createdAt !== 'string' || typeof o.updatedAt !== 'string') {
    throw new TypeError('Manche invalide : dates');
  }
  const startedAt = o.startedAt;
  const endedAt = o.endedAt;
  if (startedAt !== undefined && typeof startedAt !== 'string') {
    throw new TypeError('Manche invalide : startedAt');
  }
  if (endedAt !== undefined && typeof endedAt !== 'string') {
    throw new TypeError('Manche invalide : endedAt');
  }
  return {
    _id: o._id,
    gameId: o.gameId,
    roundIndex: o.roundIndex,
    status: o.status,
    startedAt: startedAt as string | undefined,
    endedAt: endedAt as string | undefined,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

/** Progression : manches triées par `roundIndex` croissant. */
export function sortRoundsByIndex(rows: RoundDocument[]): RoundDocument[] {
  return [...rows].sort((a, b) => a.roundIndex - b.roundIndex);
}
