import {
  cardPhaseForRound,
  cardsPerHandForRound,
  minRoundIndexToAllowEndGame,
} from '../src/domain/cardSequence';

describe('cardSequence', () => {
  it('minRoundIndexToAllowEndGame : uniquement après descente', () => {
    expect(minRoundIndexToAllowEndGame(null)).toBe(null);
    expect(minRoundIndexToAllowEndGame(6)).toBe(10);
  });

  it('sans descente : montée = numéro de manche', () => {
    expect(cardsPerHandForRound(1, null)).toBe(1);
    expect(cardsPerHandForRound(12, null)).toBe(12);
    expect(cardPhaseForRound(12, null)).toBe('montée');
  });

  it('descente à partir de d=6, pic implicite 5', () => {
    const d = 6;
    expect(cardsPerHandForRound(5, d)).toBe(5);
    expect(cardsPerHandForRound(6, d)).toBe(4);
    expect(cardsPerHandForRound(9, d)).toBe(1);
    expect(cardsPerHandForRound(10, d)).toBe(1);
    expect(cardPhaseForRound(6, d)).toBe('descente');
  });

  it('pic élevé : descente à d=11, pic 10', () => {
    const d = 11;
    expect(cardsPerHandForRound(10, d)).toBe(10);
    expect(cardsPerHandForRound(11, d)).toBe(9);
  });
});
