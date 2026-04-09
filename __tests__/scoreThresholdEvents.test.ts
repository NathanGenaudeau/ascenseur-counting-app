import {
  scoreThresholdSoundsToPlay,
  SCORE_THRESHOLD_ABOVE,
  SCORE_THRESHOLD_BELOW,
} from '../src/domain/scoreThresholdEvents';

describe('scoreThresholdSoundsToPlay', () => {
  it('déclenche au passage strictement au-dessus du seuil haut', () => {
    expect(SCORE_THRESHOLD_ABOVE).toBe(10);
    expect(
      scoreThresholdSoundsToPlay([10, 0], [11, 0]),
    ).toEqual(['above10']);
    expect(scoreThresholdSoundsToPlay([11, 0], [12, 0])).toEqual([]);
  });

  it('déclenche au passage strictement en dessous du seuil bas', () => {
    expect(SCORE_THRESHOLD_BELOW).toBe(-10);
    expect(
      scoreThresholdSoundsToPlay([-10, 0], [-11, 0]),
    ).toEqual(['belowMinus10']);
    expect(scoreThresholdSoundsToPlay([-11, 0], [-12, 0])).toEqual([]);
  });

  it('peut combiner plusieurs joueurs / les deux types', () => {
    expect(
      scoreThresholdSoundsToPlay([0, 0, -10], [11, 0, -11]),
    ).toEqual(['above10', 'belowMinus10']);
  });
});
