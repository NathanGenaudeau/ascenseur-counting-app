import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GameSummaryView } from '../components/GameSummaryView';
import { NumericStepper } from '../components/NumericStepper';
import { ScoreEvolutionChart } from '../components/ScoreEvolutionChart';
import { ScreenShell } from '../components/ScreenShell';
import { useGameSession } from '../context/GameSessionContext';
import { cardPhaseForRound, cardsPerHandForRound } from '../domain/cardSequence';
import { currentBetSuccessStreak } from '../domain/gameOutcome';
import { displayOrderPlayerIndices } from '../domain/gamePlayState';
import type { RootTabParamList } from '../navigation/AppNavigator';

const STREAK_BADGE_MIN = 3;

function PlayerNameWithStreakBadge({
  playerIndex,
  displayName,
  streak,
  nameTextClassName,
}: {
  playerIndex: number;
  displayName: string;
  streak: number;
  nameTextClassName: string;
}) {
  return (
    <View className="mb-2 flex-row items-center gap-1.5">
      {streak >= STREAK_BADGE_MIN ? (
        <View
          testID={`player-streak-badge-${playerIndex}`}
          accessibilityLabel={`Série de ${streak} paris réussis`}
          className="shrink-0 rounded-full border border-star/50 bg-star/15 px-1.5 py-0.5"
        >
                <Text className="font-display text-sm text-star-bright">
                  {streak}🔥
                </Text>
        </View>
      ) : null}
      <Text className={`min-w-0 flex-1 ${nameTextClassName}`} numberOfLines={1}>
        {displayName}
      </Text>
    </View>
  );
}

/** Borne haute pour les plis à la manche (saisie par pas de 1). */
const MAX_TRICKS_PER_STEP = 20;

const playerCardClass = 'min-w-0 rounded-xl border border-hairline border-l-2 border-l-star/50 bg-panel p-3';

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

  const playerStreaks = useMemo(() => {
    if (!session || !playState) {
      return [];
    }
    return session.players.map((_, playerIndex) =>
      currentBetSuccessStreak(playState.roundsCompleted, playerIndex),
    );
  }, [session, playState]);

  const finalizeFlashOpacity = useRef(new Animated.Value(0)).current;

  const triggerFinalizeImpactFlash = () => {
    finalizeFlashOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(finalizeFlashOpacity, { toValue: 1, duration: 42, useNativeDriver: true }),
      Animated.timing(finalizeFlashOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleFinalizeRound = () => {
    triggerFinalizeImpactFlash();
    finalizeRound();
  };

  if (!session || !playState) {
    return (
      <ScreenShell testID="screen-game-session">
        <View className="flex-1 items-center justify-center px-4">
          <Text className="font-sans-semibold text-xl text-star" style={{ textAlign: 'center', width: '100%' }}>
            Partie en cours
          </Text>
        </View>
      </ScreenShell>
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
      <ScreenShell testID="screen-game-session">
        <GameSummaryView
          playerNames={session.players.map((p) => p.displayName)}
          cumulativeScores={cumulativeScores}
          roundsCompleted={playState.roundsCompleted}
          onNewGame={() => {
            clearSession();
            navigation.navigate('GameConfiguration');
          }}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell testID="screen-game-session">
      <View className="flex-1">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="px-4 pb-8 pt-2">
          <View
            testID="card-sequence-banner"
            className="mb-4 flex-row items-center justify-between gap-2"
          >
            <Text className="min-w-0 flex-1 font-display text-xl text-star-bright">
              Manche {currentRoundIndex} - {cardsThisRound} carte{cardsThisRound > 1 ? 's' : ''} -{' '}
              {phaseTitle}
            </Text>
            {showDescendButton ? (
              <Pressable
                testID="start-descent-button"
                accessibilityRole="button"
                accessibilityLabel="Descendre"
                onPress={startDescent}
                className="shrink-0 rounded-lg border border-nova/60 bg-panel-raised px-2.5 py-1.5 active:opacity-90"
                style={{ transform: [{ skewX: '-2deg' }] }}
              >
                <Text className="font-display text-sm text-nova">Descendre</Text>
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
                  <View className={`min-w-0 w-[48%] ${playerCardClass}`}>
                    <PlayerNameWithStreakBadge
                      playerIndex={i}
                      displayName={p.displayName}
                      streak={playerStreaks[i] ?? 0}
                      nameTextClassName="font-sans-medium text-base text-cosmic-50"
                    />

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
                    <View key={`slot-${i}`} className={`min-w-0 flex-1 ${playerCardClass}`}>
                      <PlayerNameWithStreakBadge
                        playerIndex={i}
                        displayName={p.displayName}
                        streak={playerStreaks[i] ?? 0}
                        nameTextClassName="font-sans-medium text-base text-cosmic-50"
                      />

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
              className="mb-3 rounded-xl border border-nova/60 bg-panel-raised py-3 active:opacity-90"
              style={{ transform: [{ skewX: '-2deg' }] }}
            >
              <Text className="text-center font-display text-lg text-nova">
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
              className={`mb-4 rounded-xl py-4 ${canGoToResults ? 'bg-star' : 'bg-cosmic-600'}`}
              style={{ transform: [{ skewX: '-2deg' }] }}
            >
              <Text
                className={`text-center font-display text-lg ${
                  canGoToResults ? 'text-cosmic-50' : 'text-cosmic-500'
                }`}
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
                className="mb-3 rounded-xl border border-nova/60 bg-panel-raised py-3 active:opacity-90"
                style={{ transform: [{ skewX: '-2deg' }] }}
              >
                <Text className="text-center font-display text-lg text-nova">
                  Modifier les annonces
                </Text>
              </Pressable>
              <Pressable
                testID="finalize-round-button"
                accessibilityRole="button"
                accessibilityState={{ disabled: !canFinalizeRound }}
                disabled={!canFinalizeRound}
                onPress={handleFinalizeRound}
                className={`mb-4 rounded-xl py-4 ${canFinalizeRound ? 'bg-star-dim' : 'bg-cosmic-600'}`}
                style={{ transform: [{ skewX: '-2deg' }] }}
              >
                <Text
                  className={`text-center font-display text-lg ${
                    canFinalizeRound ? 'text-cosmic-50' : 'text-cosmic-500'
                  }`}
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

          <View className="mb-6 rounded-xl border border-hairline bg-panel-inset p-3">
            {scoreRowsSorted.map(({ playerIndex, displayName, score }) => (
              <View
                key={`cum-${displayName}-${playerIndex}`}
                testID={`cumulative-score-row-${playerIndex}`}
                className="mb-2 flex-row justify-between last:mb-0"
              >
                <Text className="font-sans text-base text-cosmic-200">{displayName}</Text>
                <Text
                  testID={`cumulative-score-${playerIndex}`}
                  className={`font-display text-lg ${
                    score < 0 ? 'text-red-400 line-through' : 'text-cosmic-50'
                  }`}
                >
                  {score}
                </Text>
              </View>
            ))}
          </View>
        </View>
        </ScrollView>
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            StyleSheet.absoluteFillObject,
            {
              zIndex: 8,
              backgroundColor: 'rgba(255, 45, 120, 0.09)',
              opacity: finalizeFlashOpacity,
            },
          ]}
        />
      </View>
    </ScreenShell>
  );
}
