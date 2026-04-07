import type { CompletedRound } from './gamePlayState';

export type CumulativePoint = {
  /** 0 = avant la première manche validée, puis 1..n */
  roundIndex: number;
  cumulative: number;
};

/**
 * Séries pour le graphique d’évolution (scores cumulés après chaque manche validée).
 * ASC-13 : ordre temporel des manches, cumuls, valeurs négatives possibles.
 */
export function buildCumulativeSeriesPerPlayer(
  roundsCompleted: CompletedRound[],
  playerCount: number,
): CumulativePoint[][] {
  const perPlayer: CumulativePoint[][] = Array.from({ length: playerCount }, () => [
    { roundIndex: 0, cumulative: 0 },
  ]);
  const acc = Array.from({ length: playerCount }, () => 0);

  for (let r = 0; r < roundsCompleted.length; r++) {
    const sc = roundsCompleted[r].scores;
    for (let p = 0; p < playerCount; p++) {
      acc[p] += sc[p] ?? 0;
      perPlayer[p].push({ roundIndex: r + 1, cumulative: acc[p] });
    }
  }
  return perPlayer;
}

export function getYRangeForSeries(series: CumulativePoint[][]): { minY: number; maxY: number } {
  let minY = 0;
  let maxY = 0;
  for (const line of series) {
    for (const pt of line) {
      minY = Math.min(minY, pt.cumulative);
      maxY = Math.max(maxY, pt.cumulative);
    }
  }
  if (minY === maxY) {
    return { minY: minY - 1, maxY: maxY + 1 };
  }
  return { minY, maxY };
}
