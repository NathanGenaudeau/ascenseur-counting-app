import { betSucceeded, buildFinalRanking, longestBetSuccessStreak } from './gameOutcome';
import type { FinishedGameRecord } from './finishedGameRecord';
import { computeCumulativeScores } from './scoring';

export function normalizePlayerKey(displayName: string): string {
  return displayName.trim().toLowerCase();
}

export type PlayerGlobalStats = {
  key: string;
  /** Nom affiché (première graphie rencontrée). */
  displayName: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  /** Part des parties gagnées (0–1). */
  winRate: number;
  /** Moyenne de rang / nombre de joueurs (0–1, plus bas = mieux : 2e sur 5 → 0,4 soit « top 40 % »). */
  averagePlacement: number;
  averagePoints: number;
  /** Plus longue série de paris réussis consécutifs dans une même partie. */
  bestBetStreak: number;
  /** Moyenne, sur les parties jouées, du taux de paris réussis de chaque partie (0–1). */
  averageBetSuccessRate: number;
};

type Accumulator = {
  key: string;
  displayName: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  placementSum: number;
  bestBetStreak: number;
  betSuccessRateSum: number;
};

/**
 * Statistiques globales par joueur sur l’historique (ASC-23).
 * Les joueurs sont regroupés par nom normalisé (insensible à la casse / espaces).
 * Les parties sans manche terminée sont ignorées.
 */
export function aggregatePlayerStats(games: FinishedGameRecord[]): PlayerGlobalStats[] {
  const byKey = new Map<string, Accumulator>();

  for (const game of games) {
    const n = game.playerNames.length;
    const rounds = game.roundsCompleted;
    if (n < 1 || rounds.length < 1) continue;
    const ranking = buildFinalRanking(game.playerNames, computeCumulativeScores(rounds, n));

    for (const row of ranking) {
      const key = normalizePlayerKey(row.displayName);
      let acc = byKey.get(key);
      if (!acc) {
        acc = {
          key,
          displayName: row.displayName.trim() || row.displayName,
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
          placementSum: 0,
          bestBetStreak: 0,
          betSuccessRateSum: 0,
        };
        byKey.set(key, acc);
      }
      const successfulBets = rounds.filter((r) => betSucceeded(r, row.playerIndex)).length;
      acc.gamesPlayed += 1;
      acc.totalScore += row.totalScore;
      acc.placementSum += row.rank / n;
      acc.betSuccessRateSum += successfulBets / rounds.length;
      acc.bestBetStreak = Math.max(acc.bestBetStreak, longestBetSuccessStreak(rounds, row.playerIndex));
      if (row.rank === 1) acc.gamesWon += 1;
    }
  }

  return Array.from(byKey.values()).map((acc) => ({
    key: acc.key,
    displayName: acc.displayName,
    gamesPlayed: acc.gamesPlayed,
    gamesWon: acc.gamesWon,
    totalScore: acc.totalScore,
    winRate: acc.gamesWon / acc.gamesPlayed,
    averagePlacement: acc.placementSum / acc.gamesPlayed,
    averagePoints: acc.totalScore / acc.gamesPlayed,
    bestBetStreak: acc.bestBetStreak,
    averageBetSuccessRate: acc.betSuccessRateSum / acc.gamesPlayed,
  }));
}

/** Nombre minimal de parties jouées pour apparaître dans les statistiques. */
export const MIN_GAMES_FOR_STATS = 3;

/** Joueurs ayant assez de parties pour que leurs moyennes soient significatives. */
export function playersEligibleForStats(stats: PlayerGlobalStats[]): PlayerGlobalStats[] {
  return stats.filter((s) => s.gamesPlayed >= MIN_GAMES_FOR_STATS);
}

export type LeaderboardId = 'winRate' | 'averagePlacement' | 'averagePoints' | 'bestBetStreak' | 'betSuccessRate';

export type LeaderboardEntry = {
  key: string;
  displayName: string;
  /** Rang avec ex aequo (1, 1, 3). */
  rank: number;
  value: number;
  gamesPlayed: number;
};

export type Leaderboard = {
  id: LeaderboardId;
  title: string;
  description: string;
  /** Trois premiers au plus, dans l’ordre du classement. */
  podium: LeaderboardEntry[];
};

type LeaderboardSpec = {
  id: LeaderboardId;
  title: string;
  description: string;
  value: (s: PlayerGlobalStats) => number;
  higherIsBetter: boolean;
};

const LEADERBOARDS: LeaderboardSpec[] = [
  {
    id: 'winRate',
    title: 'Taux de victoire',
    description: 'Parties gagnées sur parties jouées',
    value: (s) => s.winRate,
    higherIsBetter: true,
  },
  {
    id: 'averagePlacement',
    title: 'Place moyenne',
    description: 'Rang moyen rapporté au nombre de joueurs',
    value: (s) => s.averagePlacement,
    higherIsBetter: false,
  },
  {
    id: 'averagePoints',
    title: 'Points par partie',
    description: 'Score final moyen',
    value: (s) => s.averagePoints,
    higherIsBetter: true,
  },
  {
    id: 'bestBetStreak',
    title: 'Plus longue série',
    description: 'Paris réussis d’affilée dans une même partie',
    value: (s) => s.bestBetStreak,
    higherIsBetter: true,
  },
  {
    id: 'betSuccessRate',
    title: 'Paris réussis',
    description: 'Taux moyen de paris réussis par partie',
    value: (s) => s.averageBetSuccessRate,
    higherIsBetter: true,
  },
];

/** Comparaison tolérante pour les moyennes (évite 0.1 + 0.2 ≠ 0.3). */
function sameValue(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

/**
 * Classements affichés en podium. À valeur égale, les joueurs partagent le rang ;
 * l’ordre d’affichage privilégie alors celui qui a joué le plus de parties, puis le nom.
 */
export function buildLeaderboards(stats: PlayerGlobalStats[]): Leaderboard[] {
  return LEADERBOARDS.map((spec) => {
    const sorted = stats
      .map((s) => ({ s, value: spec.value(s) }))
      .sort((a, b) => {
        if (!sameValue(a.value, b.value)) {
          return spec.higherIsBetter ? b.value - a.value : a.value - b.value;
        }
        return b.s.gamesPlayed - a.s.gamesPlayed || a.s.displayName.localeCompare(b.s.displayName);
      });

    const podium: LeaderboardEntry[] = [];
    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      const { s, value } = sorted[i];
      const prev = podium[i - 1];
      podium.push({
        key: s.key,
        displayName: s.displayName,
        rank: prev && sameValue(prev.value, value) ? prev.rank : i + 1,
        value,
        gamesPlayed: s.gamesPlayed,
      });
    }

    return { id: spec.id, title: spec.title, description: spec.description, podium };
  });
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}

/** Valeur lisible pour l’écran (format français). */
export function formatLeaderboardValue(id: LeaderboardId, value: number): string {
  switch (id) {
    case 'winRate':
    case 'betSuccessRate':
      return formatPercent(value);
    case 'averagePlacement':
      return `Top ${formatPercent(value)}`;
    case 'averagePoints': {
      const rounded = Math.round(value * 10) / 10;
      return `${rounded.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} pts`;
    }
    case 'bestBetStreak':
      return `${value} pari${value > 1 ? 's' : ''}`;
  }
}
