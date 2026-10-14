import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GameSummaryView } from '../components/GameSummaryView';
import { NumericStepper, type StepperTone } from '../components/NumericStepper';
import { ScoreEvolutionChart } from '../components/ScoreEvolutionChart';
import { ScreenShell } from '../components/ScreenShell';
import { StreakBackdrop } from '../components/StreakBackdrop';
import { SyncStatusBanner } from '../components/SyncStatusBanner';
import { useGameSession } from '../context/GameSessionContext';
import { cardPhaseForRound, cardsPerHandForRound } from '../domain/cardSequence';
import { currentBetFailureStreak, currentBetSuccessStreak } from '../domain/gameOutcome';
import { displayOrderPlayerIndices } from '../domain/gamePlayState';
import type { RootTabParamList } from '../navigation/AppNavigator';

const STREAK_BADGE_MIN = 3;

/** Bords de carte givrés (série ratée) ou embrasés (série réussie), qui avancent vers le centre avec la série. */
function PlayerStreakBackdrop({
  playerIndex,
  streak,
  lossStreak,
}: {
  playerIndex: number;
  streak: number;
  lossStreak: number;
}) {
  if (streak >= STREAK_BADGE_MIN) {
    return (
      <StreakBackdrop
        testID={`player-streak-backdrop-${playerIndex}`}
        variant="fire"
        count={streak}
        seed={playerIndex}
      />
    );
  }
  if (lossStreak >= STREAK_BADGE_MIN) {
    return (
      <StreakBackdrop
        testID={`player-loss-streak-backdrop-${playerIndex}`}
        variant="ice"
        count={lossStreak}
        seed={playerIndex}
      />
    );
  }
  return null;
}

function PlayerNameWithStreakBadge({
  playerIndex,
  displayName,
  streak,
  lossStreak,
  nameTextClassName,
}: {
  playerIndex: number;
  displayName: string;
  streak: number;
  lossStreak: number;
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
          <Text className="font-display text-sm text-star-bright">{streak}🔥</Text>
        </View>
      ) : null}
      {lossStreak >= STREAK_BADGE_MIN ? (
        <View
          testID={`player-loss-streak-badge-${playerIndex}`}
          accessibilityLabel={`Série de ${lossStreak} paris ratés`}
          className="shrink-0 rounded-full border border-nova/50 bg-nova/15 px-1.5 py-0.5"
        >
          <Text className="font-display text-sm text-nova">{lossStreak}❄️</Text>
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

const playerCardClass = 'min-w-0 overflow-hidden rounded-xl border border-hairline bg-panel p-3';
/**
 * Liseré rose à gauche, remplacé par l'effet de bord quand le joueur est en série.
 * Barre posée dans la carte plutôt que `border-l-*` : sur Android, changer l'épaisseur d'une
 * bordure d'une vue arrondie en `overflow-hidden` pouvait fausser son découpage et masquer
 * toute la carte. Le style de la carte reste donc identique, série ou non.
 */
const playerCardAccentBarClass = 'absolute bottom-0 left-0 top-0 w-0.5 bg-star/50';

function streakTone(streak: number, lossStreak: number): StepperTone {
  if (streak >= STREAK_BADGE_MIN) return 'fire';
  if (lossStreak >= STREAK_BADGE_MIN) return 'ice';
  return 'default';
}

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
    syncStatus,
    unsyncedRounds,
    hasPendingSync,
    retrySync,
  } = useGameSession();

  const playerStreaks = useMemo(() => {
    if (!session || !playState) {
      return [];
    }
    return session.players.map((_, playerIndex) =>
      currentBetSuccessStreak(playState.roundsCompleted, playerIndex),
    );
  }, [session, playState]);

  const playerLossStreaks = useMemo(() => {
    if (!session || !playState) {
      return [];
    }
    return session.players.map((_, playerIndex) =>
      currentBetFailureStreak(playState.roundsCompleted, playerIndex),
    );
  }, [session, playState]);

  const [finalizeFlashOpacity] = useState(() => new Animated.Value(0));

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
          <Text
            className="font-sans-semibold text-xl text-star"
            style={{ textAlign: 'center', width: '100%' }}
          >
            Partie en cours
          </Text>
        </View>
      </ScreenShell>
    );
  }

  const syncBanner =
    syncStatus === 'error' ? (
      <SyncStatusBanner unsyncedRounds={unsyncedRounds} onRetry={retrySync} />
    ) : null;

  const startNewGame = () => {
    clearSession();
    navigation.navigate('GameConfiguration');
  };

  const confirmNewGame = () => {
    if (!hasPendingSync) {
      startNewGame();
      return;
    }
    Alert.alert(
      'Partie non enregistrée',
      'Une partie des données n’a pas encore été envoyée au serveur. Elles seront perdues si vous commencez une nouvelle partie.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réessayer l’envoi', onPress: retrySync },
        { text: 'Abandonner', style: 'destructive', onPress: startNewGame },
      ],
    );
  };

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
        {syncBanner}
        <GameSummaryView
          playerNames={session.players.map((p) => p.displayName)}
          cumulativeScores={cumulativeScores}
          roundsCompleted={playState.roundsCompleted}
          onNewGame={confirmNewGame}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell testID="screen-game-session">
      {syncBanner}
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

            {/*
            Un seul conteneur, une clé par joueur : quand l'ordre tourne après une manche, les cartes
            se déplacent au lieu d'être détruites puis recréées dans une autre ligne (ce qui faisait
            parfois disparaître des cartes en série sur iOS). La dernière carte seule est centrée.
          */}
            <View
              className="mb-4 flex-row flex-wrap justify-center"
              style={{ columnGap: 12, rowGap: 16 }}
            >
              {announceOrder.map((i) => {
                const p = session.players[i];
                const streak = playerStreaks[i] ?? 0;
                const lossStreak = playerLossStreaks[i] ?? 0;
                const tone = streakTone(streak, lossStreak);
                return (
                  <View
                    key={`player-card-${i}`}
                    testID={`player-card-${i}`}
                    className={playerCardClass}
                    style={{ width: '48%' }}
                  >
                    {tone === 'default' ? (
                      <View
                        testID={`player-card-accent-${i}`}
                        pointerEvents="none"
                        className={playerCardAccentBarClass}
                      />
                    ) : null}
                    <PlayerStreakBackdrop playerIndex={i} streak={streak} lossStreak={lossStreak} />
                    <PlayerNameWithStreakBadge
                      playerIndex={i}
                      displayName={p.displayName}
                      streak={streak}
                      lossStreak={lossStreak}
                      nameTextClassName="font-sans-medium text-base text-cosmic-50"
                    />

                    {step === 'announce' ? (
                      <NumericStepper
                        testID={`announce-input-${i}`}
                        value={announcements[i]}
                        onChange={(v) => setAnnouncementDraft(i, v)}
                        max={MAX_TRICKS_PER_STEP}
                        tone={tone}
                      />
                    ) : (
                      <NumericStepper
                        testID={`tricks-input-${i}`}
                        value={tricks[i]}
                        onChange={(v) => setTrickDraft(i, v)}
                        max={MAX_TRICKS_PER_STEP}
                        tone={tone}
                        compareWith={announcements[i]}
                      />
                    )}
                  </View>
                );
              })}
            </View>

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
                  className="mb-2 flex-row items-center justify-between last:mb-0"
                >
                  <Text className="font-sans text-base text-cosmic-200">{displayName}</Text>
                  {/* Largeur fixe + centré : Bangers penche à droite et iOS coupe ce qui dépasse de la boîte du texte. */}
                  <Text
                    testID={`cumulative-score-${playerIndex}`}
                    className={`w-14 text-center font-display text-lg ${
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
            StyleSheet.absoluteFill,
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
