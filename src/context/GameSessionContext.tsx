import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import type { GameDraftSettings } from '../domain/gameConfigurationDraft';
import { minRoundIndexToAllowEndGame } from '../domain/cardSequence';
import {
  allSlotsFilled,
  announcementsTotalForbiddenForRound,
  gamePlayReducer,
  isBetweenRounds,
  tricksDraftTotalMatchesCardsDealt,
  type GamePlayState,
  type PlayAction,
} from '../domain/gamePlayState';
import { scoreThresholdSoundsToPlay } from '../domain/scoreThresholdEvents';
import { computeCumulativeScores } from '../domain/scoring';
import { finishRemoteGame, persistRemoteRound } from '../services/gameSessionSupabase';
import { playScoreThresholdSounds } from '../services/scoreThresholdSoundPlayer';

export type ActiveSessionPlayer = {
  displayName: string;
  /** Toujours défini après démarrage via Supabase. */
  playerId?: string;
};

export type ActiveGameSession = {
  players: ActiveSessionPlayer[];
  settings: GameDraftSettings;
  /** Partie persistée côté Supabase. */
  supabaseGameId?: string;
};

type GameSessionContextValue = {
  session: ActiveGameSession | null;
  setSession: (s: ActiveGameSession | null) => void;
  clearSession: () => void;
  playState: GamePlayState | null;
  setAnnouncementDraft: (playerIndex: number, value: number) => void;
  setTrickDraft: (playerIndex: number, value: number) => void;
  goToResultsStep: () => void;
  backToAnnounceStep: () => void;
  finalizeRound: () => void;
  startDescent: () => void;
  cumulativeScores: number[];
  canGoToResults: boolean;
  canFinalizeRound: boolean;
  canEndGame: boolean;
  endGame: () => void;
};

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<ActiveGameSession | null>(null);
  const [playState, playDispatch] = useReducer(
    (s: GamePlayState | null, a: PlayAction) => gamePlayReducer(s, a),
    null,
  );
  const lastSyncedRoundCountRef = useRef(0);
  /** Évite de rejouer les sons pour la même manche (Strict Mode / re-renders). */
  const thresholdRoundFingerprintRef = useRef<string | null>(null);

  const setSession = useCallback((s: ActiveGameSession | null) => {
    setSessionState(s);
    if (s) {
      lastSyncedRoundCountRef.current = 0;
      thresholdRoundFingerprintRef.current = null;
      playDispatch({
        type: 'INIT',
        playerCount: s.players.length,
      });
    } else {
      playDispatch({ type: 'CLEAR' });
    }
  }, []);

  const clearSession = useCallback(() => {
    lastSyncedRoundCountRef.current = 0;
    thresholdRoundFingerprintRef.current = null;
    setSessionState(null);
    playDispatch({ type: 'CLEAR' });
  }, []);

  const setAnnouncementDraft = useCallback((playerIndex: number, value: number) => {
    playDispatch({ type: 'SET_ANNOUNCEMENT', index: playerIndex, value });
  }, []);

  const setTrickDraft = useCallback((playerIndex: number, value: number) => {
    playDispatch({ type: 'SET_TRICK', index: playerIndex, value });
  }, []);

  const goToResultsStep = useCallback(() => {
    playDispatch({ type: 'GO_TO_RESULTS' });
  }, []);

  const backToAnnounceStep = useCallback(() => {
    playDispatch({ type: 'BACK_TO_ANNOUNCE' });
  }, []);

  const finalizeRound = useCallback(() => {
    playDispatch({ type: 'FINALIZE_ROUND' });
  }, []);

  const startDescent = useCallback(() => {
    playDispatch({ type: 'START_DESCENT' });
  }, []);

  const endGame = useCallback(() => {
    if (!session || !playState) return;
    if (session.supabaseGameId) {
      void finishRemoteGame(session.supabaseGameId);
    }
    playDispatch({ type: 'END_GAME' });
  }, [session, playState]);

  useEffect(() => {
    if (!session || !playState) {
      thresholdRoundFingerprintRef.current = null;
      return;
    }
    const n = session.players.length;
    const rounds = playState.roundsCompleted;
    const len = rounds.length;
    if (len < 1) {
      thresholdRoundFingerprintRef.current = null;
      return;
    }
    const last = rounds[len - 1];
    const fingerprint = `${len}-${last.roundIndex}-${JSON.stringify(last.scores)}`;
    if (thresholdRoundFingerprintRef.current === fingerprint) return;
    thresholdRoundFingerprintRef.current = fingerprint;

    const currentScores = computeCumulativeScores(rounds, n);
    const prevScores = computeCumulativeScores(rounds.slice(0, -1), n);
    const kinds = scoreThresholdSoundsToPlay(prevScores, currentScores);
    playScoreThresholdSounds(kinds);
  }, [session, playState]);

  useEffect(() => {
    if (!session?.supabaseGameId || !playState) return;
    const n = playState.roundsCompleted.length;
    if (n === 0 || n <= lastSyncedRoundCountRef.current) return;
    const last = playState.roundsCompleted[n - 1];
    lastSyncedRoundCountRef.current = n;
    const orderedPlayerIds = session.players.map((p) => p.playerId).filter((id): id is string => Boolean(id));
    if (orderedPlayerIds.length !== session.players.length) return;
    void persistRemoteRound(session.supabaseGameId, orderedPlayerIds, last);
  }, [session, playState]);

  const cumulativeScores = useMemo(() => {
    if (!session || !playState) return [];
    return computeCumulativeScores(playState.roundsCompleted, session.players.length);
  }, [session, playState]);

  const canGoToResults = useMemo(() => {
    if (!playState || playState.draft.step !== 'announce') return false;
    if (!allSlotsFilled(playState.draft.announcements)) return false;
    return !announcementsTotalForbiddenForRound(
      playState.draft.announcements,
      playState.currentRoundIndex,
      playState.descentStartRound,
    );
  }, [playState]);

  const canFinalizeRound = useMemo(() => {
    if (!playState || playState.draft.step !== 'results') return false;
    if (!allSlotsFilled(playState.draft.announcements) || !allSlotsFilled(playState.draft.tricks)) {
      return false;
    }
    return tricksDraftTotalMatchesCardsDealt(
      playState.draft.tricks,
      playState.currentRoundIndex,
      playState.descentStartRound,
    );
  }, [playState]);

  const canEndGame = useMemo(() => {
    if (!playState || playState.phase !== 'active') return false;
    if (playState.roundsCompleted.length < 1) return false;
    if (!isBetweenRounds(playState)) return false;
    const minR = minRoundIndexToAllowEndGame(playState.descentStartRound);
    if (minR === null) return false;
    return playState.currentRoundIndex >= minR;
  }, [playState]);

  const value = useMemo(
    () => ({
      session,
      setSession,
      clearSession,
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
    }),
    [
      session,
      setSession,
      clearSession,
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
    ],
  );

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession(): GameSessionContextValue {
  const ctx = useContext(GameSessionContext);
  if (!ctx) {
    throw new Error('useGameSession doit être utilisé sous GameSessionProvider');
  }
  return ctx;
}
