/* eslint-disable @typescript-eslint/no-require-imports -- mock Jest doit charger le mock CommonJS */
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
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          replayAsync: jest.fn().mockResolvedValue(undefined),
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
      }),
    },
  },
}));

beforeEach(async () => {
  await mockAsyncStorage.clear();
});
