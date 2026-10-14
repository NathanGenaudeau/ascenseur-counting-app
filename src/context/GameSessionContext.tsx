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
import { AppState } from 'react-native';

import {
  INITIAL_SYNC_PROGRESS,
  orderedGamePlayerIds,
  unsyncedRoundCount,
  type ActiveGameSession,
  type RemoteSyncProgress,
  type StoredActiveGame,
} from '../domain/activeGameSession';
import { minRoundIndexToAllowEndGame } from '../domain/cardSequence';
import {
  allSlotsFilled,
  announcementsTotalForbiddenForRound,
  gamePlayReducer,
  isBetweenRounds,
  tricksDraftTotalMatchesCardsDealt,
  type GamePlayState,
} from '../domain/gamePlayState';
import { scoreThresholdSoundsToPlay } from '../domain/scoreThresholdEvents';
import { computeCumulativeScores } from '../domain/scoring';
import { clearActiveGame, loadActiveGame, saveActiveGame } from '../services/activeGameStorage';
import { finishRemoteGame, persistRemoteRound } from '../services/gameSessionSupabase';
import {
  playScoreThresholdSounds,
  preloadScoreThresholdSounds,
} from '../services/scoreThresholdSoundPlayer';

export type { ActiveGameSession, ActiveSessionPlayer } from '../domain/activeGameSession';

/** `error` : le dernier envoi a échoué, les données restent en attente sur l’appareil. */
export type RemoteSyncStatus = 'idle' | 'syncing' | 'error';

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
  syncStatus: RemoteSyncStatus;
  /** Manches terminées pas encore enregistrées côté Supabase. */
  unsyncedRounds: number;
  /** Données de la partie pas encore toutes enregistrées (manches ou clôture). */
  hasPendingSync: boolean;
  retrySync: () => void;
};

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

type Snapshot = {
  session: ActiveGameSession | null;
  playState: GamePlayState | null;
  syncProgress: RemoteSyncProgress;
};

export function GameSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<ActiveGameSession | null>(null);
  const [playState, playDispatch] = useReducer(gamePlayReducer, null);
  const [syncProgress, setSyncProgress] = useState<RemoteSyncProgress>(INITIAL_SYNC_PROGRESS);
  const [syncStatus, setSyncStatus] = useState<RemoteSyncStatus>('idle');

  /** Dernier état rendu, lu par les callbacks asynchrones (sync) et par `finalizeRound`. */
  const latestRef = useRef<Snapshot>({ session, playState, syncProgress });
  const syncInFlightRef = useRef(false);
  /** Vrai une fois la partie sauvegardée relue (ou absente) : avant, on n’écrase pas le stockage. */
  const hydratedRef = useRef(false);
  /** Une session posée avant la fin de la relecture l’emporte sur la sauvegarde. */
  const sessionTouchedRef = useRef(false);

  useEffect(() => {
    latestRef.current = { session, playState, syncProgress };
  }, [session, playState, syncProgress]);

  const persistLocally = useCallback((snapshot: Snapshot) => {
    if (snapshot.session && snapshot.playState) {
      void saveActiveGame({
        version: 1,
        session: snapshot.session,
        playState: snapshot.playState,
        sync: snapshot.syncProgress,
      });
    } else {
      void clearActiveGame();
    }
  }, []);

  const applySession = useCallback((stored: StoredActiveGame | null) => {
    setSessionState(stored?.session ?? null);
    setSyncProgress(stored?.sync ?? INITIAL_SYNC_PROGRESS);
    setSyncStatus('idle');
    playDispatch(stored ? { type: 'RESTORE', state: stored.playState } : { type: 'CLEAR' });
    if (stored) preloadScoreThresholdSounds();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await loadActiveGame();
      if (cancelled) return;
      hydratedRef.current = true;
      if (sessionTouchedRef.current) {
        persistLocally(latestRef.current);
      } else if (stored) {
        applySession(stored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySession, persistLocally]);

  useEffect(() => {
    if (hydratedRef.current) persistLocally({ session, playState, syncProgress });
  }, [session, playState, syncProgress, persistLocally]);

  /**
   * Envoie dans l’ordre les manches non synchronisées puis la clôture de partie.
   * Les appels distants sont idempotents : un échec laisse les données en attente et
   * un nouvel essai (manche suivante, retour au premier plan, bouton) reprend où il s’est arrêté.
   */
  const runSync = useCallback(async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      for (;;) {
        const { session: s, playState: ps, syncProgress: progress } = latestRef.current;
        const gameId = s?.supabaseGameId;
        const gamePlayerIds = s ? orderedGamePlayerIds(s) : null;
        if (!s || !ps || !gameId || !gamePlayerIds) {
          setSyncStatus('idle');
          return;
        }

        let ok: boolean;
        let next: RemoteSyncProgress;
        if (progress.syncedRoundCount < ps.roundsCompleted.length) {
          setSyncStatus('syncing');
          ok = await persistRemoteRound(gameId, gamePlayerIds, ps.roundsCompleted[progress.syncedRoundCount]);
          next = { ...progress, syncedRoundCount: progress.syncedRoundCount + 1 };
        } else if (ps.phase === 'finished' && !progress.finishSynced) {
          setSyncStatus('syncing');
          ok = await finishRemoteGame(gameId);
          next = { ...progress, finishSynced: true };
        } else {
          setSyncStatus('idle');
          return;
        }

        // Session remplacée ou effacée pendant l’appel : ce résultat ne la concerne plus.
        if (latestRef.current.session !== s) return;
        if (!ok) {
          setSyncStatus('error');
          return;
        }
        latestRef.current = { ...latestRef.current, syncProgress: next };
        setSyncProgress(next);
      }
    } finally {
      syncInFlightRef.current = false;
    }
  }, []);

  const roundsCompletedCount = playState?.roundsCompleted.length ?? 0;
  const phase = playState?.phase;

  useEffect(() => {
    void runSync();
  }, [session, roundsCompletedCount, phase, runSync]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void runSync();
    });
    return () => sub.remove();
  }, [runSync]);

  const retrySync = useCallback(() => {
    void runSync();
  }, [runSync]);

  const setSession = useCallback((s: ActiveGameSession | null) => {
    sessionTouchedRef.current = true;
    setSessionState(s);
    setSyncProgress(INITIAL_SYNC_PROGRESS);
    setSyncStatus('idle');
    if (s) {
      playDispatch({ type: 'INIT', playerCount: s.players.length });
      preloadScoreThresholdSounds();
    } else {
      playDispatch({ type: 'CLEAR' });
    }
  }, []);

  const clearSession = useCallback(() => setSession(null), [setSession]);

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
    const prev = latestRef.current.playState;
    const next = gamePlayReducer(prev, { type: 'FINALIZE_ROUND' });
    if (!prev || !next || next === prev) return;
    // Un double appui avant le prochain rendu voit déjà la manche finalisée.
    latestRef.current = { ...latestRef.current, playState: next };
    playDispatch({ type: 'RESTORE', state: next });

    const n = prev.draft.announcements.length;
    playScoreThresholdSounds(
      scoreThresholdSoundsToPlay(
        computeCumulativeScores(prev.roundsCompleted, n),
        computeCumulativeScores(next.roundsCompleted, n),
      ),
    );
  }, []);

  const startDescent = useCallback(() => {
    playDispatch({ type: 'START_DESCENT' });
  }, []);

  const endGame = useCallback(() => {
    playDispatch({ type: 'END_GAME' });
  }, []);

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

  const isRemoteGame = Boolean(session?.supabaseGameId);
  const unsyncedRounds = isRemoteGame ? unsyncedRoundCount(roundsCompletedCount, syncProgress) : 0;
  const hasPendingSync =
    isRemoteGame && (unsyncedRounds > 0 || (phase === 'finished' && !syncProgress.finishSynced));

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
      syncStatus,
      unsyncedRounds,
      hasPendingSync,
      retrySync,
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
      syncStatus,
      unsyncedRounds,
      hasPendingSync,
      retrySync,
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
