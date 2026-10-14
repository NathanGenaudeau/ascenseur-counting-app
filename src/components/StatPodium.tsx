import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { LeaderboardEntry } from '../domain/globalStats';
import { PODIUM_METALS } from '../theme';

import { RadialImpactGraphic } from './RadialImpactGraphic';

/** Hauteur de marche par rang : le 1er plus haut, puis le 2e, puis le 3e. */
const STEP_HEIGHT: Record<1 | 2 | 3, number> = { 1: 88, 2: 62, 3: 44 };

type Props = {
  title: string;
  description: string;
  /** Trois premiers au plus, dans l’ordre du classement. */
  podium: LeaderboardEntry[];
  formatValue: (value: number) => string;
  testID?: string;
};

function neonGlow(color: string, radius: number) {
  return {
    textShadowColor: color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: radius,
  };
}

function PodiumSlot({
  entry,
  formatValue,
  testID,
}: {
  entry: LeaderboardEntry | undefined;
  formatValue: (value: number) => string;
  testID: string;
}) {
  if (!entry) return <View className="flex-1" />;
  const rank = Math.min(3, Math.max(1, entry.rank)) as 1 | 2 | 3;
  const metal = PODIUM_METALS[rank];

  return (
    <View testID={testID} className="min-w-0 flex-1 items-center">
      {rank === 1 ? (
        <View className="h-7 items-center justify-center">
          <View pointerEvents="none" style={{ position: 'absolute', opacity: 0.85 }}>
            <RadialImpactGraphic size={58} />
          </View>
          <Crown color={metal.base} size={20} strokeWidth={2.4} />
        </View>
      ) : null}
      <Text
        className="mt-1 w-full text-center font-sans-semibold text-sm text-cosmic-100"
        numberOfLines={1}
      >
        {entry.displayName}
      </Text>
      {/* Pleine largeur : Bangers penche à droite et iOS coupe ce qui dépasse de la boîte du texte. */}
      <Text
        testID={`${testID}-value`}
        className="mb-2 w-full text-center font-display text-lg"
        style={[{ color: metal.text }, neonGlow(metal.glow, 8)]}
        numberOfLines={1}
      >
        {formatValue(entry.value)}
      </Text>
      {/* Marche : panneau sombre de l'app, accent néon du métal, légère inclinaison comme les boutons. */}
      <View
        className="w-full overflow-hidden rounded-t-lg border border-b-0 bg-panel-raised"
        style={{
          height: STEP_HEIGHT[rank],
          borderColor: metal.tint,
          transform: [{ skewX: '-2deg' }],
        }}
      >
        <LinearGradient
          colors={[metal.tint, 'rgba(0, 0, 0, 0)']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ height: 3, backgroundColor: metal.base }} />
        <View className="flex-1 items-center justify-center">
          <Text
            className="w-full text-center font-display text-4xl"
            style={[{ color: metal.text }, neonGlow(metal.glow, 12)]}
          >
            {rank}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Podium visuel : 1er au centre et plus haut, 2e à gauche, 3e à droite. */
export function StatPodium({ title, description, podium, formatValue, testID }: Props) {
  const [first, second, third] = podium;
  const id = testID ?? 'stat-podium';

  return (
    <View
      testID={id}
      className="mb-5 overflow-hidden rounded-xl border border-hairline bg-panel px-3 pt-3"
    >
      <Text className="pr-1 font-display text-xl text-star">{title}</Text>
      <Text className="mb-2 font-sans text-xs text-cosmic-300">{description}</Text>
      <View className="flex-row items-end gap-2">
        <PodiumSlot entry={second} formatValue={formatValue} testID={`${id}-place-2`} />
        <PodiumSlot entry={first} formatValue={formatValue} testID={`${id}-place-1`} />
        <PodiumSlot entry={third} formatValue={formatValue} testID={`${id}-place-3`} />
      </View>
      {/* Sol du podium : trait néon rose, comme les accents de l'app. */}
      <View className="-mx-3 h-0.5 bg-star/40" />
    </View>
  );
}
