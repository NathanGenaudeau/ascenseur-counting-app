import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Série à partir de laquelle l'effet atteint sa taille et son intensité maximales. */
const FULL_INTENSITY_STREAK = 10;
/** Première série affichée (badge à partir de 3) : intensité minimale non nulle. */
const FIRST_VISIBLE_STREAK = 3;

export type StreakVariant = 'fire' | 'ice';

export type StreakBackdropProps = {
  variant: StreakVariant;
  count: number;
  /** Graine pour garder les mêmes formes d'un rendu à l'autre (ex. index du joueur). */
  seed: number;
  testID?: string;
};

/** `core` / `tip` : trait et halo des fissures de glace. */
const PALETTE: Record<StreakVariant, { edge: string; core: string; tip: string; border: string }> = {
  ice: { edge: '#bdf4ff', core: '#ffffff', tip: '#7fdcff', border: '#9feaff' },
  fire: { edge: '#ff6a1a', core: '#ffd23f', tip: '#ff2d2d', border: '#ff8a3d' },
};

/** Intensité 0–1 de l'effet selon la série (≈ 0,15 à 3, 1 à partir de 10). */
export function streakIntensity(count: number): number {
  if (count < FIRST_VISIBLE_STREAK) return 0;
  const span = FULL_INTENSITY_STREAK - FIRST_VISIBLE_STREAK;
  return Math.min(1, 0.15 + (0.85 * (count - FIRST_VISIBLE_STREAK)) / span);
}

/**
 * Taille des effets de bord, proportionnelle à la carte : plus la série est longue,
 * plus la lueur et les formes avancent vers le centre (presque jusqu'au milieu à pleine intensité).
 */
export function streakEdgeGeometry(t: number, width: number, height: number) {
  const reach = 0.14 + t * 0.32;
  return {
    /** Épaisseur de la lueur sur les bords haut et bas. */
    bandY: height * reach,
    /** Épaisseur de la lueur sur les bords gauche et droit. */
    bandX: width * reach,
    edgeOpacity: 0.28 + t * 0.47,
    borderOpacity: 0.35 + t * 0.6,
    borderWidth: 1 + t * 1.5,
  };
}

/** PRNG déterministe (mulberry32) : formes « aléatoires » mais stables entre les rendus. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

type Edge = 'top' | 'bottom' | 'left' | 'right';

/** Profondeur maximale (px) atteinte depuis un bord, alignée sur la lueur du dégradé. */
function edgeReach(edge: Edge, width: number, height: number, t: number): number {
  const { bandX, bandY } = streakEdgeGeometry(t, width, height);
  return edge === 'top' || edge === 'bottom' ? bandY : bandX;
}

/** Point sur un bord et direction vers l'intérieur de la carte. */
function pointOnEdge(edge: Edge, along: number, depth: number, width: number, height: number) {
  switch (edge) {
    case 'top':
      return { x: along * width, y: depth, nx: 0, ny: 1 };
    case 'bottom':
      return { x: along * width, y: height - depth, nx: 0, ny: -1 };
    case 'left':
      return { x: depth, y: along * height, nx: 1, ny: 0 };
    case 'right':
      return { x: width - depth, y: along * height, nx: -1, ny: 0 };
  }
}

export type FireParticle = {
  kind: 'ember' | 'spark';
  cx: number;
  cy: number;
  r: number;
  /** Inclinaison des étincelles (degrés), qui montent en biais. */
  rotate: number;
  color: string;
  opacity: number;
};

const FIRE_COLORS = ['#fff3b0', '#ffd23f', '#ff8a3d', '#ff4d2d'] as const;

/**
 * Braises fines et étincelles allongées collées aux bords (surtout en bas), plus nombreuses,
 * grosses et avancées avec l'intensité. Jaune pâle au ras du bord, rouge en s'enfonçant.
 */
export function fireParticles(width: number, height: number, t: number, rand: () => number): FireParticle[] {
  const particles: FireParticle[] = [];
  const count = Math.round(14 + t * 50);
  for (let k = 0; k < count; k++) {
    const pick = rand();
    const edge: Edge = pick < 0.55 ? 'bottom' : pick < 0.75 ? 'left' : pick < 0.95 ? 'right' : 'top';
    // Puissance > 1 : densité plus forte près du bord.
    const depthRatio = rand() ** 1.7;
    const depth = depthRatio * edgeReach(edge, width, height, t);
    const { x, y } = pointOnEdge(edge, rand(), depth, width, height);
    const color = FIRE_COLORS[Math.min(FIRE_COLORS.length - 1, Math.floor(depthRatio * FIRE_COLORS.length))];
    particles.push({
      kind: edge !== 'top' && rand() < 0.35 ? 'spark' : 'ember',
      cx: x,
      cy: y,
      r: (0.5 + rand() * 1.1) * (1 + t * 0.7) * (1 - depthRatio * 0.3),
      rotate: (rand() - 0.5) * 40,
      color,
      opacity: (1 - depthRatio * 0.5) * (0.6 + t * 0.4),
    });
  }
  return particles;
}

export type IceCrack = { d: string; branch: boolean };

/**
 * Fissures qui partent des bords vers l'intérieur en zigzag, avec des embranchements.
 * Nombre, longueur et ramifications croissent avec l'intensité.
 */
export function iceCracks(width: number, height: number, t: number, rand: () => number): IceCrack[] {
  const cracks: IceCrack[] = [];
  const clampX = (v: number) => Math.min(width, Math.max(0, v));
  const clampY = (v: number) => Math.min(height, Math.max(0, v));

  const walk = (x0: number, y0: number, angle: number, length: number, branch: boolean, depth: number) => {
    let x = x0;
    let y = y0;
    let a = angle;
    let left = length;
    let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
    while (left > 0) {
      const step = Math.min(left, 4 + rand() * 6);
      a += (rand() - 0.5) * 0.9;
      x = clampX(x + Math.cos(a) * step);
      y = clampY(y + Math.sin(a) * step);
      d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      left -= step;
      if (depth < 2 && left > 8 && rand() < 0.1 + t * 0.12) {
        const side = rand() < 0.5 ? -1 : 1;
        walk(x, y, a + side * (0.5 + rand() * 0.6), left * (0.35 + rand() * 0.3), true, depth + 1);
      }
    }
    cracks.push({ d, branch });
  };

  const edges: Edge[] = ['top', 'bottom', 'left', 'right'];
  const count = 3 + Math.round(t * 5);
  for (let k = 0; k < count; k++) {
    const edge = edges[Math.floor(rand() * edges.length)];
    const { x, y, nx, ny } = pointOnEdge(edge, 0.08 + rand() * 0.84, 0, width, height);
    const angle = Math.atan2(ny, nx) + (rand() - 0.5) * 1.1;
    walk(x, y, angle, edgeReach(edge, width, height, t) * (0.6 + rand() * 0.5), false, 0);
  }
  return cracks;
}

/**
 * Fond de carte « en série » : la carte se givre (ou s'embrase) depuis les bords,
 * de plus en plus fort et loin vers le centre à mesure que la série s'allonge.
 * Le parent doit être en `overflow-hidden` et rendre ce composant avant son contenu.
 */
export function StreakBackdrop({ variant, count, seed, testID }: StreakBackdropProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const t = streakIntensity(count);
  const colors = PALETTE[variant];

  const onLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    const height = Math.round(e.nativeEvent.layout.height);
    if (!size || size.width !== width || size.height !== height) {
      setSize({ width, height });
    }
  };

  const particles = useMemo(
    () =>
      size && variant === 'fire' ? fireParticles(size.width, size.height, t, mulberry32(seed * 104729 + 3)) : [],
    [size, seed, variant, t],
  );
  const cracks = useMemo(
    () => (size && variant === 'ice' ? iceCracks(size.width, size.height, t, mulberry32(seed * 104729 + 7)) : []),
    [size, seed, variant, t],
  );

  if (t <= 0) {
    return null;
  }

  // Ids uniques par carte : sur le web, les ids SVG sont globaux au document.
  const gid = `streak-${variant}-${seed}`;
  const geo = size ? streakEdgeGeometry(t, size.width, size.height) : null;

  /** Dégradé du bord vers l'intérieur : soutenu près du bord, s'éteint en approchant du centre. */
  const edgeStops = (edgeOpacity: number) => [
    <Stop key="edge" offset="0" stopColor={colors.edge} stopOpacity={edgeOpacity} />,
    <Stop key="mid" offset="0.45" stopColor={colors.edge} stopOpacity={edgeOpacity * 0.45} />,
    <Stop key="center" offset="1" stopColor={colors.edge} stopOpacity={0} />,
  ];

  return (
    <View
      testID={testID}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}
    >
      {size && geo ? (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`${gid}-edgeTop`} x1="0" y1="0" x2="0" y2="1">
              {edgeStops(geo.edgeOpacity)}
            </LinearGradient>
            <LinearGradient id={`${gid}-edgeBottom`} x1="0" y1="1" x2="0" y2="0">
              {edgeStops(geo.edgeOpacity)}
            </LinearGradient>
            <LinearGradient id={`${gid}-edgeLeft`} x1="0" y1="0" x2="1" y2="0">
              {edgeStops(geo.edgeOpacity)}
            </LinearGradient>
            <LinearGradient id={`${gid}-edgeRight`} x1="1" y1="0" x2="0" y2="0">
              {edgeStops(geo.edgeOpacity)}
            </LinearGradient>
          </Defs>
          <Rect
            testID={testID ? `${testID}-edge-top` : undefined}
            x={0}
            y={0}
            width={size.width}
            height={geo.bandY}
            fill={`url(#${gid}-edgeTop)`}
          />
          <Rect
            x={0}
            y={size.height - geo.bandY}
            width={size.width}
            height={geo.bandY}
            fill={`url(#${gid}-edgeBottom)`}
          />
          <Rect x={0} y={0} width={geo.bandX} height={size.height} fill={`url(#${gid}-edgeLeft)`} />
          <Rect
            x={size.width - geo.bandX}
            y={0}
            width={geo.bandX}
            height={size.height}
            fill={`url(#${gid}-edgeRight)`}
          />
          {particles.map((p, i) => (
            // Halo serré puis cœur : aspect incandescent sans filtre de flou.
            <G key={`ember-${i}`} transform={`rotate(${p.rotate} ${p.cx} ${p.cy})`}>
              <Ellipse
                cx={p.cx}
                cy={p.cy}
                rx={p.r * 1.9}
                ry={p.r * (p.kind === 'spark' ? 3.2 : 1.9)}
                fill={p.color}
                opacity={p.opacity * 0.28}
              />
              <Ellipse
                cx={p.cx}
                cy={p.cy}
                rx={p.kind === 'spark' ? p.r * 0.6 : p.r}
                ry={p.kind === 'spark' ? p.r * 2 : p.r}
                fill={p.color}
                opacity={p.opacity}
              />
            </G>
          ))}
          {cracks.map((c, i) => (
            <G key={`crack-${i}`}>
              <Path
                d={c.d}
                fill="none"
                stroke={colors.tip}
                strokeOpacity={0.18 + t * 0.2}
                strokeWidth={c.branch ? 2.2 : 3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d={c.d}
                fill="none"
                stroke={colors.core}
                strokeOpacity={(c.branch ? 0.45 : 0.6) + t * 0.3}
                strokeWidth={c.branch ? 0.7 : 1.1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          ))}
        </Svg>
      ) : null}

      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 12,
            borderWidth: geo?.borderWidth ?? 1,
            borderColor: colors.border,
            opacity: geo?.borderOpacity ?? 0.35,
          },
        ]}
      />
    </View>
  );
}
