import { Pressable, ScrollView, Text, View } from 'react-native';

import type { CompletedRound } from '../domain/gamePlayState';
import { buildBettingHighlights, buildFinalRanking } from '../domain/gameOutcome';

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
    box: 'border-primary-200 bg-primary-50',
    headline: 'text-primary-800',
    subline: 'text-primary-900/80',
  },
  biggestDrop: {
    box: 'border-rose-200 bg-rose-50',
    headline: 'text-rose-700',
    subline: 'text-rose-900/80',
  },
  streakBest: {
    box: 'border-secondary-200 bg-secondary-50',
    headline: 'text-secondary-800',
    subline: 'text-secondary-950/80',
  },
  mostZeroBets: {
    box: 'border-secondary-300 bg-secondary-100',
    headline: 'text-secondary-900',
    subline: 'text-secondary-950/80',
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
        <Text className={`text-center text-3xl font-bold leading-tight ${s.headline}`}>
          {headline}
        </Text>
      </View>
      <Text className={`text-center text-xs leading-snug ${s.subline}`}>{subline}</Text>
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
    betBest !== null &&
    biggestDrop !== null &&
    streakBest !== null &&
    mostZeroBets !== null;

  const name = (i: number) => playerNames[i] ?? '?';

  const formatNamesList = (names: string[]) => {
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} et ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
  };

  const namesForIndices = (indices: number[]) =>
    formatNamesList(indices.map((i) => name(i)));

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
        <Text
          testID="game-summary-title"
          className="mb-1 text-2xl font-semibold text-primary-900"
        >
          Partie terminée
        </Text>
        <Text className="mb-2 text-sm font-medium text-primary-800/90">Classement final</Text>
        <View className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-3">
          {ranking.map((row, i) => (
            <View
              key={`rank-${row.playerIndex}`}
              testID={`summary-ranking-row-${i}`}
              className="mb-2 flex-row items-center justify-between last:mb-0"
            >
              <View className="flex-row items-center gap-2">
                <Text className="w-8 text-base font-semibold text-primary-600">{row.rank}.</Text>
                <Text className="text-base text-primary-950">{row.displayName}</Text>
              </View>
              <Text
                testID={`summary-ranking-score-${row.playerIndex}`}
                className="text-base font-semibold text-primary-900"
              >
                {row.totalScore}
              </Text>
            </View>
          ))}
        </View>

        {showFigures ? (
          <>
            <Text className="mb-2 text-sm font-medium text-primary-800/90">En chiffres</Text>
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
          className="rounded-xl bg-primary-700 py-4 active:bg-primary-800"
        >
          <Text className="text-center text-base font-semibold text-white">
            Nouvelle partie
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
