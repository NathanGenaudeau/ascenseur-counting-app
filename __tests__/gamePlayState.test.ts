import {
  announcementsTotalForbiddenForRound,
  displayOrderPlayerIndices,
  firstBettorPlayerIndex,
  gamePlayReducer,
  isBetweenRounds,
  tricksDraftTotalMatchesCardsDealt,
  type GamePlayState,
  type PlayAction,
} from '../src/domain/gamePlayState';

function reduce(s: GamePlayState, a: PlayAction): GamePlayState {
  const next = gamePlayReducer(s, a);
  if (!next) {
    throw new Error('état attendu');
  }
  return next;
}

describe('ordre d’annonce (rotation par manche)', () => {
  it('premier parieur : manche 1 → J0, manche 2 → J1, …', () => {
    expect(firstBettorPlayerIndex(1, 4)).toBe(0);
    expect(firstBettorPlayerIndex(2, 4)).toBe(1);
    expect(firstBettorPlayerIndex(3, 4)).toBe(2);
    expect(firstBettorPlayerIndex(4, 4)).toBe(3);
    expect(firstBettorPlayerIndex(5, 4)).toBe(0);
  });

  it('grille : premier en tête puis indices croissants modulo n', () => {
    expect(displayOrderPlayerIndices(1, 4)).toEqual([0, 1, 2, 3]);
    expect(displayOrderPlayerIndices(2, 4)).toEqual([1, 2, 3, 0]);
    expect(displayOrderPlayerIndices(3, 3)).toEqual([2, 0, 1]);
  });
});

describe('gamePlayReducer', () => {
  const base = gamePlayReducer(null, { type: 'INIT', playerCount: 2 })!;

  it('GO_TO_RESULTS passe à résultats si annonces valides et total ≠ cartes en main', () => {
    const fromDefaults = gamePlayReducer(base, { type: 'GO_TO_RESULTS' });
    expect(fromDefaults?.draft.step).toBe('results');

    let s = gamePlayReducer(null, { type: 'INIT', playerCount: 2 })!;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 2 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 2 });
    const next = gamePlayReducer(s, { type: 'GO_TO_RESULTS' });
    expect(next?.draft.step).toBe('results');
    expect(next?.draft.tricks).toEqual([2, 2]);
  });

  it('BACK_TO_ANNOUNCE repasse à la saisie des annonces en conservant les valeurs', () => {
    let s = base;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 2 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 2 });
    s = reduce(s, { type: 'GO_TO_RESULTS' });
    expect(s.draft.step).toBe('results');
    s = reduce(s, { type: 'SET_TRICK', index: 0, value: 1 });
    s = reduce(s, { type: 'SET_TRICK', index: 1, value: 0 });
    s = reduce(s, { type: 'BACK_TO_ANNOUNCE' });
    expect(s.draft.step).toBe('announce');
    expect(s.draft.announcements).toEqual([2, 2]);
    expect(s.draft.tricks).toEqual([0, 0]);
    expect(s.draft.announcementTouched).toBe(true);
  });

  it('BACK_TO_ANNOUNCE est ignoré hors étape résultats', () => {
    const next = gamePlayReducer(base, { type: 'BACK_TO_ANNOUNCE' });
    expect(next?.draft.step).toBe('announce');
  });

  it('GO_TO_RESULTS est ignoré si le total des annonces = cartes en main', () => {
    let s = base;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 1 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 0 });
    expect(announcementsTotalForbiddenForRound(s.draft.announcements, s.currentRoundIndex, s.descentStartRound)).toBe(
      true,
    );
    const next = gamePlayReducer(s, { type: 'GO_TO_RESULTS' });
    expect(next?.draft.step).toBe('announce');
  });

  it('FINALIZE_ROUND ajoute une manche et réinitialise le brouillon', () => {
    let s = base;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 3 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 4 });
    s = reduce(s, { type: 'GO_TO_RESULTS' });
    /** Manche 1 : 1 carte en main → total des plis = 1. */
    s = reduce(s, { type: 'SET_TRICK', index: 0, value: 0 });
    s = reduce(s, { type: 'SET_TRICK', index: 1, value: 1 });
    s = reduce(s, { type: 'FINALIZE_ROUND' });
    expect(s.roundsCompleted).toHaveLength(1);
    expect(s.roundsCompleted[0].cardsPerHand).toBe(1);
    expect(s.roundsCompleted[0].scores).toEqual([-3, -3]);
    expect(s.currentRoundIndex).toBe(2);
    expect(s.draft.step).toBe('announce');
    expect(s.draft.announcements).toEqual([0, 0]);
    expect(s.draft.announcementTouched).toBe(false);
  });

  it('FINALIZE_ROUND est ignoré si la somme des plis ≠ cartes distribuées', () => {
    let s = base;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 1 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 1 });
    s = reduce(s, { type: 'GO_TO_RESULTS' });
    expect(tricksDraftTotalMatchesCardsDealt(s.draft.tricks, s.currentRoundIndex, s.descentStartRound)).toBe(
      false,
    );
    s = reduce(s, { type: 'FINALIZE_ROUND' });
    expect(s.roundsCompleted).toHaveLength(0);
    s = reduce(s, { type: 'SET_TRICK', index: 0, value: 1 });
    s = reduce(s, { type: 'SET_TRICK', index: 1, value: 0 });
    expect(tricksDraftTotalMatchesCardsDealt(s.draft.tricks, s.currentRoundIndex, s.descentStartRound)).toBe(
      true,
    );
    s = reduce(s, { type: 'FINALIZE_ROUND' });
    expect(s.roundsCompleted).toHaveLength(1);
  });

  it('END_GAME termine la partie entre deux manches après descente (ASC-17)', () => {
    let s = gamePlayReducer(null, { type: 'INIT', playerCount: 2 })!;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 3 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 3 });
    s = reduce(s, { type: 'GO_TO_RESULTS' });
    s = reduce(s, { type: 'SET_TRICK', index: 0, value: 0 });
    s = reduce(s, { type: 'SET_TRICK', index: 1, value: 1 });
    s = reduce(s, { type: 'FINALIZE_ROUND' });
    expect(isBetweenRounds(s)).toBe(true);
    expect(s.currentRoundIndex).toBe(2);
    s = reduce(s, { type: 'START_DESCENT' });
    expect(s.descentStartRound).toBe(2);
    s = reduce(s, { type: 'END_GAME' });
    expect(s.phase).toBe('finished');
  });

  it('END_GAME est ignoré sans manche terminée', () => {
    const s = reduce(base, { type: 'END_GAME' });
    expect(s.phase).toBe('active');
  });

  it('END_GAME est ignoré pendant la saisie', () => {
    let s = reduce(base, { type: 'SET_ANNOUNCEMENT', index: 0, value: 1 });
    s = reduce(s, { type: 'END_GAME' });
    expect(s.phase).toBe('active');
  });

  it('START_DESCENT fixe la première manche de descente', () => {
    let s = gamePlayReducer(null, { type: 'INIT', playerCount: 2 })!;
    s = reduce(s, { type: 'START_DESCENT' });
    expect(s.descentStartRound).toBe(null);
    for (let i = 0; i < 5; i++) {
      s = reduce(s, { type: 'GO_TO_RESULTS' });
      const r = s.currentRoundIndex;
      s = reduce(s, { type: 'SET_TRICK', index: 0, value: r });
      s = reduce(s, { type: 'SET_TRICK', index: 1, value: 0 });
      s = reduce(s, { type: 'FINALIZE_ROUND' });
    }
    expect(s.currentRoundIndex).toBe(6);
    s = reduce(s, { type: 'START_DESCENT' });
    expect(s.descentStartRound).toBe(6);
  });

  it('END_GAME est ignoré sans descente entamée', () => {
    let s = base;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 3 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 3 });
    s = reduce(s, { type: 'GO_TO_RESULTS' });
    s = reduce(s, { type: 'SET_TRICK', index: 0, value: 0 });
    s = reduce(s, { type: 'SET_TRICK', index: 1, value: 1 });
    s = reduce(s, { type: 'FINALIZE_ROUND' });
    expect(s.descentStartRound).toBe(null);
    s = reduce(s, { type: 'END_GAME' });
    expect(s.phase).toBe('active');
  });
});
