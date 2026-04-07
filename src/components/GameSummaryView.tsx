import { Pressable, ScrollView, Text, View } from 'react-native';

import type { CompletedRound } from '../domain/gamePlayState';
import { buildFinalRanking, buildFunStats } from '../domain/gameOutcome';

type Props = {
  playerNames: string[];
  cumulativeScores: number[];
  roundsCompleted: CompletedRound[];
  onNewGame: () => void;
};

export function GameSummaryView({
  playerNames,
  cumulativeScores,
  roundsCompleted,
  onNewGame,
}: Props) {
  const ranking = buildFinalRanking(playerNames, cumulativeScores);
  const fun = buildFunStats(roundsCompleted, playerNames.length);

  return (
    <ScrollView
      testID="game-summary-scroll"
      className="flex-1"
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-4 pb-8">
        <Text
          testID="game-summary-title"
          className="mb-1 text-2xl font-semibold text-neutral-900"
        >
          Partie terminée
        </Text>
        <Text className="mb-6 text-sm text-neutral-600">
          Voici le classement et quelques faits marquants.
        </Text>

        <Text className="mb-2 text-sm font-medium text-neutral-700">Classement final</Text>
        <View className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          {ranking.map((row, i) => (
            <View
              key={`rank-${row.playerIndex}`}
              testID={`summary-ranking-row-${i}`}
              className="mb-2 flex-row items-center justify-between last:mb-0"
            >
              <View className="flex-row items-center gap-2">
                <Text className="w-8 text-base font-semibold text-neutral-600">{row.rank}.</Text>
                <Text className="text-base text-neutral-900">{row.displayName}</Text>
              </View>
              <Text
                testID={`summary-ranking-score-${row.playerIndex}`}
                className="text-base font-semibold text-neutral-900"
              >
                {row.totalScore}
              </Text>
            </View>
          ))}
        </View>

        <Text className="mb-2 text-sm font-medium text-neutral-700">En chiffres</Text>
        <View className="mb-6 rounded-xl border border-neutral-200 bg-white p-3">
          {playerNames.map((name, i) => (
            <Text key={`rw-${i}`} className="mb-1 text-sm text-neutral-800">
              <Text className="font-medium">{name}</Text>
              {' — '}
              {fun.roundWinsByPlayer[i]} fois en tête
            </Text>
          ))}
          {fun.bestSingleRound ? (
            <Text className="mt-3 text-sm text-neutral-800">
              <Text className="font-medium">Meilleure manche : </Text>
              {playerNames[fun.bestSingleRound.playerIndex]} (
              {fun.bestSingleRound.score} pts, manche {fun.bestSingleRound.roundIndex})
            </Text>
          ) : null}
          {fun.worstSingleRound ? (
            <Text className="mt-2 text-sm text-neutral-800">
              <Text className="font-medium">Manche la plus dure : </Text>
              {playerNames[fun.worstSingleRound.playerIndex]} (
              {fun.worstSingleRound.score} pts, manche {fun.worstSingleRound.roundIndex})
            </Text>
          ) : null}
        </View>

        <Pressable
          testID="summary-new-game-button"
          accessibilityRole="button"
          onPress={onNewGame}
          className="rounded-xl bg-neutral-900 py-4"
        >
          <Text className="text-center text-base font-semibold text-white">
            Nouvelle partie
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
