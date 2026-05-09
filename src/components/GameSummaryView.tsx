import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';

import type { CompletedRound } from '../domain/gamePlayState';
import { buildBettingHighlights, buildFinalRanking } from '../domain/gameOutcome';

import { RadialImpactGraphic } from './RadialImpactGraphic';
import { ScribbleSeparator } from './ScribbleSeparator';

type Props = {
  playerNames: string[];
  cumulativeScores: number[];
  roundsCompleted: CompletedRound[];
  onNewGame: () => void;
};

type StatTileVariant = 'betBest' | 'biggestDrop' | 'streakBest' | 'mostZeroBets';

const statTileStyles: Record<
  StatTileVariant,
  { box: string; headline: string; subline: string }
> = {
  betBest: {
    box: 'border-star-dim/40 bg-star-deep/25',
    headline: 'text-star-bright',
    subline: 'text-cosmic-200',
  },
  biggestDrop: {
    box: 'border-red-400/30 bg-red-950/35',
    headline: 'text-red-300',
    subline: 'text-red-200/90',
  },
  streakBest: {
    box: 'border-nova-muted/40 bg-panel-raised',
    headline: 'text-nova',
    subline: 'text-cosmic-200',
  },
  mostZeroBets: {
    box: 'border-cosmic-500/40 bg-panel-inset',
    headline: 'text-cosmic-100',
    subline: 'text-cosmic-300',
  },
};

function SummaryStatTile({
  headline,
  subline,
  testID,
  variant,
}: {
  headline: string;
  subline: string;
  testID?: string;
  variant: StatTileVariant;
}) {
  const s = statTileStyles[variant];
  return (
    <View testID={testID} className={`min-h-[120px] flex-1 rounded-xl border p-3 ${s.box}`}>
      <View className="flex-1 items-center justify-center">
        <Text className={`text-center font-display-bold text-3xl leading-tight ${s.headline}`}>
          {headline}
        </Text>
      </View>
      <Text className={`text-center font-sans text-sm leading-snug ${s.subline}`}>{subline}</Text>
    </View>
  );
}

export function GameSummaryView({
  playerNames,
  cumulativeScores,
  roundsCompleted,
  onNewGame,
}: Props) {
  const ranking = buildFinalRanking(playerNames, cumulativeScores);
  const betting = buildBettingHighlights(roundsCompleted, playerNames.length);
  const betBest = betting.bestSuccessRate;
  const biggestDrop = betting.biggestDrop;
  const streakBest = betting.bestStreak;
  const mostZeroBets = betting.mostZeroBets;
  const showFigures =
    betBest !== null && biggestDrop !== null && streakBest !== null && mostZeroBets !== null;

  const titleScale = useRef(new Animated.Value(1)).current;
  const titleBurstOpacity = useRef(new Animated.Value(0)).current;
  const titleBurstScale = useRef(new Animated.Value(0.65)).current;

  useEffect(() => {
    titleBurstOpacity.setValue(0.75);
    titleBurstScale.setValue(0.65);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(titleScale, { toValue: 1.045, duration: 85, useNativeDriver: true }),
        Animated.spring(titleScale, { toValue: 1, friction: 6.5, tension: 220, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(titleBurstScale, { toValue: 1.12, duration: 110, useNativeDriver: true }),
        Animated.timing(titleBurstOpacity, { toValue: 0, duration: 340, delay: 20, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const name = (i: number) => playerNames[i] ?? '?';

  const formatNamesList = (names: string[]) => {
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} et ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
  };

  const namesForIndices = (indices: number[]) => formatNamesList(indices.map((i) => name(i)));

  const streakSubline = (playerIndices: number[], streak: number) => {
    const ns = namesForIndices(playerIndices);
    const plural = playerIndices.length > 1;
    if (streak <= 0) {
      return `${ns} n'${plural ? 'ont' : 'a'} pas enchaîné deux paris réussis`;
    }
    const m = streak > 1 ? 'manches' : 'manche';
    return `${ns} ${plural ? 'ont' : 'a'} réussi ${plural ? 'leurs' : 'ses'} paris ${streak} ${m} d'affilée`;
  };

  const betRateSubline = (playerIndices: number[], percent: number) => {
    const ns = namesForIndices(playerIndices);
    const plural = playerIndices.length > 1;
    return `${ns} ${plural ? 'ont' : 'a'} réussi ${percent}% de ${plural ? 'leurs' : 'ses'} paris`;
  };

  const dropSubline = (playerIndices: number[], lossPoints: number, roundCount: number) => {
    const ns = namesForIndices(playerIndices);
    const plural = playerIndices.length > 1;
    if (lossPoints <= 0 || roundCount <= 0) {
      return `${ns} n'${plural ? 'ont' : 'a'} pas eu de chute sur une série de manches`;
    }
    const m = roundCount > 1 ? 'manches consécutives' : 'manche consécutive';
    return `${ns} ${plural ? 'ont' : 'a'} perdu ${lossPoints} points en ${roundCount} ${m}`;
  };

  const zeroBetsSubline = (playerIndices: number[], count: number) => {
    const ns = namesForIndices(playerIndices);
    const plural = playerIndices.length > 1;
    if (count <= 0) {
      return `${ns} n'${plural ? 'ont' : 'a'} jamais annoncé 0 au pari`;
    }
    return `${ns} ${plural ? 'ont' : 'a'} annoncé 0 au pari ${count} fois`;
  };

  return (
    <ScrollView
      testID="game-summary-scroll"
      className="flex-1"
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-4 pb-8">
        <View className="relative mb-1 min-h-[44px] justify-center pt-2">
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: '50%',
              marginLeft: -52,
              top: -6,
              opacity: titleBurstOpacity,
              transform: [{ scale: titleBurstScale }],
            }}
          >
            <RadialImpactGraphic size={104} />
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: titleScale }] }}>
            <Text testID="game-summary-title" className="font-display-bold text-3xl text-star">
              Partie terminée
            </Text>
          </Animated.View>
        </View>
        <View className="mb-2 flex-row items-center gap-2">
          <ScribbleSeparator accent="star" />
          <Text className="font-sans-medium text-sm text-cosmic-200">Classement final</Text>
        </View>
        <View className="mb-6 rounded-xl border border-hairline bg-panel-inset p-3">
          {ranking.map((row, i) => (
            <View
              key={`rank-${row.playerIndex}`}
              testID={`summary-ranking-row-${i}`}
              className="mb-2 flex-row items-center justify-between last:mb-0"
            >
              <View className="flex-row items-center gap-2">
                {row.rank === 1 ? (
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-star">
                    <Text className="font-display text-sm text-cosmic-50">★</Text>
                  </View>
                ) : (
                  <Text className="w-7 text-center font-display text-base text-cosmic-500">{row.rank}.</Text>
                )}
                <Text className={`font-sans text-base ${row.rank === 1 ? 'font-sans-semibold text-star-bright' : 'text-cosmic-50'}`}>
                  {row.displayName}
                </Text>
              </View>
              <Text
                testID={`summary-ranking-score-${row.playerIndex}`}
                className={`font-display text-lg ${
                  row.totalScore < 0 ? 'text-red-400 line-through' : row.rank === 1 ? 'text-star-bright' : 'text-cosmic-50'
                }`}
              >
                {row.totalScore}
              </Text>
            </View>
          ))}
        </View>

        {showFigures ? (
          <>
            <View className="mb-2 flex-row items-center gap-2">
              <ScribbleSeparator accent="nova" />
              <Text className="font-sans-medium text-sm text-cosmic-200">En chiffres</Text>
            </View>
            <View className="mb-3 flex-row gap-3">
              <SummaryStatTile
                variant="betBest"
                testID="summary-tile-bet-best"
                headline={`${betBest.percent}%`}
                subline={betRateSubline(betBest.playerIndices, betBest.percent)}
              />
              <SummaryStatTile
                variant="biggestDrop"
                testID="summary-tile-biggest-drop"
                headline={biggestDrop.lossPoints > 0 ? `-${biggestDrop.lossPoints}` : '0'}
                subline={dropSubline(
                  biggestDrop.playerIndices,
                  biggestDrop.lossPoints,
                  biggestDrop.roundCount,
                )}
              />
            </View>
            <View className="mb-6 flex-row gap-3">
              <SummaryStatTile
                variant="streakBest"
                testID="summary-tile-streak-best"
                headline={streakBest.streak > 0 ? `${streakBest.streak} 🔥` : '0 🔥'}
                subline={streakSubline(streakBest.playerIndices, streakBest.streak)}
              />
              <SummaryStatTile
                variant="mostZeroBets"
                testID="summary-tile-most-zero-bets"
                headline={`${mostZeroBets.count}`}
                subline={zeroBetsSubline(mostZeroBets.playerIndices, mostZeroBets.count)}
              />
            </View>
          </>
        ) : null}

        <Pressable
          testID="summary-new-game-button"
          accessibilityRole="button"
          onPress={onNewGame}
          className="rounded-xl bg-star py-4 active:bg-star-dim"
          style={{ transform: [{ skewX: '-2deg' }] }}
        >
          <Text className="text-center font-display text-xl text-cosmic-50">
            Nouvelle partie
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
