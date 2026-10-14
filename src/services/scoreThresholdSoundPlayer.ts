import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import type { ScoreThresholdSoundKind } from '../domain/scoreThresholdEvents';

let loading: Promise<Record<ScoreThresholdSoundKind, AudioPlayer>> | null = null;

function loadPlayers(): Promise<Record<ScoreThresholdSoundKind, AudioPlayer>> {
  if (!loading) {
    loading = (async () => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        shouldRouteThroughEarpiece: false,
      });
      return {
        above10: createAudioPlayer(require('../../assets/sounds/score_above_10.wav')),
        belowMinus10: createAudioPlayer(require('../../assets/sounds/score_below_minus_10.wav')),
      };
    })().catch((e: unknown) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}

/** Charge les sons à l’avance (début de partie) pour éviter la latence du premier franchissement. */
export function preloadScoreThresholdSounds(): void {
  loadPlayers().catch(() => {
    /* pas bloquant si audio indisponible */
  });
}

const STAGGER_MS = 160;

/** Joue les sons correspondant aux franchissements (léger décalage si plusieurs). */
export function playScoreThresholdSounds(kinds: ScoreThresholdSoundKind[]): void {
  if (kinds.length === 0) return;
  void (async () => {
    try {
      const players = await loadPlayers();
      for (let i = 0; i < kinds.length; i++) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, STAGGER_MS));
        }
        const player = players[kinds[i]];
        await player.seekTo(0);
        player.play();
      }
    } catch {
      /* pas bloquant si audio indisponible */
    }
  })();
}
