import React, { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { RadialImpactGraphic } from './RadialImpactGraphic';

export type NumericStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  /** Si défini, colore la valeur centrale (vert = égal, rouge = écart). Les boutons ± restent neutres. */
  compareWith?: number;
  /** Préfixe des testID : `{testID}-minus`, `{testID}-value`, `{testID}-plus`. */
  testID?: string;
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
}: NumericStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const burstScale = useRef(new Animated.Value(0.72)).current;

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
      <Pressable
        testID={`${testID}-minus`}
        accessibilityRole="button"
        accessibilityLabel="Diminuer"
        disabled={!canDecrement}
        onPress={handleMinus}
        className={`rounded-lg border px-3 py-1.5 ${
          canDecrement
            ? 'border-hairline bg-panel-raised active:bg-star/20 active:border-star/50'
            : 'border-hairline/30 bg-panel-inset'
        }`}
      >
        <Text
          className={`text-2xl font-bold leading-tight ${
            canDecrement ? 'text-cosmic-100' : 'text-cosmic-600'
          }`}
        >
          −
        </Text>
      </Pressable>

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

      <Pressable
        testID={`${testID}-plus`}
        accessibilityRole="button"
        accessibilityLabel="Augmenter"
        disabled={!canIncrement}
        onPress={handlePlus}
        className={`rounded-lg border px-3 py-1.5 ${
          canIncrement
            ? 'border-hairline bg-panel-raised active:bg-star/20 active:border-star/50'
            : 'border-hairline/30 bg-panel-inset'
        }`}
      >
        <Text
          className={`text-2xl font-bold leading-tight ${
            canIncrement ? 'text-cosmic-100' : 'text-cosmic-600'
          }`}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}
