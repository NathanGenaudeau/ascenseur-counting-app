/**
 * Moteur de score de manche (ASC-11) — déterministe et réutilisable.
 * Règle ASC-51 (bid / tricks_won) : seule source du score, y compris pour la persistance.
 */
export function computeRoundScore(announced: number, tricksWon: number): number {
  if (announced === tricksWon) {
    return announced;
  }
  return -Math.abs(announced - tricksWon);
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
