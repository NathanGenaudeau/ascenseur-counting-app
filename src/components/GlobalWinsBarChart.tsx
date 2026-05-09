import { LinearGradient } from 'expo-linear-gradient';
import { Text, useWindowDimensions, View } from 'react-native';

import type { WinCountDatum } from '../domain/globalStats';
import { getPlayerChartColor } from '../utils/playerChartColors';

type Props = {
  data: WinCountDatum[];
};

/** Mélange une couleur hex avec du violet pour créer un dégradé Arcane. */
function gradientEnd(hex: string): string {
  return '#7209b7';
}

/**
 * Histogramme horizontal avec barres en dégradé rose→violet (style Hextech).
 */
export function GlobalWinsBarChart({ data }: Props) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(280, width - 48);
  const maxWins = Math.max(1, ...data.map((d) => d.wins));

  if (data.length === 0) {
    return (
      <Text testID="global-wins-chart-empty" className="font-sans text-sm text-cosmic-400">
        Pas assez de données pour un graphique.
      </Text>
    );
  }

  return (
    <View testID="global-wins-chart" className="gap-3">
      {data.map((row, i) => {
        const pct = (row.wins / maxWins) * 100;
        const fill = getPlayerChartColor(i);
        const barWidth = Math.max(8, (pct / 100) * chartWidth);
        return (
          <View key={`${row.displayName}-${i}`} testID={`global-wins-bar-row-${i}`} className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="max-w-[40%] font-sans text-sm text-cosmic-200" numberOfLines={1}>
                {row.displayName}
              </Text>
              <Text className="font-display text-base text-cosmic-50">{row.wins}</Text>
            </View>
            <View
              className="h-3 overflow-hidden rounded-full bg-cosmic-700"
              style={{ width: chartWidth }}
            >
              <LinearGradient
                colors={[fill, gradientEnd(fill)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: barWidth, height: 12, borderRadius: 9999 }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
