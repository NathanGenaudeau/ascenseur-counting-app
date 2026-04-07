import { computeRoundScoresForPlayers } from './scoring';

export type CompletedRound = {
  roundIndex: number;
  announcements: number[];
  tricks: number[];
  scores: number[];
};

export type DraftRoundStep = 'announce' | 'results';

export type RoundDraft = {
  step: DraftRoundStep;
  announcements: (number | null)[];
  tricks: (number | null)[];
};

export type GamePhase = 'active' | 'finished';

export type GamePlayState = {
  phase: GamePhase;
  /** Numéro de manche en cours (1-based). */
  currentRoundIndex: number;
  roundsCompleted: CompletedRound[];
  draft: RoundDraft;
};

export function createInitialPlayState(playerCount: number): GamePlayState {
  return {
    phase: 'active',
    currentRoundIndex: 1,
    roundsCompleted: [],
    draft: {
      step: 'announce',
      announcements: Array.from({ length: playerCount }, () => null),
      tricks: Array.from({ length: playerCount }, () => null),
    },
  };
}

export function allSlotsFilled(values: (number | null)[]): boolean {
  return values.length > 0 && values.every((v) => v !== null && Number.isInteger(v) && v >= 0);
}

/** Entre deux manches : étape annonces et aucune valeur saisie. */
export function isBetweenRounds(state: GamePlayState): boolean {
  if (state.draft.step !== 'announce') return false;
  return state.draft.announcements.every((v) => v === null);
}

export type PlayAction =
  | { type: 'INIT'; playerCount: number }
  | { type: 'CLEAR' }
  | { type: 'SET_ANNOUNCEMENT'; index: number; value: number | null }
  | { type: 'SET_TRICK'; index: number; value: number | null }
  | { type: 'GO_TO_RESULTS' }
  | { type: 'FINALIZE_ROUND' }
  | { type: 'END_GAME' };

export function gamePlayReducer(
  state: GamePlayState | null,
  action: PlayAction,
): GamePlayState | null {
  switch (action.type) {
    case 'CLEAR':
      return null;
    case 'INIT':
      return createInitialPlayState(action.playerCount);
    case 'SET_ANNOUNCEMENT': {
      if (!state) return state;
      const announcements = [...state.draft.announcements];
      announcements[action.index] = action.value;
      return {
        ...state,
        draft: { ...state.draft, announcements },
      };
    }
    case 'SET_TRICK': {
      if (!state) return state;
      const tricks = [...state.draft.tricks];
      tricks[action.index] = action.value;
      return {
        ...state,
        draft: { ...state.draft, tricks },
      };
    }
    case 'GO_TO_RESULTS': {
      if (!state) return state;
      if (!allSlotsFilled(state.draft.announcements)) {
        return state;
      }
      return {
        ...state,
        draft: {
          ...state.draft,
          step: 'results',
          tricks: state.draft.tricks.map(() => null),
        },
      };
    }
    case 'FINALIZE_ROUND': {
      if (!state) return state;
      if (state.draft.step !== 'results') return state;
      if (!allSlotsFilled(state.draft.announcements) || !allSlotsFilled(state.draft.tricks)) {
        return state;
      }
      const announcements = state.draft.announcements as number[];
      const tricks = state.draft.tricks as number[];
      const scores = computeRoundScoresForPlayers(announcements, tricks);
      const n = announcements.length;
      const completed: CompletedRound = {
        roundIndex: state.currentRoundIndex,
        announcements,
        tricks,
        scores,
      };
      return {
        ...state,
        currentRoundIndex: state.currentRoundIndex + 1,
        roundsCompleted: [...state.roundsCompleted, completed],
        draft: {
          step: 'announce',
          announcements: Array.from({ length: n }, () => null),
          tricks: Array.from({ length: n }, () => null),
        },
      };
    }
    case 'END_GAME': {
      if (!state) return state;
      if (state.phase !== 'active') return state;
      if (state.roundsCompleted.length < 1) return state;
      if (!isBetweenRounds(state)) return state;
      return { ...state, phase: 'finished' };
    }
    default:
      return state;
  }
}
