import { Audio } from 'expo-av';

import type { ScoreThresholdSoundKind } from '../domain/scoreThresholdEvents';

let audioModeReady = false;
let soundAbove: Audio.Sound | null = null;
let soundBelow: Audio.Sound | null = null;

async function ensureAudioMode(): Promise<void> {
  if (audioModeReady) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  audioModeReady = true;
}

async function ensureSoundsLoaded(): Promise<void> {
  if (soundAbove && soundBelow) return;
  await ensureAudioMode();
  const [a, b] = await Promise.all([
    Audio.Sound.createAsync(require('../../assets/sounds/score_above_10.wav')),
    Audio.Sound.createAsync(require('../../assets/sounds/score_below_minus_10.wav')),
  ]);
  soundAbove = a.sound;
  soundBelow = b.sound;
}

async function playKind(kind: ScoreThresholdSoundKind): Promise<void> {
  try {
    await ensureSoundsLoaded();
    const s = kind === 'above10' ? soundAbove : soundBelow;
    if (!s) return;
    await s.replayAsync();
  } catch {
    /* pas bloquant si audio indisponible */
  }
}

const STAGGER_MS = 160;

/** Joue les sons correspondant aux franchissements (léger décalage si plusieurs). */
export function playScoreThresholdSounds(kinds: ScoreThresholdSoundKind[]): void {
  if (kinds.length === 0) return;
  void (async () => {
    try {
      await ensureSoundsLoaded();
      for (let i = 0; i < kinds.length; i++) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, STAGGER_MS));
        }
        await playKind(kinds[i]);
      }
    } catch {
      /* noop */
    }
  })();
}
