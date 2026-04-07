import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
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

import type { RootTabParamList } from '../navigation/AppNavigator';
import {
  createDefaultDraft,
  ensureSlotsLength,
  PLAYER_COUNT_MAX,
  PLAYER_COUNT_MIN,
  type GameConfigurationDraft,
  validateGameConfigurationDraft,
} from '../domain/gameConfigurationDraft';
import type { PlayerDocument } from '../domain/player';
import { fetchPlayersList } from '../data/repositories/playersRepository';
import { getTypedSupabaseClient } from '../data/supabaseClient';
import {
  loadLastGameConfiguration,
  persistLastGameConfiguration,
} from '../services/lastGameConfigurationStorage';
import { startRemoteGameSession } from '../services/gameSessionSupabase';
import { useGameSession } from './GameSessionContext';

type Action =
  | { type: 'SET_DRAFT'; draft: GameConfigurationDraft }
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'SET_SLOT_NAME'; index: number; value: string }
  | { type: 'SET_SLOT_FROM_PLAYER'; index: number; player: PlayerDocument }
  | { type: 'SET_NOTES'; notes: string };

function configurationReducer(
  state: GameConfigurationDraft,
  action: Action,
): GameConfigurationDraft {
  switch (action.type) {
    case 'SET_DRAFT':
      return action.draft;
    case 'SET_PLAYER_COUNT': {
      const count = Math.min(PLAYER_COUNT_MAX, Math.max(PLAYER_COUNT_MIN, action.count));
      return {
        ...state,
        playerCount: count,
        slots: ensureSlotsLength(state.slots, count),
      };
    }
    case 'SET_SLOT_NAME': {
      const slots = [...state.slots];
      slots[action.index] = { displayName: action.value, playerId: undefined };
      return { ...state, slots };
    }
    case 'SET_SLOT_FROM_PLAYER': {
      const slots = [...state.slots];
      slots[action.index] = {
        displayName: action.player.displayName,
        playerId: action.player._id,
      };
      return { ...state, slots };
    }
    case 'SET_NOTES':
      return {
        ...state,
        settings: { ...state.settings, notes: action.notes },
      };
    default:
      return state;
  }
}

type GameConfigurationContextValue = {
  draft: GameConfigurationDraft;
  validation: ReturnType<typeof validateGameConfigurationDraft>;
  startError: string | null;
  /** True pendant la création distante (partie + persistance config) — évite double envoi. */
  isStartingGame: boolean;
  clearStartError: () => void;
  setPlayerCount: (n: number) => void;
  setSlotName: (index: number, value: string) => void;
  setSlotFromPlayer: (index: number, player: PlayerDocument) => void;
  setNotes: (notes: string) => void;
  loadLastSavedConfiguration: () => Promise<void>;
  startGame: () => Promise<void>;
  fetchExistingPlayers: () => Promise<PlayerDocument[]>;
};

const GameConfigurationContext = createContext<GameConfigurationContextValue | null>(null);

export function GameConfigurationProvider({ children }: { children: React.ReactNode }) {
  const [draft, dispatch] = useReducer(configurationReducer, undefined, () =>
    createDefaultDraft(4),
  );
  const [startError, setStartError] = useState<string | null>(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const startGameInFlightRef = useRef(false);
  const { setSession } = useGameSession();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  /**
   * Évite d’écraser la saisie si le chargement Supabase de la dernière config se termine
   * après que l’utilisateur a modifié le brouillon (sinon le 1er champ semble « bloqué »).
   */
  const skipInitialRemoteHydrationRef = useRef(false);

  const clearStartError = useCallback(() => setStartError(null), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const loaded = await loadLastGameConfiguration();
      if (!cancelled && loaded && !skipInitialRemoteHydrationRef.current) {
        dispatch({ type: 'SET_DRAFT', draft: loaded });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validation = useMemo(() => validateGameConfigurationDraft(draft), [draft]);

  const setPlayerCount = useCallback((n: number) => {
    skipInitialRemoteHydrationRef.current = true;
    dispatch({ type: 'SET_PLAYER_COUNT', count: n });
  }, []);

  const setSlotName = useCallback((index: number, value: string) => {
    skipInitialRemoteHydrationRef.current = true;
    dispatch({ type: 'SET_SLOT_NAME', index, value });
  }, []);

  const setSlotFromPlayer = useCallback((index: number, player: PlayerDocument) => {
    skipInitialRemoteHydrationRef.current = true;
    dispatch({ type: 'SET_SLOT_FROM_PLAYER', index, player });
  }, []);

  const setNotes = useCallback((notes: string) => {
    skipInitialRemoteHydrationRef.current = true;
    dispatch({ type: 'SET_NOTES', notes });
  }, []);

  const loadLastSavedConfiguration = useCallback(async () => {
    const loaded = await loadLastGameConfiguration();
    if (loaded) {
      dispatch({ type: 'SET_DRAFT', draft: loaded });
    }
  }, []);

  const startGame = useCallback(async () => {
    if (startGameInFlightRef.current) return;
    const v = validateGameConfigurationDraft(draft);
    if (!v.valid) return;
    if (!getTypedSupabaseClient()) {
      setStartError('Connexion Supabase indisponible (EXPO_PUBLIC_SUPABASE_URL et clé anon).');
      return;
    }

    startGameInFlightRef.current = true;
    setIsStartingGame(true);
    try {
      const remote = await startRemoteGameSession(draft);
      if (!remote) {
        setStartError('Impossible de créer la partie sur le serveur.');
        return;
      }

      const draftWithResolvedPlayers: GameConfigurationDraft = {
        ...draft,
        slots: draft.slots.map((s, i) => ({
          displayName: remote.players[i]?.displayName ?? s.displayName.trim(),
          playerId: remote.players[i]?.playerId,
        })),
      };

      const okConfig = await persistLastGameConfiguration(draftWithResolvedPlayers);
      if (!okConfig && __DEV__) {
        console.warn(
          '[startGame] Modèle de configuration non sauvegardé (tables game_config_* ou droits). La partie a tout de même été créée.',
        );
      }

      setStartError(null);
      setSession({
        players: remote.players,
        settings: draft.settings,
        supabaseGameId: remote.gameId,
      });
      navigation.navigate('GameSession');
    } finally {
      startGameInFlightRef.current = false;
      setIsStartingGame(false);
    }
  }, [draft, navigation, setSession]);

  const fetchExistingPlayers = useCallback(() => fetchPlayersList(), []);

  const value = useMemo(
    () => ({
      draft,
      validation,
      startError,
      isStartingGame,
      clearStartError,
      setPlayerCount,
      setSlotName,
      setSlotFromPlayer,
      setNotes,
      loadLastSavedConfiguration,
      startGame,
      fetchExistingPlayers,
    }),
    [
      draft,
      validation,
      startError,
      isStartingGame,
      clearStartError,
      setPlayerCount,
      setSlotName,
      setSlotFromPlayer,
      setNotes,
      loadLastSavedConfiguration,
      startGame,
      fetchExistingPlayers,
    ],
  );

  return (
    <GameConfigurationContext.Provider value={value}>{children}</GameConfigurationContext.Provider>
  );
}

export function useGameConfiguration(): GameConfigurationContextValue {
  const ctx = useContext(GameConfigurationContext);
  if (!ctx) {
    throw new Error('useGameConfiguration doit être utilisé sous GameConfigurationProvider');
  }
  return ctx;
}
