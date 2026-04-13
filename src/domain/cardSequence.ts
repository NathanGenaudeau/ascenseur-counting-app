/**
 * Séquence de cartes : montée illimitée (manche n → n cartes) tant que la descente
 * n’est pas entamée. « Descendre » fixe la première manche de descente `d` ; le pic
 * implicite est alors `d − 1` cartes (dernière manche de montée).
 */

export type CardSequencePhase = 'montée' | 'descente';

/**
 * Indice de manche minimum (1-based) pour autoriser « Terminer la partie » après
 * une descente entamée : cycle complet = 2 × pic, soit `2 × (descentStartRound − 1)`.
 * `null` tant que la descente n’a pas commencé.
 */
export function minRoundIndexToAllowEndGame(descentStartRound: number | null): number | null {
  if (descentStartRound === null) return null;
  const peak = descentStartRound - 1;
  if (peak < 1) return null;
  return 2 * peak;
}

/**
 * Nombre de cartes par joueur pour la manche `roundIndex1Based`.
 */
export function cardsPerHandForRound(
  roundIndex1Based: number,
  descentStartRound: number | null,
): number {
  if (descentStartRound === null) {
    return roundIndex1Based;
  }
  const d = descentStartRound;
  if (roundIndex1Based < d) {
    return roundIndex1Based;
  }
  const peak = d - 1;
  const k = roundIndex1Based - d;
  return Math.max(1, peak - 1 - k);
}

export function cardPhaseForRound(
  roundIndex1Based: number,
  descentStartRound: number | null,
): CardSequencePhase {
  if (descentStartRound === null) {
    return 'montée';
  }
  if (roundIndex1Based < descentStartRound) {
    return 'montée';
  }
  return 'descente';
}
