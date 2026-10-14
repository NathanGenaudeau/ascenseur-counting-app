import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  parseStoredActiveGame,
  serializeActiveGame,
  type StoredActiveGame,
} from '../domain/activeGameSession';

const STORAGE_KEY = 'ascenseur.activeGame.v1';

/** Partie en cours sauvegardée sur l’appareil, ou `null`. Ne lève jamais. */
export async function loadActiveGame(): Promise<StoredActiveGame | null> {
  try {
    return parseStoredActiveGame(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function saveActiveGame(game: StoredActiveGame): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, serializeActiveGame(game));
  } catch (e) {
    if (__DEV__) console.warn('[activeGameStorage] save', e);
  }
}

export async function clearActiveGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    if (__DEV__) console.warn('[activeGameStorage] clear', e);
  }
}
