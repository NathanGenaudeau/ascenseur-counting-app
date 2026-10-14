import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { GameSessionProvider, useGameSession } from '../src/context/GameSessionContext';
import { createInitialPlayState } from '../src/domain/gamePlayState';
import type { StoredActiveGame } from '../src/domain/activeGameSession';
import { finishRemoteGame, persistRemoteRound } from '../src/services/gameSessionSupabase';
import { playScoreThresholdSounds } from '../src/services/scoreThresholdSoundPlayer';

const STORAGE_KEY = 'ascenseur.activeGame.v1';

const remoteSession = {
  players: [
    { displayName: 'A', playerId: 'p0', gamePlayerId: 'gp0' },
    { displayName: 'B', playerId: 'p1', gamePlayerId: 'gp1' },
    { displayName: 'C', playerId: 'p2', gamePlayerId: 'gp2' },
  ],
  settings: {},
  supabaseGameId: 'g1',
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <GameSessionProvider>{children}</GameSessionProvider>;
}

/** Manche 1 (1 carte) : annonces [0,0,0], plis [1,0,0]. */
function playFirstRound(result: { current: ReturnType<typeof useGameSession> }) {
  act(() => result.current.goToResultsStep());
  act(() => result.current.setTrickDraft(0, 1));
  act(() => result.current.finalizeRound());
}

describe('GameSessionProvider', () => {
  beforeEach(() => {
    jest.mocked(persistRemoteRound).mockReset().mockResolvedValue(true);
    jest.mocked(finishRemoteGame).mockReset().mockResolvedValue(true);
    jest.mocked(playScoreThresholdSounds).mockClear();
  });

  it('garde la manche en attente si l’envoi échoue, puis la renvoie au retry', async () => {
    jest.mocked(persistRemoteRound).mockResolvedValueOnce(false);
    const { result } = renderHook(() => useGameSession(), { wrapper });

    act(() => result.current.setSession(remoteSession));
    playFirstRound(result);

    await waitFor(() => expect(result.current.syncStatus).toBe('error'));
    expect(result.current.unsyncedRounds).toBe(1);
    expect(result.current.hasPendingSync).toBe(true);

    act(() => result.current.retrySync());

    await waitFor(() => expect(result.current.unsyncedRounds).toBe(0));
    expect(result.current.syncStatus).toBe('idle');
    expect(persistRemoteRound).toHaveBeenCalledTimes(2);
    expect(jest.mocked(persistRemoteRound).mock.calls[1]).toEqual([
      'g1',
      ['gp0', 'gp1', 'gp2'],
      expect.objectContaining({ roundIndex: 1, tricks: [1, 0, 0] }),
    ]);
  });

  it('joue les sons une seule fois même en cas de double finalisation', async () => {
    const { result } = renderHook(() => useGameSession(), { wrapper });
    act(() => result.current.setSession(remoteSession));
    act(() => result.current.goToResultsStep());
    act(() => result.current.setTrickDraft(0, 1));

    act(() => {
      result.current.finalizeRound();
      result.current.finalizeRound();
    });

    expect(result.current.playState?.roundsCompleted).toHaveLength(1);
    expect(playScoreThresholdSounds).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.unsyncedRounds).toBe(0));
  });

  it('sauvegarde la partie en cours sur l’appareil', async () => {
    const { result } = renderHook(() => useGameSession(), { wrapper });
    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull());

    act(() => result.current.setSession(remoteSession));
    playFirstRound(result);

    await waitFor(async () => {
      const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? 'null') as StoredActiveGame;
      expect(stored.playState.roundsCompleted).toHaveLength(1);
      expect(stored.sync.syncedRoundCount).toBe(1);
    });

    act(() => result.current.clearSession());
    await waitFor(async () => expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull());
  });

  it('reprend une partie sauvegardée et termine sa synchronisation', async () => {
    const playState = createInitialPlayState(3);
    const stored: StoredActiveGame = {
      version: 1,
      session: remoteSession,
      playState: {
        ...playState,
        phase: 'finished',
        currentRoundIndex: 2,
        roundsCompleted: [{ roundIndex: 1, announcements: [0, 0, 0], tricks: [1, 0, 0], scores: [-1, 0, 0] }],
      },
      sync: { syncedRoundCount: 0, finishSynced: false },
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useGameSession(), { wrapper });

    await waitFor(() => expect(result.current.session?.supabaseGameId).toBe('g1'));
    await waitFor(() => expect(result.current.hasPendingSync).toBe(false));
    expect(result.current.playState?.phase).toBe('finished');
    expect(result.current.cumulativeScores).toEqual([-1, 0, 0]);
    expect(persistRemoteRound).toHaveBeenCalledTimes(1);
    expect(finishRemoteGame).toHaveBeenCalledWith('g1');
    expect(jest.mocked(persistRemoteRound).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(finishRemoteGame).mock.invocationCallOrder[0],
    );
  });
});
