import React from 'react';
import { Pressable, Text, View } from 'react-native';

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
 * Sélecteur − / valeur / + pour entiers bornés (plis annoncés, etc.).
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

  const valueToneClass =
    compareWith === undefined
      ? 'text-primary-900'
      : value === compareWith
        ? 'text-emerald-600'
        : 'text-red-600';

  const handleMinus = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handlePlus = () => {
    if (value < max) {
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
          canDecrement ? 'border-primary-300 bg-white active:bg-primary-50' : 'border-primary-200 bg-primary-50'
        }`}
      >
        <Text
          className={`text-2xl font-semibold leading-tight ${canDecrement ? 'text-primary-900' : 'text-primary-300'}`}
        >
          −
        </Text>
      </Pressable>
      <Text
        testID={`${testID}-value`}
        accessibilityLabel={`Valeur ${value}`}
        className={`min-w-[40px] text-center text-xl font-semibold ${valueToneClass}`}
      >
        {String(value)}
      </Text>
      <Pressable
        testID={`${testID}-plus`}
        accessibilityRole="button"
        accessibilityLabel="Augmenter"
        disabled={!canIncrement}
        onPress={handlePlus}
        className={`rounded-lg border px-3 py-1.5 ${
          canIncrement ? 'border-primary-300 bg-white active:bg-primary-50' : 'border-primary-200 bg-primary-50'
        }`}
      >
        <Text
          className={`text-2xl font-semibold leading-tight ${canIncrement ? 'text-primary-900' : 'text-primary-300'}`}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}
