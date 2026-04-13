import {
  cardsPerHandForRound,
  minRoundIndexToAllowEndGame,
} from './cardSequence';
import { computeRoundScoresForPlayers } from './scoring';

export type CompletedRound = {
  roundIndex: number;
  announcements: number[];
  tricks: number[];
  scores: number[];
  /** Cartes en main pour cette manche (séquence montée / descente). */
  cardsPerHand?: number;
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
  /**
   * Première manche où la descente est active (`null` = montée seule, sans limite de pic).
   */
  descentStartRound: number | null;
  roundsCompleted: CompletedRound[];
  draft: RoundDraft;
};

export function createInitialPlayState(playerCount: number): GamePlayState {
  return {
    phase: 'active',
    currentRoundIndex: 1,
    descentStartRound: null,
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

/** La somme des plis saisis doit égaler le nombre de cartes en main pour cette manche. */
export function tricksDraftTotalMatchesCardsDealt(
  tricks: number[],
  currentRoundIndex: number,
  descentStartRound: number | null,
): boolean {
  const expected = cardsPerHandForRound(currentRoundIndex, descentStartRound);
  const sum = tricks.reduce((a, b) => a + b, 0);
  return sum === expected;
}

/** Total des annonces interdit s’il égale le nombre de cartes en main pour cette manche. */
export function announcementsTotalForbiddenForRound(
  announcements: number[],
  currentRoundIndex: number,
  descentStartRound: number | null,
): boolean {
  const cards = cardsPerHandForRound(currentRoundIndex, descentStartRound);
  const sum = announcements.reduce((a, b) => a + b, 0);
  return sum === cards;
}

/**
 * Index du joueur qui annonce en premier pour cette manche (0-based).
 * Manche 1 : joueur 0, manche 2 : joueur 1, etc. (rotation à chaque manche).
 */
export function firstBettorPlayerIndex(roundIndex: number, playerCount: number): number {
  if (playerCount <= 0) return 0;
  return ((roundIndex - 1) % playerCount + playerCount) % playerCount;
}

/**
 * Ordre d’affichage en grille (ligne par ligne) : le premier parieur en haut à gauche,
 * puis les suivants dans l’ordre des sièges (indices joueur croissants modulo n).
 */
export function displayOrderPlayerIndices(roundIndex: number, playerCount: number): number[] {
  const first = firstBettorPlayerIndex(roundIndex, playerCount);
  return Array.from({ length: playerCount }, (_, k) => (first + k) % playerCount);
}

/** Entre deux manches : étape annonces et aucune annonce modifiée depuis la dernière finalisation. */
export function isBetweenRounds(state: GamePlayState): boolean {
  if (state.draft.step !== 'announce') return false;
  return !state.draft.announcementTouched;
}

export type PlayAction =
  | { type: 'INIT'; playerCount: number }
  | { type: 'CLEAR' }
  | { type: 'START_DESCENT' }
  | { type: 'SET_ANNOUNCEMENT'; index: number; value: number }
  | { type: 'SET_TRICK'; index: number; value: number }
  | { type: 'GO_TO_RESULTS' }
  | { type: 'BACK_TO_ANNOUNCE' }
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
    case 'START_DESCENT': {
      if (!state) return state;
      if (state.descentStartRound !== null) return state;
      if (state.currentRoundIndex < 2) return state;
      return { ...state, descentStartRound: state.currentRoundIndex };
    }
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
      if (
        announcementsTotalForbiddenForRound(
          state.draft.announcements,
          state.currentRoundIndex,
          state.descentStartRound,
        )
      ) {
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
    case 'BACK_TO_ANNOUNCE': {
      if (!state) return state;
      if (state.draft.step !== 'results') return state;
      const n = state.draft.announcements.length;
      return {
        ...state,
        draft: {
          ...state.draft,
          step: 'announce',
          tricks: Array.from({ length: n }, () => 0),
          announcementTouched: true,
        },
      };
    }
    case 'FINALIZE_ROUND': {
      if (!state) return state;
      if (state.draft.step !== 'results') return state;
      if (!allSlotsFilled(state.draft.announcements) || !allSlotsFilled(state.draft.tricks)) {
        return state;
      }
      if (
        !tricksDraftTotalMatchesCardsDealt(
          state.draft.tricks,
          state.currentRoundIndex,
          state.descentStartRound,
        )
      ) {
        return state;
      }
      const announcements = state.draft.announcements;
      const tricks = state.draft.tricks;
      const scores = computeRoundScoresForPlayers(announcements, tricks);
      const n = announcements.length;
      const cardsPerHand = cardsPerHandForRound(
        state.currentRoundIndex,
        state.descentStartRound,
      );
      const completed: CompletedRound = {
        roundIndex: state.currentRoundIndex,
        announcements,
        tricks,
        scores,
        cardsPerHand,
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
      const minR = minRoundIndexToAllowEndGame(state.descentStartRound);
      if (minR === null || state.currentRoundIndex < minR) return state;
      return { ...state, phase: 'finished' };
    }
    default:
      return state;
  }
}
