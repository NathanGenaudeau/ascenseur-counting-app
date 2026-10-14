import { Text, View } from 'react-native';

import type { PlayerGlobalStats } from '../domain/globalStats';
import { PODIUM_METALS } from '../theme';

type Column = {
  key: string;
  label: string;
  value: (s: PlayerGlobalStats) => number;
  format?: (v: number) => string;
};

const COLUMNS: Column[] = [
  { key: 'games', label: 'Parties', value: (s) => s.gamesPlayed },
  { key: 'wins', label: 'Vict.', value: (s) => s.gamesWon },
  { key: 'total', label: 'Pts', value: (s) => s.totalScore },
  {
    key: 'avg',
    label: 'Moy.',
    value: (s) => s.averagePoints,
    format: (v) => (Math.round(v * 10) / 10).toLocaleString('fr-FR', { maximumFractionDigits: 1 }),
  },
];

const GOLD = PODIUM_METALS[1].text;

type Props = {
  /** Lignes dans l’ordre d’affichage. */
  stats: PlayerGlobalStats[];
};

/** Stats brutes par joueur ; la meilleure valeur de chaque colonne ressort en or. */
export function PlayerStatsTable({ stats }: Props) {
  const best = COLUMNS.map((c) => Math.max(...stats.map(c.value)));

  return (
    <View testID="player-stats-table" className="overflow-hidden rounded-2xl border border-hairline bg-panel-inset">
      <View className="flex-row items-center border-b border-hairline bg-panel-raised px-3 py-2">
        <Text className="w-6 font-sans-semibold text-xs uppercase text-cosmic-400">#</Text>
        <Text className="min-w-0 flex-1 font-sans-semibold text-xs uppercase text-cosmic-400">Joueur</Text>
        {COLUMNS.map((c) => (
          <Text key={c.key} className="w-14 text-right font-sans-semibold text-xs uppercase text-cosmic-400">
            {c.label}
          </Text>
        ))}
      </View>

      {stats.map((s, i) => (
        <View
          key={s.key}
          testID={`statistics-player-row-${i}`}
          className={`flex-row items-center px-3 py-2.5 ${i % 2 === 1 ? 'bg-panel' : ''} ${
            i < stats.length - 1 ? 'border-b border-hairline/50' : ''
          }`}
        >
          <Text className="w-6 pr-1 font-display text-base text-cosmic-400">{i + 1}</Text>
          <Text className="min-w-0 flex-1 font-sans-semibold text-base text-cosmic-50" numberOfLines={1}>
            {s.displayName}
          </Text>
          {COLUMNS.map((c, ci) => {
            const v = c.value(s);
            const isBest = stats.length > 1 && v === best[ci];
            return (
              <Text
                key={c.key}
                testID={`statistics-player-row-${i}-${c.key}`}
                className={`w-14 text-right text-base ${isBest ? 'font-sans-bold' : 'font-sans text-cosmic-200'}`}
                style={[{ fontVariant: ['tabular-nums'] }, isBest ? { color: GOLD } : null]}
              >
                {c.format ? c.format(v) : v}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}
