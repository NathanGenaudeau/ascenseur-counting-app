import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { GlobalWinsBarChart } from '../components/GlobalWinsBarChart';
import { ScribbleSeparator } from '../components/ScribbleSeparator';
import { ScreenShell } from '../components/ScreenShell';
import { aggregatePlayerStats, buildWinCountData, type PlayerGlobalStats } from '../domain/globalStats';
import { loadCompletedGames } from '../services/completedGamesStorage';

function formatAvg(total: number, games: number): string {
  if (games < 1) return '—';
  const v = total / games;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

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

  const winsData = buildWinCountData(stats);

  return (
    <ScreenShell testID="screen-statistics">
      <ScrollView className="flex-1 px-4 pb-8" keyboardShouldPersistTaps="handled">
        <Text className="mb-1 font-display text-2xl text-star">
          Statistiques
        </Text>

        {stats.length === 0 ? (
          <Text testID="statistics-empty" className="font-sans text-cosmic-400">
            Jouez une ou plusieurs parties pour voir des statistiques.
          </Text>
        ) : (
          <>
            <View className="mb-2 flex-row items-center gap-2">
              <ScribbleSeparator accent="star" />
              <Text className="font-sans-medium text-sm text-cosmic-200">Synthèse par joueur</Text>
            </View>
            <View className="mb-6 rounded-xl border border-hairline bg-panel-inset p-3">
              {stats.map((s, i) => (
                <View
                  key={s.key}
                  testID={`statistics-player-row-${i}`}
                  className="mb-4 border-b border-hairline pb-4 last:mb-0 last:border-b-0 last:pb-0"
                >
                  <Text className="font-sans-semibold text-base text-cosmic-50">{s.displayName}</Text>
                  <Text className="mt-1 font-sans text-sm text-cosmic-300">
                    Parties : {s.gamesPlayed} · Victoires : {s.gamesWon} · Score total : {s.totalScore}{' '}
                    · Moyenne / partie : {formatAvg(s.totalScore, s.gamesPlayed)}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mb-2 flex-row items-center gap-2">
              <ScribbleSeparator accent="nova" />
              <Text className="font-sans-medium text-sm text-cosmic-200">Victoires par joueur</Text>
            </View>
            <View className="rounded-xl border border-hairline bg-panel p-3">
              <GlobalWinsBarChart data={winsData} />
            </View>
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
