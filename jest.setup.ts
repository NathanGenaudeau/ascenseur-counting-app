/* eslint-disable @typescript-eslint/no-require-imports -- mock Jest doit charger le mock CommonJS */
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/react-native';

const mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

/** Parcours UI : pas de vrai Supabase — session distante simulée. */
jest.mock('./src/services/gameSessionSupabase', () => ({
  startRemoteGameSession: jest.fn(async (draft: { slots: { displayName: string; playerId?: string }[] }) => ({
    gameId: '00000000-0000-0000-0000-000000000099',
    players: draft.slots.map((s, i) => ({
      displayName: s.displayName.trim(),
      playerId: s.playerId ?? `00000000-0000-0000-0000-0000000000${10 + i}`,
      gamePlayerId: `00000000-0000-0000-0000-0000000000${30 + i}`,
    })),
  })),
  persistRemoteRound: jest.fn().mockResolvedValue(true),
  finishRemoteGame: jest.fn().mockResolvedValue(true),
}));

jest.mock('./src/services/lastGameConfigurationSupabase', () => ({
  persistLastGameDraftSupabase: jest.fn().mockResolvedValue(true),
  loadLastGameDraftFromSupabase: jest.fn().mockResolvedValue(null),
}));

jest.mock('./src/services/scoreThresholdSoundPlayer', () => ({
  playScoreThresholdSounds: jest.fn(),
  preloadScoreThresholdSounds: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  createAudioPlayer: jest.fn(() => ({
    seekTo: jest.fn().mockResolvedValue(undefined),
    play: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-linear-gradient');

beforeEach(async () => {
  await mockAsyncStorage.clear();
});
