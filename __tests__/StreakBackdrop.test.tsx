import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  fireParticles,
  iceCracks,
  StreakBackdrop,
  streakEdgeGeometry,
  streakIntensity,
} from '../src/components/StreakBackdrop';

/** Aléa déterministe pour les tests. */
function seq(seed = 1) {
  let x = seed;
  return () => {
    x = (x * 16807) % 2147483647;
    return x / 2147483647;
  };
}

describe('streakIntensity', () => {
  it('est nulle sous 3, croît avec la série et plafonne à 10', () => {
    expect(streakIntensity(2)).toBe(0);
    expect(streakIntensity(3)).toBeGreaterThan(0);
    expect(streakIntensity(6)).toBeGreaterThan(streakIntensity(5));
    expect(streakIntensity(10)).toBe(1);
    expect(streakIntensity(15)).toBe(1);
  });
});

describe('streakEdgeGeometry', () => {
  it('avance vers le centre et s’intensifie avec la série, sans dépasser le milieu', () => {
    const small = streakEdgeGeometry(streakIntensity(3), 160, 120);
    const big = streakEdgeGeometry(streakIntensity(10), 160, 120);
    expect(big.bandX).toBeGreaterThan(small.bandX);
    expect(big.bandY).toBeGreaterThan(small.bandY);
    expect(big.edgeOpacity).toBeGreaterThan(small.edgeOpacity);
    expect(big.bandX).toBeLessThan(160 / 2);
    expect(big.bandY).toBeLessThan(120 / 2);
  });
});

describe('fireParticles', () => {
  it('ajoute des braises avec la série et les garde dans la carte', () => {
    const few = fireParticles(160, 120, streakIntensity(3), seq());
    const many = fireParticles(160, 120, streakIntensity(10), seq());
    expect(many.length).toBeGreaterThan(few.length);
    for (const p of many) {
      expect(p.cx).toBeGreaterThanOrEqual(0);
      expect(p.cx).toBeLessThanOrEqual(160);
      expect(p.cy).toBeGreaterThanOrEqual(0);
      expect(p.cy).toBeLessThanOrEqual(120);
    }
  });
});

describe('iceCracks', () => {
  it('ajoute des fissures avec la série, sans sortir de la carte', () => {
    const few = iceCracks(160, 120, streakIntensity(3), seq());
    const many = iceCracks(160, 120, streakIntensity(10), seq());
    expect(many.filter((c) => !c.branch).length).toBeGreaterThan(few.filter((c) => !c.branch).length);
    for (const c of many) {
      for (const [, x, y] of c.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(x)).toBeLessThanOrEqual(160);
        expect(Number(y)).toBeGreaterThanOrEqual(0);
        expect(Number(y)).toBeLessThanOrEqual(120);
      }
    }
  });
});

describe('StreakBackdrop', () => {
  it('ne rend rien sous le seuil de série', () => {
    render(<StreakBackdrop testID="bd" variant="fire" count={2} seed={0} />);
    expect(screen.queryByTestId('bd', { includeHiddenElements: true })).toBeNull();
  });

  it('dessine les bords sans emoji en fond', () => {
    // Le fond est masqué aux lecteurs d'écran : il faut inclure les éléments cachés.
    const hidden = { includeHiddenElements: true };
    render(<StreakBackdrop testID="bd" variant="ice" count={5} seed={1} />);
    fireEvent(screen.getByTestId('bd', hidden), 'layout', {
      nativeEvent: { layout: { width: 160, height: 120 } },
    });
    expect(screen.getByTestId('bd-edge-top', hidden)).toBeTruthy();
    expect(screen.queryByText('❄️', hidden)).toBeNull();
    expect(screen.queryByText('🔥', hidden)).toBeNull();
  });
});
