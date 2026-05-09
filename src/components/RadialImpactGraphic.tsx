import Svg, { Line } from 'react-native-svg';

import { ICON_ACCENT_HEX } from '../theme';

const NOVA = '#3dffc0';

type Props = {
  size?: number;
};

/** Rayons très courts façon comics (impact frame), sans animation. */
export function RadialImpactGraphic({ size = 72 }: Props) {
  const c = size / 2;
  const rays = [
    { a1: 0, len: 0.42 },
    { a1: 36, len: 0.38 },
    { a1: 72, len: 0.44 },
    { a1: 108, len: 0.36 },
    { a1: 144, len: 0.41 },
    { a1: 180, len: 0.39 },
    { a1: 216, len: 0.43 },
    { a1: 252, len: 0.37 },
    { a1: 288, len: 0.4 },
    { a1: 324, len: 0.35 },
  ];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rays.map(({ a1, len }, i) => {
        const rad = (a1 * Math.PI) / 180;
        const outer = (size * len) / 2;
        const x2 = c + Math.cos(rad) * outer;
        const y2 = c + Math.sin(rad) * outer;
        const color = i % 2 === 0 ? ICON_ACCENT_HEX : NOVA;
        return (
          <Line
            key={a1}
            x1={c}
            y1={c}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={i % 3 === 0 ? 2.2 : 1.4}
            strokeLinecap="round"
            opacity={0.55}
          />
        );
      })}
    </Svg>
  );
}
