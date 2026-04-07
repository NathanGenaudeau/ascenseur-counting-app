/**
 * Moteur de score de manche (ASC-11) — déterministe et réutilisable.
 * Règle ASC-51 (bid / tricks_won) : même formule — ne pas dupliquer ailleurs pour la persistance.
 */
export function computeRoundScore(announced: number, tricksWon: number): number {
  if (announced === tricksWon) {
    return announced;
  }
  return -Math.abs(announced - tricksWon);
}

/** Point d’entrée nommé pour la persistance `round_results` (bid, tricks_won). */
export function computeRoundScoreFromBid(bid: number, tricksWon: number): number {
  return computeRoundScore(bid, tricksWon);
}

export function computeRoundScoresForPlayers(
  announcements: number[],
  tricks: number[],
): number[] {
  if (announcements.length !== tricks.length) {
    throw new Error('Annonces et plis réalisés : longueurs différentes');
  }
  return announcements.map((a, i) => computeRoundScore(a, tricks[i]));
}

export function computeCumulativeScores(
  roundsCompleted: { scores: number[] }[],
  playerCount: number,
): number[] {
  const acc = Array.from({ length: playerCount }, () => 0);
  for (const round of roundsCompleted) {
    for (let i = 0; i < playerCount; i++) {
      acc[i] += round.scores[i] ?? 0;
    }
  }
  return acc;
}
