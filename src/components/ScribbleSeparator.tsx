import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ICON_ACCENT_HEX } from '../theme';

const NOVA_STROKE = '#3dffc0';

type Props = {
  accent?: 'star' | 'nova';
  /** Hauteur réservée (les traits dépassent très légèrement). */
  className?: string;
};

/** Trait type graffiti / crayon pour introduire une section sans remplacer le texte. */
export function ScribbleSeparator({ accent = 'star', className }: Props) {
  const stroke = accent === 'star' ? ICON_ACCENT_HEX : NOVA_STROKE;

  return (
    <View className={className} style={{ width: 80, height: 16 }}>
      <Svg width={80} height={16} viewBox="0 0 80 16">
        <Path
          d="M 0 8 Q 11 13 26 9 T 52 11 Q 62 13 76 10"
          fill="none"
          stroke={stroke}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
        <Path
          d="M 4 12 L 9 11 M 72 13 L 78 14 M 58 8 L 64 10"
          fill="none"
          stroke={stroke}
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.65}
        />
      </Svg>
    </View>
  );
}
