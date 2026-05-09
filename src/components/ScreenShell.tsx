import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode, ReactElement } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, Path, Pattern, Rect } from 'react-native-svg';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  testID?: string;
  edges?: Edge[];
};

const gradientColors = ['#1a0a24', '#000000', '#0a0018'] as const;

/** Hexagone pointy-top centré en (cx, cy) avec rayon r. */
function hexPath(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, k) => {
    const angle = (Math.PI / 3) * k + Math.PI / 6;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  });
  return `M ${pts[0]} ${pts.slice(1).map((p) => `L ${p}`).join(' ')} Z`;
}

const HEX_SPECS = [
  { rx: 0.08, ry: 0.05, r: 54 },
  { rx: 0.92, ry: 0.12, r: 34 },
  { rx: 0.78, ry: 0.44, r: 64 },
  { rx: 0.04, ry: 0.62, r: 38 },
  { rx: 0.55, ry: 0.84, r: 46 },
  { rx: 0.88, ry: 0.76, r: 26 },
  { rx: 0.28, ry: 0.28, r: 18 },
];

/** Motif léger façon papier/grain. */
function GrainDotsInPattern() {
  const out: ReactElement[] = [];
  for (let i = 0; i < 42; i++) {
    const x = ((i * 71 + 11) % 90) + 1;
    const y = ((i * 53 + 29) % 90) + 1;
    const o = 0.012 + (((i * 37) % 13) / 720);
    out.push(<Circle key={`grain-${i}`} cx={x} cy={y} r={0.72} fill="#f2effc" opacity={o} />);
  }
  return out;
}

function BackgroundOverlays() {
  const { width, height } = useWindowDimensions();
  const scanlineStep = 7;

  return (
    <Svg
      width={width}
      height={height}
      style={[StyleSheet.absoluteFillObject, { zIndex: 0 }]}
      pointerEvents="none"
    >
      <Defs>
        <Pattern id="scans" x="0" y="0" width={width} height={scanlineStep} patternUnits="userSpaceOnUse">
          <Line
            x1="0"
            y1="0"
            x2={width}
            y2="0"
            stroke="#ffffff"
            strokeWidth={0.5}
            strokeOpacity={0.022}
          />
        </Pattern>
        <Pattern id="grain" width="92" height="92" patternUnits="userSpaceOnUse">
          {GrainDotsInPattern()}
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#scans)" />
      <Rect x="0" y="0" width={width} height={height} fill="url(#grain)" opacity={0.85} />

      {HEX_SPECS.map(({ rx, ry, r }, i) => (
        <Path
          key={`hex-${i}`}
          d={hexPath(rx * width, ry * height, r)}
          fill="none"
          stroke="#ff2d78"
          strokeWidth={1.2}
          strokeOpacity={0.11}
        />
      ))}

      {/* Scribble 1 — boucle graffiti haut-gauche */}
      <G transform={`translate(${width * 0.02}, ${height * 0.04})`} opacity={0.22}>
        <Path
          d="M 4 48 C 22 12, 58 8, 96 36 S 74 88, 28 72"
          fill="none"
          stroke="#ff2d78"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 18 62 L 30 58 M 68 22 L 78 18 M 44 10 L 52 16"
          fill="none"
          stroke="#3dffc0"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </G>

      {/* Scribble 2 — trait centre-gauche */}
      <G transform={`translate(${width * 0.0}, ${height * 0.38})`} opacity={0.16}>
        <Path
          d="M 6 0 Q 40 14, 80 4 T 140 18"
          fill="none"
          stroke="#ff2d78"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 12 8 L 22 6 M 110 14 L 122 10"
          fill="none"
          stroke="#ff2d78"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </G>

      {/* Scribble 3 — boucle bas-centre menthe */}
      <G transform={`translate(${width * 0.48}, ${height * 0.76})`} opacity={0.18}>
        <Path
          d="M 8 20 Q 44 4, 120 24 T 180 44 Q 150 72, 88 88 Q 32 70, 8 20"
          fill="none"
          stroke="#3dffc0"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M 40 12 L 50 8 M 148 58 L 158 54"
          fill="none"
          stroke="#3dffc0"
          strokeWidth={1}
          strokeLinecap="round"
        />
      </G>

      {/* Scribble 4 — trait diagonal haut-droit */}
      <G transform={`translate(${width * 0.72}, ${height * 0.08}) rotate(18)`} opacity={0.18}>
        <Path
          d="M 4 62 C 32 42, 70 54, 88 82 M 94 74 L 118 94"
          fill="none"
          stroke="#ff2d78"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Path
          d="M 20 50 L 30 46"
          fill="none"
          stroke="#3dffc0"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      </G>

      {/* Scribble 5 — tag court milieu-droit */}
      <G transform={`translate(${width * 0.78}, ${height * 0.48})`} opacity={0.14}>
        <Path
          d="M 0 10 C 16 0, 42 4, 56 16 S 44 36, 20 28 C 8 22, 0 14, 0 10"
          fill="none"
          stroke="#3dffc0"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>

      {/* Scribble 6 — hachures bas-droit */}
      <G transform={`translate(${width * 0.84}, ${height * 0.82})`} opacity={0.13}>
        <Path
          d="M 0 0 L 32 24 M 10 0 L 42 24 M 20 0 L 52 24"
          fill="none"
          stroke="#ff2d78"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

/**
 * Fond dégradé violet diagonal + grain + hexagones + scribbles + scanlines.
 */
export function ScreenShell({ children, testID, edges = ['top', 'left', 'right'] }: Props) {
  return (
    <View className="flex-1 bg-void-950">
      <LinearGradient
        colors={[...gradientColors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView testID={testID} className="flex-1 bg-transparent" edges={edges} style={{ zIndex: 1 }}>
        {children}
      </SafeAreaView>
      <BackgroundOverlays />
    </View>
  );
}
