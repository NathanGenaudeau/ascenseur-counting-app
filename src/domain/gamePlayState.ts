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
  announcements: number[];
  tricks: number[];
  /** True dès qu’une annonce a été modifiée (détecte « entre manches » pour fin de partie). */
  announcementTouched: boolean;
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
      announcements: Array.from({ length: playerCount }, () => 0),
      tricks: Array.from({ length: playerCount }, () => 0),
      announcementTouched: false,
    },
  };
}

export function allSlotsFilled(values: number[]): boolean {
  return values.length > 0 && values.every((v) => Number.isInteger(v) && v >= 0);
}

/** Entre deux manches : étape annonces et aucune annonce modifiée depuis la dernière finalisation. */
export function isBetweenRounds(state: GamePlayState): boolean {
  if (state.draft.step !== 'announce') return false;
  return !state.draft.announcementTouched;
}

export type PlayAction =
  | { type: 'INIT'; playerCount: number }
  | { type: 'CLEAR' }
  | { type: 'SET_ANNOUNCEMENT'; index: number; value: number }
  | { type: 'SET_TRICK'; index: number; value: number }
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
        draft: {
          ...state.draft,
          announcements,
          announcementTouched: true,
        },
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
          /** Préremplit avec les annonces pour accélérer la saisie (ajustement au besoin). */
          tricks: [...state.draft.announcements],
        },
      };
    }
    case 'FINALIZE_ROUND': {
      if (!state) return state;
      if (state.draft.step !== 'results') return state;
      if (!allSlotsFilled(state.draft.announcements) || !allSlotsFilled(state.draft.tricks)) {
        return state;
      }
      const announcements = state.draft.announcements;
      const tricks = state.draft.tricks;
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
          announcements: Array.from({ length: n }, () => 0),
          tricks: Array.from({ length: n }, () => 0),
          announcementTouched: false,
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
