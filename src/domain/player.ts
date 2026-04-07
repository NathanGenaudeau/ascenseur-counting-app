/**
 * Joueur — table `players` (Supabase / Postgres, identifiant stable pour historique et stats).
 */
export type PlayerDocument = {
  _id: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

function isIsoLike(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 10;
}

export function parsePlayerDocument(input: unknown): PlayerDocument {
  if (typeof input !== 'object' || input === null) {
    throw new TypeError('Joueur invalide : objet attendu');
  }
  const o = input as Record<string, unknown>;
  const _id = o._id;
  const displayName = o.displayName;
  const createdAt = o.createdAt;
  const updatedAt = o.updatedAt;
  if (typeof _id !== 'string' || _id.length === 0) {
    throw new TypeError('Joueur invalide : _id');
  }
  if (typeof displayName !== 'string' || displayName.trim().length === 0) {
    throw new TypeError('Joueur invalide : displayName');
  }
  if (!isIsoLike(createdAt) || !isIsoLike(updatedAt)) {
    throw new TypeError('Joueur invalide : dates');
  }
  return {
    _id,
    displayName: displayName.trim(),
    createdAt,
    updatedAt,
  };
}
