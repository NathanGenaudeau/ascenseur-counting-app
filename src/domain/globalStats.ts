import { buildFinalRanking } from './gameOutcome';
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
};

/**
 * Statistiques globales par joueur sur l’historique local (ASC-23).
 * Les joueurs sont regroupés par nom normalisé (insensible à la casse / espaces).
 */
export function aggregatePlayerStats(games: FinishedGameRecord[]): PlayerGlobalStats[] {
  const byKey = new Map<string, PlayerGlobalStats>();

  for (const game of games) {
    const n = game.playerNames.length;
    if (n < 1 || game.roundsCompleted.length < 1) continue;
    const cumulative = computeCumulativeScores(game.roundsCompleted, n);
    const ranking = buildFinalRanking(game.playerNames, cumulative);

    for (const row of ranking) {
      const key = normalizePlayerKey(row.displayName);
      let agg = byKey.get(key);
      if (!agg) {
        agg = {
          key,
          displayName: row.displayName.trim() || row.displayName,
          gamesPlayed: 0,
          gamesWon: 0,
          totalScore: 0,
        };
        byKey.set(key, agg);
      }
      agg.gamesPlayed += 1;
      agg.totalScore += row.totalScore;
      if (row.rank === 1) {
        agg.gamesWon += 1;
      }
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) => b.gamesWon - a.gamesWon || b.totalScore - a.totalScore || a.displayName.localeCompare(b.displayName),
  );
}

export type WinCountDatum = {
  displayName: string;
  wins: number;
};

/** Données pour graphique barres (ASC-24) — victoires par joueur, tri décroissant. */
export function buildWinCountData(stats: PlayerGlobalStats[], limit = 10): WinCountDatum[] {
  return stats
    .filter((s) => s.gamesWon > 0)
    .slice(0, limit)
    .map((s) => ({ displayName: s.displayName, wins: s.gamesWon }));
}
