import { useIsFocused } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { PlayerStatsTable } from '../components/PlayerStatsTable';
import { ScribbleSeparator } from '../components/ScribbleSeparator';
import { ScreenShell } from '../components/ScreenShell';
import { StatPodium } from '../components/StatPodium';
import {
  aggregatePlayerStats,
  buildLeaderboards,
  formatLeaderboardValue,
  MIN_GAMES_FOR_STATS,
  playersEligibleForStats,
  type PlayerGlobalStats,
} from '../domain/globalStats';
import { loadCompletedGames } from '../services/completedGamesStorage';

export function StatisticsScreen() {
  const [stats, setStats] = useState<PlayerGlobalStats[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    void (async () => {
      const games = await loadCompletedGames();
      if (!cancelled) setStats(aggregatePlayerStats(games));
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused]);

  const eligible = useMemo(() => playersEligibleForStats(stats), [stats]);
  const leaderboards = useMemo(
    () => (eligible.length > 0 ? buildLeaderboards(eligible) : []),
    [eligible],
  );
  const tableRows = useMemo(
    () =>
      [...stats].sort(
        (a, b) =>
          b.gamesWon - a.gamesWon ||
          b.totalScore - a.totalScore ||
          a.displayName.localeCompare(b.displayName),
      ),
    [stats],
  );

  return (
    <ScreenShell testID="screen-statistics">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-3 font-display text-2xl text-star">Statistiques</Text>

        {stats.length === 0 ? (
          <Text testID="statistics-empty" className="font-sans text-cosmic-400">
            Jouez une ou plusieurs parties pour voir des statistiques.
          </Text>
        ) : (
          <>
            <Text className="mb-3 font-sans text-xs text-cosmic-400">
              Classements réservés aux joueurs ayant au moins {MIN_GAMES_FOR_STATS} parties terminées.
            </Text>
            {eligible.length === 0 ? (
              <Text testID="statistics-not-enough-games" className="mb-5 font-sans text-cosmic-400">
                Aucun joueur n’a encore {MIN_GAMES_FOR_STATS} parties terminées : les podiums apparaîtront dès
                qu’un joueur les aura atteintes.
              </Text>
            ) : null}
            {leaderboards.map((board) => (
              <StatPodium
                key={board.id}
                testID={`podium-${board.id}`}
                title={board.title}
                description={board.description}
                podium={board.podium}
                formatValue={(v) => formatLeaderboardValue(board.id, v)}
              />
            ))}

            <View className="mb-2 mt-1 flex-row items-center gap-2">
              <ScribbleSeparator accent="nova" />
              <Text className="font-sans-medium text-sm text-cosmic-200">Stats par joueur</Text>
            </View>
            <PlayerStatsTable stats={tableRows} />
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
