import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Text, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameSummaryView } from '../components/GameSummaryView';
import { NumericStepper } from '../components/NumericStepper';
import { ScoreEvolutionChart } from '../components/ScoreEvolutionChart';
import { useGameSession } from '../context/GameSessionContext';
import { cardPhaseForRound, cardsPerHandForRound } from '../domain/cardSequence';
import { displayOrderPlayerIndices } from '../domain/gamePlayState';
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
    backToAnnounceStep,
    finalizeRound,
    startDescent,
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
        </View>
      </SafeAreaView>
    );
  }

  const { draft, currentRoundIndex, phase, descentStartRound } = playState;
  const { step, announcements, tricks } = draft;
  const n = session.players.length;
  const announceOrder = displayOrderPlayerIndices(currentRoundIndex, n);
  const cardsThisRound = cardsPerHandForRound(currentRoundIndex, descentStartRound);
  const cardPhase = cardPhaseForRound(currentRoundIndex, descentStartRound);
  const phaseTitle = cardPhase === 'montée' ? 'Montée' : 'Descente';
  const showDescendButton = descentStartRound === null && currentRoundIndex >= 2;

  const scoreRowsSorted = session.players
    .map((p, playerIndex) => ({
      playerIndex,
      displayName: p.displayName,
      score: cumulativeScores[playerIndex] ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.playerIndex - b.playerIndex;
    });

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

          <View
            testID="card-sequence-banner"
            className="mb-4 flex-row items-center justify-between gap-2"
          >
            <Text className="min-w-0 flex-1 text-lg font-medium text-neutral-900">
              Manche {currentRoundIndex} - {cardsThisRound} carte{cardsThisRound > 1 ? 's' : ''} - {phaseTitle}
            </Text>
            {showDescendButton ? (
              <Pressable
                testID="start-descent-button"
                accessibilityRole="button"
                accessibilityLabel="Descendre"
                onPress={startDescent}
                className="shrink-0 rounded-md border border-neutral-400 bg-white px-2.5 py-1.5 active:bg-neutral-100"
              >
                <Text className="text-xs font-semibold text-neutral-800">Descendre</Text>
              </Pressable>
            ) : null}
          </View>

          {Array.from({ length: Math.ceil(n / 2) }, (_, rowIdx) => {
            const lastRowIdx = Math.ceil(n / 2) - 1;
            const isOddLastRow = n % 2 === 1 && rowIdx === lastRowIdx;

            if (isOddLastRow) {
              const slot = rowIdx * 2;
              const i = announceOrder[slot]!;
              const p = session.players[i];
              return (
                <View key={`row-${rowIdx}`} className="mb-4 flex-row justify-center">
                  <View className="min-w-0 w-[48%] rounded-lg border border-neutral-200 p-3">
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
                </View>
              );
            }

            return (
              <View key={`row-${rowIdx}`} className="mb-4 flex-row gap-3">
                {[0, 1].map((col) => {
                  const slot = rowIdx * 2 + col;
                  const i = announceOrder[slot]!;
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
            );
          })}

          {canEndGame ? (
            <Pressable
              testID="end-game-button"
              accessibilityRole="button"
              onPress={endGame}
              className="mb-3 rounded-xl border border-neutral-300 bg-white py-3"
            >
              <Text className="text-center text-base font-semibold text-neutral-800">
                Terminer la partie
              </Text>
            </Pressable>
          ) : null}

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
            <>
              <Pressable
                testID="back-to-announce-button"
                accessibilityRole="button"
                onPress={backToAnnounceStep}
                className="mb-3 rounded-xl border border-neutral-300 bg-white py-3"
              >
                <Text className="text-center text-base font-semibold text-neutral-800">
                  Modifier les annonces
                </Text>
              </Pressable>
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
            </>
          )}

          <ScoreEvolutionChart
            compact
            roundsCompleted={playState.roundsCompleted}
            playerNames={session.players.map((p) => p.displayName)}
          />

          <View className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            {scoreRowsSorted.map(({ playerIndex, displayName, score }) => (
              <View
                key={`cum-${displayName}-${playerIndex}`}
                testID={`cumulative-score-row-${playerIndex}`}
                className="mb-2 flex-row justify-between last:mb-0"
              >
                <Text className="text-base text-neutral-800">{displayName}</Text>
                <Text
                  testID={`cumulative-score-${playerIndex}`}
                  className="text-base font-semibold text-neutral-900"
                >
                  {score}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
