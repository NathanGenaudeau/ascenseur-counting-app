/**
 * Résultat de manche par joueur — table `round_results` (Supabase / Postgres).
 * Cohérent avec le scoring : champs optionnels selon les règles métier branchées plus tard.
 */
export type RoundResultDocument = {
  _id: string;
  gameId: string;
  roundIndex: number;
  playerId: string;
  /** Données saisies (annonces, contrats, etc.). */
  capture?: Record<string, unknown>;
  /** Score attribué pour cette manche à ce joueur. */
  roundScore?: number;
  /** Score cumulé après application de cette manche (si suivi côté document). */
  cumulativeScoreAfter?: number;
  createdAt: string;
  updatedAt: string;
};

export function parseRoundResultDocument(input: unknown): RoundResultDocument {
  if (typeof input !== 'object' || input === null) {
    throw new TypeError('Résultat de manche invalide : objet attendu');
  }
  const o = input as Record<string, unknown>;
  if (typeof o._id !== 'string' || o._id.length === 0) {
    throw new TypeError('Résultat de manche invalide : _id');
  }
  if (typeof o.gameId !== 'string' || o.gameId.length === 0) {
    throw new TypeError('Résultat de manche invalide : gameId');
  }
  if (typeof o.roundIndex !== 'number' || !Number.isInteger(o.roundIndex) || o.roundIndex < 0) {
    throw new TypeError('Résultat de manche invalide : roundIndex');
  }
  if (typeof o.playerId !== 'string' || o.playerId.length === 0) {
    throw new TypeError('Résultat de manche invalide : playerId');
  }
  if (typeof o.createdAt !== 'string' || typeof o.updatedAt !== 'string') {
    throw new TypeError('Résultat de manche invalide : dates');
  }
  let capture: Record<string, unknown> | undefined;
  if (o.capture !== undefined) {
    if (typeof o.capture !== 'object' || o.capture === null || Array.isArray(o.capture)) {
      throw new TypeError('Résultat de manche invalide : capture');
    }
    capture = o.capture as Record<string, unknown>;
  }
  const roundScore = o.roundScore;
  const cumulativeScoreAfter = o.cumulativeScoreAfter;
  if (roundScore !== undefined && typeof roundScore !== 'number') {
    throw new TypeError('Résultat de manche invalide : roundScore');
  }
  if (cumulativeScoreAfter !== undefined && typeof cumulativeScoreAfter !== 'number') {
    throw new TypeError('Résultat de manche invalide : cumulativeScoreAfter');
  }
  return {
    _id: o._id,
    gameId: o.gameId,
    roundIndex: o.roundIndex,
    playerId: o.playerId,
    capture,
    roundScore,
    cumulativeScoreAfter,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}
