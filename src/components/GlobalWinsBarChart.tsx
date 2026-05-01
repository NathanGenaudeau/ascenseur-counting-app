import { Text, useWindowDimensions, View } from 'react-native';

import type { WinCountDatum } from '../domain/globalStats';

type Props = {
  data: WinCountDatum[];
};

/**
 * Histogramme simple des victoires par joueur (ASC-24).
 */
export function GlobalWinsBarChart({ data }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, width - 48);
  const maxWins = Math.max(1, ...data.map((d) => d.wins));

  if (data.length === 0) {
    return (
      <Text testID="global-wins-chart-empty" className="text-sm text-primary-600">
        Pas assez de données pour un graphique.
      </Text>
    );
  }

  return (
    <View testID="global-wins-chart" className="gap-3">
      {data.map((row, i) => {
        const pct = (row.wins / maxWins) * 100;
        return (
          <View key={`${row.displayName}-${i}`} testID={`global-wins-bar-row-${i}`} className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="max-w-[40%] text-sm text-primary-800" numberOfLines={1}>
                {row.displayName}
              </Text>
              <Text className="text-sm font-medium text-primary-900">{row.wins}</Text>
            </View>
            <View className="h-3 overflow-hidden rounded-full bg-secondary-100" style={{ width: chartWidth }}>
              <View
                className="h-3 rounded-full bg-secondary-700"
                style={{ width: `${pct}%` }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
