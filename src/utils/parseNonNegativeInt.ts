/** Parse une chaîne en entier ≥ 0 ou null si vide / invalide. */
export function parseNonNegativeIntText(text: string): number | null {
  const t = text.trim();
  if (t === '') return null;
  if (!/^\d+$/.test(t)) return null;
  return Number.parseInt(t, 10);
}
