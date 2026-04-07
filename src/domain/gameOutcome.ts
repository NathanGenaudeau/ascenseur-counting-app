import type { CompletedRound } from './gamePlayState';

export type FinalRankingRow = {
  rank: number;
  playerIndex: number;
  displayName: string;
  totalScore: number;
};

/**
 * Classement final par score total décroissant (ASC-18).
 * Les ex aequo partagent le même rang (1, 2, 2, 4).
 */
export function buildFinalRanking(
  playerNames: string[],
  cumulativeScores: number[],
): FinalRankingRow[] {
  if (playerNames.length !== cumulativeScores.length) {
    throw new Error('Noms et scores : longueurs différentes');
  }
  const indexed = playerNames.map((displayName, playerIndex) => ({
    playerIndex,
    displayName,
    totalScore: cumulativeScores[playerIndex] ?? 0,
  }));
  indexed.sort((a, b) => b.totalScore - a.totalScore || a.playerIndex - b.playerIndex);
  const rows: FinalRankingRow[] = [];
  for (let i = 0; i < indexed.length; i++) {
    const { playerIndex, displayName, totalScore } = indexed[i];
    const prev = indexed[i - 1];
    const rank =
      i > 0 && prev && prev.totalScore === totalScore ? rows[i - 1].rank : i + 1;
    rows.push({ rank, playerIndex, displayName, totalScore });
  }
  return rows;
}

export type FunStats = {
  /** Nombre de manches où le joueur a eu le meilleur score (ex aequo comptés). */
  roundWinsByPlayer: number[];
  bestSingleRound: { playerIndex: number; roundIndex: number; score: number } | null;
  worstSingleRound: { playerIndex: number; roundIndex: number; score: number } | null;
};

/**
 * Statistiques dérivées des manches (ASC-19).
 */
export function buildFunStats(roundsCompleted: CompletedRound[], playerCount: number): FunStats {
  if (roundsCompleted.length === 0 || playerCount < 1) {
    return {
      roundWinsByPlayer: Array.from({ length: playerCount }, () => 0),
      bestSingleRound: null,
      worstSingleRound: null,
    };
  }
  const roundWinsByPlayer = Array.from({ length: playerCount }, () => 0);
  for (const r of roundsCompleted) {
    const max = Math.max(...r.scores.slice(0, playerCount));
    for (let i = 0; i < playerCount; i++) {
      if (r.scores[i] === max) roundWinsByPlayer[i]++;
    }
  }
  let best: { playerIndex: number; roundIndex: number; score: number } | null = null;
  let worst: { playerIndex: number; roundIndex: number; score: number } | null = null;
  for (const r of roundsCompleted) {
    for (let i = 0; i < playerCount; i++) {
      const score = r.scores[i];
      if (best === null || score > best.score) {
        best = { playerIndex: i, roundIndex: r.roundIndex, score };
      }
      if (worst === null || score < worst.score) {
        worst = { playerIndex: i, roundIndex: r.roundIndex, score };
      }
    }
  }
  return { roundWinsByPlayer, bestSingleRound: best, worstSingleRound: worst };
}
