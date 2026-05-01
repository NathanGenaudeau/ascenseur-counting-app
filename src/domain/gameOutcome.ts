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

/** Pari réussi : annonce identique au nombre de plis remportés (même règle que le score de manche). */
function betSucceeded(r: CompletedRound, playerIndex: number): boolean {
  const a = r.announcements[playerIndex];
  const t = r.tricks[playerIndex];
  return (
    typeof a === 'number' &&
    Number.isInteger(a) &&
    typeof t === 'number' &&
    Number.isInteger(t) &&
    a === t
  );
}

/**
 * Série actuelle de paris réussis : compte depuis la dernière manche terminée à rebours
 * jusqu’à la première défaillance.
 */
export function currentBetSuccessStreak(
  roundsCompleted: CompletedRound[],
  playerIndex: number,
): number {
  let streak = 0;
  for (let r = roundsCompleted.length - 1; r >= 0; r--) {
    if (betSucceeded(roundsCompleted[r], playerIndex)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function longestBetSuccessStreak(roundsCompleted: CompletedRound[], playerIndex: number): number {
  let best = 0;
  let cur = 0;
  for (const r of roundsCompleted) {
    if (betSucceeded(r, playerIndex)) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

/** Annonce explicite à 0 plis. */
function announcedZero(r: CompletedRound, playerIndex: number): boolean {
  const a = r.announcements[playerIndex];
  return typeof a === 'number' && Number.isInteger(a) && a === 0;
}

function indicesWithMaxValue(values: number[]): number[] {
  if (values.length === 0) return [];
  const m = Math.max(...values);
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] === m) out.push(i);
  }
  return out;
}

/**
 * Pire somme sur une suite **consécutive** de manches (la plus négative = plus grosse chute).
 * En cas d’égalité sur la somme, on retient la suite la plus longue.
 */
function worstConsecutivePointDrop(
  roundsCompleted: CompletedRound[],
  playerIndex: number,
): { sum: number; roundCount: number } | null {
  if (roundsCompleted.length === 0) return null;
  const scores = roundsCompleted.map((r) => r.scores[playerIndex] ?? 0);
  let best: { sum: number; roundCount: number } | null = null;
  for (let i = 0; i < scores.length; i++) {
    let s = 0;
    for (let j = i; j < scores.length; j++) {
      s += scores[j];
      if (s < 0) {
        const roundCount = j - i + 1;
        if (
          best === null ||
          s < best.sum ||
          (s === best.sum && roundCount > best.roundCount)
        ) {
          best = { sum: s, roundCount };
        }
      }
    }
  }
  return best;
}

export type BettingHighlights = {
  bestSuccessRate: { playerIndices: number[]; percent: number } | null;
  /** Plus forte chute de points sur des manches consécutives (somme la plus négative). */
  biggestDrop: {
    playerIndices: number[];
    lossPoints: number;
    roundCount: number;
  } | null;
  bestStreak: { playerIndices: number[]; streak: number } | null;
  /** Joueurs ayant le plus souvent annoncé 0 au pari (tous les ex aequo). */
  mostZeroBets: { playerIndices: number[]; count: number } | null;
};

/**
 * Stats « paris » : taux de réussite, chute max consécutive, série, annonces à 0.
 * Tous les joueurs à égalité sur une métrique sont listés dans `playerIndices` (ordre croissant d’indice).
 */
export function buildBettingHighlights(
  roundsCompleted: CompletedRound[],
  playerCount: number,
): BettingHighlights {
  if (roundsCompleted.length === 0 || playerCount < 1) {
    return {
      bestSuccessRate: null,
      biggestDrop: null,
      bestStreak: null,
      mostZeroBets: null,
    };
  }

  const rates: number[] = [];
  const streaks: number[] = [];
  const zeroBetCounts: number[] = [];
  const roundCount = roundsCompleted.length;

  for (let i = 0; i < playerCount; i++) {
    let wins = 0;
    let zeros = 0;
    for (const r of roundsCompleted) {
      if (betSucceeded(r, i)) wins++;
      if (announcedZero(r, i)) zeros++;
    }
    rates.push(Math.round((wins / roundCount) * 100));
    streaks.push(longestBetSuccessStreak(roundsCompleted, i));
    zeroBetCounts.push(zeros);
  }

  const bestRateIndices = indicesWithMaxValue(rates);
  const bestStreakIndices = indicesWithMaxValue(streaks);
  const mostZeroIndices = indicesWithMaxValue(zeroBetCounts);

  const dropPerPlayer: (ReturnType<typeof worstConsecutivePointDrop> | null)[] = [];
  for (let i = 0; i < playerCount; i++) {
    dropPerPlayer.push(worstConsecutivePointDrop(roundsCompleted, i));
  }

  const withDrop = dropPerPlayer
    .map((d, playerIndex) => ({ playerIndex, d }))
    .filter((x): x is { playerIndex: number; d: { sum: number; roundCount: number } } => x.d !== null);

  let biggestDrop: BettingHighlights['biggestDrop'];
  if (withDrop.length === 0) {
    biggestDrop = {
      playerIndices: [0],
      lossPoints: 0,
      roundCount: 0,
    };
  } else {
    let minSum = withDrop[0].d.sum;
    for (const { d } of withDrop) {
      if (d.sum < minSum) minSum = d.sum;
    }
    const tied = withDrop.filter((x) => x.d.sum === minSum);
    const dropRoundCount = Math.max(...tied.map((x) => x.d.roundCount));
    biggestDrop = {
      playerIndices: tied
        .map((x) => x.playerIndex)
        .sort((a, b) => a - b),
      lossPoints: -minSum,
      roundCount: dropRoundCount,
    };
  }

  return {
    bestSuccessRate: {
      playerIndices: bestRateIndices,
      percent: rates[bestRateIndices[0] ?? 0] ?? 0,
    },
    biggestDrop,
    bestStreak: {
      playerIndices: bestStreakIndices,
      streak: streaks[bestStreakIndices[0] ?? 0] ?? 0,
    },
    mostZeroBets: {
      playerIndices: mostZeroIndices,
      count: zeroBetCounts[mostZeroIndices[0] ?? 0] ?? 0,
    },
  };
}
