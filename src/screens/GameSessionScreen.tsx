import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Text, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameSummaryView } from '../components/GameSummaryView';
import { NumericStepper } from '../components/NumericStepper';
import { ScoreEvolutionChart } from '../components/ScoreEvolutionChart';
import { useGameSession } from '../context/GameSessionContext';
import type { RootTabParamList } from '../navigation/AppNavigator';

/** Borne haute pour les plis à la manche (saisie par pas de 1). */
const MAX_TRICKS_PER_STEP = 20;

export function GameSessionScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const {
    session,
    playState,
    setAnnouncementDraft,
    setTrickDraft,
    goToResultsStep,
    finalizeRound,
    cumulativeScores,
    canGoToResults,
    canFinalizeRound,
    canEndGame,
    endGame,
    clearSession,
  } = useGameSession();

  if (!session || !playState) {
    return (
      <SafeAreaView
        testID="screen-game-session"
        className="flex-1 bg-white"
        edges={['top', 'left', 'right']}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-lg font-medium text-neutral-900">Partie en cours</Text>
          <Text className="mt-2 text-center text-neutral-600">
            Démarrez une partie depuis l’onglet Configuration.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { draft, currentRoundIndex, phase } = playState;
  const { step, announcements, tricks } = draft;

  if (phase === 'finished') {
    return (
      <SafeAreaView
        testID="screen-game-session"
        className="flex-1 bg-white"
        edges={['top', 'left', 'right']}
      >
        <GameSummaryView
          playerNames={session.players.map((p) => p.displayName)}
          cumulativeScores={cumulativeScores}
          roundsCompleted={playState.roundsCompleted}
          onNewGame={() => {
            clearSession();
            navigation.navigate('GameConfiguration');
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="screen-game-session"
      className="flex-1 bg-white"
      edges={['top', 'left', 'right']}
    >
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="px-4 pb-8 pt-2">
          <Text className="mb-4 text-xl font-semibold text-neutral-900">Partie en cours</Text>

          <Text className="mb-2 text-sm font-medium text-neutral-600">Scores cumulés</Text>
          <View className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            {session.players.map((p, i) => (
              <View
                key={`cum-${p.displayName}-${i}`}
                testID={`cumulative-score-row-${i}`}
                className="mb-2 flex-row justify-between last:mb-0"
              >
                <Text className="text-base text-neutral-800">{p.displayName}</Text>
                <Text
                  testID={`cumulative-score-${i}`}
                  className="text-base font-semibold text-neutral-900"
                >
                  {cumulativeScores[i] ?? 0}
                </Text>
              </View>
            ))}
          </View>

          <ScoreEvolutionChart
            roundsCompleted={playState.roundsCompleted}
            playerNames={session.players.map((p) => p.displayName)}
          />

          {canEndGame ? (
            <Pressable
              testID="end-game-button"
              accessibilityRole="button"
              onPress={endGame}
              className="mb-6 rounded-xl border border-neutral-300 bg-white py-3"
            >
              <Text className="text-center text-base font-semibold text-neutral-800">
                Terminer la partie
              </Text>
            </Pressable>
          ) : null}

          <Text className="mb-1 text-lg font-medium text-neutral-900">
            Manche {currentRoundIndex}
          </Text>
          <Text className="mb-4 text-sm text-neutral-500">
            {step === 'announce'
              ? 'Saisissez le nombre de plis annoncé par chaque joueur.'
              : 'Saisissez les plis réalisés. Les annonces restent visibles ci-dessous.'}
          </Text>

          {step === 'results' ? (
            <View
              testID="announce-recap-block"
              className="mb-4 rounded-lg border border-dashed border-neutral-300 bg-white p-3"
            >
              <Text className="mb-2 text-sm font-medium text-neutral-700">Annonces</Text>
              {session.players.map((p, i) => (
                <View key={`ann-${i}`} className="mb-1 flex-row justify-between">
                  <Text className="text-neutral-800">{p.displayName}</Text>
                  <Text testID={`recap-announce-${i}`} className="font-medium text-neutral-900">
                    {announcements[i]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {Array.from({ length: Math.ceil(session.players.length / 2) }, (_, rowIdx) => (
            <View key={`row-${rowIdx}`} className="mb-4 flex-row gap-3">
              {[0, 1].map((col) => {
                const i = rowIdx * 2 + col;
                if (i >= session.players.length) {
                  return <View key={`empty-${col}`} className="flex-1" />;
                }
                const p = session.players[i];
                return (
                  <View key={`slot-${i}`} className="min-w-0 flex-1 rounded-lg border border-neutral-200 p-3">
                    <Text className="mb-2 text-base font-medium text-neutral-900">{p.displayName}</Text>

                    {step === 'announce' ? (
                      <NumericStepper
                        testID={`announce-input-${i}`}
                        value={announcements[i]}
                        onChange={(v) => setAnnouncementDraft(i, v)}
                        max={MAX_TRICKS_PER_STEP}
                      />
                    ) : (
                      <NumericStepper
                        testID={`tricks-input-${i}`}
                        value={tricks[i]}
                        onChange={(v) => setTrickDraft(i, v)}
                        max={MAX_TRICKS_PER_STEP}
                        compareWith={announcements[i]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          {step === 'announce' ? (
            <Pressable
              testID="validate-announcements-button"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canGoToResults }}
              disabled={!canGoToResults}
              onPress={goToResultsStep}
              className={`mb-4 rounded-xl py-4 ${canGoToResults ? 'bg-neutral-900' : 'bg-neutral-300'}`}
            >
              <Text
                className={`text-center text-base font-semibold ${canGoToResults ? 'text-white' : 'text-neutral-500'}`}
              >
                Valider les annonces
              </Text>
            </Pressable>
          ) : (
            <Pressable
              testID="finalize-round-button"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canFinalizeRound }}
              disabled={!canFinalizeRound}
              onPress={finalizeRound}
              className={`mb-4 rounded-xl py-4 ${canFinalizeRound ? 'bg-emerald-700' : 'bg-neutral-300'}`}
            >
              <Text
                className={`text-center text-base font-semibold ${canFinalizeRound ? 'text-white' : 'text-neutral-500'}`}
              >
                Finaliser la manche
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
