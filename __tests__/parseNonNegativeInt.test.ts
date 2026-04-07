import { parseNonNegativeIntText } from '../src/utils/parseNonNegativeInt';

describe('parseNonNegativeIntText', () => {
  it('parse des entiers positifs ou zéro', () => {
    expect(parseNonNegativeIntText('0')).toBe(0);
    expect(parseNonNegativeIntText(' 12 ')).toBe(12);
  });

  it('retourne null si vide ou non entier', () => {
    expect(parseNonNegativeIntText('')).toBeNull();
    expect(parseNonNegativeIntText('1.5')).toBeNull();
    expect(parseNonNegativeIntText('-3')).toBeNull();
  });
});
