/**
 * Lien partie ↔ joueur — table `game_players` (Supabase / Postgres).
 * Référence `playerId` sans dupliquer le référentiel joueur.
 */
export type GameParticipationDocument = {
  _id: string;
  gameId: string;
  playerId: string;
  /** Position à la table / ordre de jeu (0 = premier). */
  seatOrder: number;
  createdAt: string;
};

export function parseGameParticipationDocument(input: unknown): GameParticipationDocument {
  if (typeof input !== 'object' || input === null) {
    throw new TypeError('Participation invalide : objet attendu');
  }
  const o = input as Record<string, unknown>;
  if (typeof o._id !== 'string' || o._id.length === 0) {
    throw new TypeError('Participation invalide : _id');
  }
  if (typeof o.gameId !== 'string' || o.gameId.length === 0) {
    throw new TypeError('Participation invalide : gameId');
  }
  if (typeof o.playerId !== 'string' || o.playerId.length === 0) {
    throw new TypeError('Participation invalide : playerId');
  }
  if (typeof o.seatOrder !== 'number' || !Number.isInteger(o.seatOrder) || o.seatOrder < 0) {
    throw new TypeError('Participation invalide : seatOrder');
  }
  if (typeof o.createdAt !== 'string') {
    throw new TypeError('Participation invalide : createdAt');
  }
  return {
    _id: o._id,
    gameId: o.gameId,
    playerId: o.playerId,
    seatOrder: o.seatOrder,
    createdAt: o.createdAt,
  };
}

/** Ordre de jeu stable pour l’affichage. */
export function sortParticipationsBySeat(
  rows: GameParticipationDocument[],
): GameParticipationDocument[] {
  return [...rows].sort((a, b) => a.seatOrder - b.seatOrder);
}
