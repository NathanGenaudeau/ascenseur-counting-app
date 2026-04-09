import {
  gamePlayReducer,
  isBetweenRounds,
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

describe('gamePlayReducer', () => {
  const base = gamePlayReducer(null, { type: 'INIT', playerCount: 2 })!;

  it('GO_TO_RESULTS passe à résultats dès que chaque annonce est un entier ≥ 0 (défaut 0)', () => {
    const fromDefaults = gamePlayReducer(base, { type: 'GO_TO_RESULTS' });
    expect(fromDefaults?.draft.step).toBe('results');

    let s = gamePlayReducer(null, { type: 'INIT', playerCount: 2 })!;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 2 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 2 });
    const next = gamePlayReducer(s, { type: 'GO_TO_RESULTS' });
    expect(next?.draft.step).toBe('results');
    expect(next?.draft.tricks).toEqual([2, 2]);
  });

  it('FINALIZE_ROUND ajoute une manche et réinitialise le brouillon', () => {
    let s = base;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 3 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 4 });
    s = reduce(s, { type: 'GO_TO_RESULTS' });
    s = reduce(s, { type: 'SET_TRICK', index: 0, value: 3 });
    s = reduce(s, { type: 'SET_TRICK', index: 1, value: 5 });
    s = reduce(s, { type: 'FINALIZE_ROUND' });
    expect(s.roundsCompleted).toHaveLength(1);
    expect(s.roundsCompleted[0].scores).toEqual([3, -1]);
    expect(s.currentRoundIndex).toBe(2);
    expect(s.draft.step).toBe('announce');
    expect(s.draft.announcements).toEqual([0, 0]);
    expect(s.draft.announcementTouched).toBe(false);
  });

  it('END_GAME termine la partie entre deux manches (ASC-17)', () => {
    let s = base;
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 3 });
    s = reduce(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 3 });
    s = reduce(s, { type: 'GO_TO_RESULTS' });
    s = reduce(s, { type: 'SET_TRICK', index: 0, value: 3 });
    s = reduce(s, { type: 'SET_TRICK', index: 1, value: 3 });
    s = reduce(s, { type: 'FINALIZE_ROUND' });
    expect(isBetweenRounds(s)).toBe(true);
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
});
