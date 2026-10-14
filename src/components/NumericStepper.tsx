import { useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { RadialImpactGraphic } from './RadialImpactGraphic';

/** Couleur des boutons ± à l'appui : série réussie (feu) ou ratée (glace). */
export type StepperTone = 'default' | 'fire' | 'ice';

const PRESSED_TONE: Record<Exclude<StepperTone, 'default'>, { bg: string; border: string; text: string }> = {
  fire: { bg: 'rgba(255, 106, 26, 0.32)', border: '#ff6a1a', text: '#ff4d2d' },
  ice: { bg: 'rgba(127, 220, 255, 0.28)', border: '#ffffff', text: '#bdf4ff' },
};

function StepButton({
  symbol,
  accessibilityLabel,
  testID,
  enabled,
  tone,
  onPress,
}: {
  symbol: string;
  accessibilityLabel: string;
  testID: string;
  enabled: boolean;
  tone: StepperTone;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const pressedTone = enabled && pressed && tone !== 'default' ? PRESSED_TONE[tone] : null;
  const defaultActive = tone === 'default' ? 'active:bg-star/20 active:border-star/50' : '';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={!enabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={`rounded-lg border px-3 py-1.5 ${
        enabled ? `border-hairline bg-panel-raised ${defaultActive}` : 'border-hairline/30 bg-panel-inset'
      }`}
      style={
        pressedTone
          ? {
              backgroundColor: pressedTone.bg,
              borderColor: pressedTone.border,
              shadowColor: pressedTone.border,
              shadowOpacity: 0.7,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }
          : undefined
      }
    >
      <Text
        className={`text-2xl font-bold leading-tight ${enabled ? 'text-cosmic-100' : 'text-cosmic-600'}`}
        style={pressedTone ? { color: pressedTone.text } : undefined}
      >
        {symbol}
      </Text>
    </Pressable>
  );
}

export type NumericStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  /** Si défini, colore la valeur centrale (vert = égal, rouge = écart). Les boutons ± restent neutres. */
  compareWith?: number;
  /** Préfixe des testID : `{testID}-minus`, `{testID}-value`, `{testID}-plus`. */
  testID?: string;
  /** Couleur des boutons ± à l'appui (feu / glace pendant une série). */
  tone?: StepperTone;
};

/**
 * Sélecteur − / valeur / + avec bounce sur la valeur + micro impact comics derrière la valeur.
 */
export function NumericStepper({
  value,
  onChange,
  min = 0,
  max,
  compareWith,
  testID = 'numeric-stepper',
  tone = 'default',
}: NumericStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [burstOpacity] = useState(() => new Animated.Value(0));
  const [burstScale] = useState(() => new Animated.Value(0.72));

  const bounce = () => {
    burstOpacity.setValue(0);
    burstScale.setValue(0.72);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.28, duration: 70, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(burstOpacity, { toValue: 1, duration: 38, useNativeDriver: true }),
        Animated.timing(burstOpacity, { toValue: 0, duration: 115, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(burstScale, { toValue: 1.18, duration: 55, useNativeDriver: true }),
        Animated.timing(burstScale, { toValue: 1.05, duration: 115, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const valueToneClass =
    compareWith === undefined
      ? 'text-cosmic-50'
      : value === compareWith
        ? 'text-emerald-400'
        : 'text-red-400';

  const handleMinus = () => {
    if (value > min) {
      bounce();
      onChange(value - 1);
    }
  };

  const handlePlus = () => {
    if (value < max) {
      bounce();
      onChange(value + 1);
    }
  };

  return (
    <View className="flex-row items-center justify-center gap-3">
      <StepButton
        symbol="−"
        accessibilityLabel="Diminuer"
        testID={`${testID}-minus`}
        enabled={canDecrement}
        tone={tone}
        onPress={handleMinus}
      />

      <View className="relative h-[52px] w-[76px] items-center justify-center">
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            opacity: burstOpacity,
            transform: [{ scale: burstScale }],
          }}
        >
          <RadialImpactGraphic size={74} />
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Text
            testID={`${testID}-value`}
            accessibilityLabel={`Valeur ${value}`}
            className={`min-w-[44px] text-center font-display text-2xl ${valueToneClass}`}
          >
            {String(value)}
          </Text>
        </Animated.View>
      </View>

      <StepButton
        symbol="+"
        accessibilityLabel="Augmenter"
        testID={`${testID}-plus`}
        enabled={canIncrement}
        tone={tone}
        onPress={handlePlus}
      />
    </View>
  );
}
