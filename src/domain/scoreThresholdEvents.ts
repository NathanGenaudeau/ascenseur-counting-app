/** Seuil haut : son joué quand le cumul dépasse cette valeur (strictement). */
export const SCORE_THRESHOLD_ABOVE = 10;

/** Seuil bas : son joué quand le cumul passe strictement en dessous. */
export const SCORE_THRESHOLD_BELOW = -10;

export type ScoreThresholdSoundKind = 'above10' | 'belowMinus10';

/**
 * Détecte les franchissements de seuils entre deux états de scores cumulés (même manche ou non).
 * Un joueur qui était déjà > 10 ne redéclenche pas le son « au-dessus de 10 ».
 */
export function scoreThresholdSoundsToPlay(
  previous: number[],
  next: number[],
): ScoreThresholdSoundKind[] {
  const out: ScoreThresholdSoundKind[] = [];
  const m = Math.min(previous.length, next.length);
  for (let i = 0; i < m; i++) {
    const p = previous[i] ?? 0;
    const q = next[i] ?? 0;
    if (p <= SCORE_THRESHOLD_ABOVE && q > SCORE_THRESHOLD_ABOVE) {
      out.push('above10');
    }
    if (p >= SCORE_THRESHOLD_BELOW && q < SCORE_THRESHOLD_BELOW) {
      out.push('belowMinus10');
    }
  }
  return out;
}
