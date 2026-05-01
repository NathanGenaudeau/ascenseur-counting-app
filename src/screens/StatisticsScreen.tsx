import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlobalWinsBarChart } from '../components/GlobalWinsBarChart';
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
    <SafeAreaView testID="screen-statistics" className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1 px-4 pb-8" keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-xl font-semibold text-primary-900">Statistiques</Text>

        {stats.length === 0 ? (
          <Text testID="statistics-empty" className="text-secondary-700">
            Jouez une ou plusieurs parties pour voir des statistiques.
          </Text>
        ) : (
          <>
            <Text className="mb-2 text-sm font-medium text-primary-800">Synthèse par joueur</Text>
            <View className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-3">
              {stats.map((s, i) => (
                <View
                  key={s.key}
                  testID={`statistics-player-row-${i}`}
                  className="mb-4 border-b border-primary-200 pb-4 last:mb-0 last:border-b-0 last:pb-0"
                >
                  <Text className="text-base font-semibold text-primary-900">{s.displayName}</Text>
                  <Text className="mt-1 text-sm text-secondary-800">
                    Parties : {s.gamesPlayed} · Victoires : {s.gamesWon} · Score total : {s.totalScore}{' '}
                    · Moyenne / partie : {formatAvg(s.totalScore, s.gamesPlayed)}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="mb-2 text-sm font-medium text-primary-800">Victoires par joueur</Text>
            <View className="rounded-xl border border-primary-200 bg-white p-3">
              <GlobalWinsBarChart data={winsData} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
