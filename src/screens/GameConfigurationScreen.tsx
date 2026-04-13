import { StatusBar } from 'expo-status-bar';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGameConfiguration } from '../context/GameConfigurationContext';
import { PLAYER_COUNT_MAX, PLAYER_COUNT_MIN } from '../domain/gameConfigurationDraft';
import type { PlayerDocument } from '../domain/player';

export function GameConfigurationScreen() {
  const {
    draft,
    validation,
    startError,
    isStartingGame,
    clearStartError,
    setPlayerCount,
    setSlotName,
    setSlotFromPlayer,
    setSlotsOrder,
    setNotes,
    loadLastSavedConfiguration,
    startGame,
    fetchExistingPlayers,
  } = useGameConfiguration();

  const [modalIndex, setModalIndex] = useState<number | null>(null);
  const [pickerPlayers, setPickerPlayers] = useState<PlayerDocument[]>([]);

  useEffect(() => {
    if (modalIndex === null) return;
    let cancelled = false;
    void fetchExistingPlayers().then((list) => {
      if (!cancelled) setPickerPlayers(list);
    });
    return () => {
      cancelled = true;
    };
  }, [modalIndex, fetchExistingPlayers]);

  const openPicker = useCallback((index: number) => {
    setModalIndex(index);
  }, []);

  const closePicker = useCallback(() => setModalIndex(null), []);

  const onPickPlayer = useCallback(
    (player: PlayerDocument) => {
      if (modalIndex === null) return;
      setSlotFromPlayer(modalIndex, player);
      closePicker();
    },
    [modalIndex, setSlotFromPlayer, closePicker],
  );

  const moveSlot = useCallback(
    (fromIndex: number, direction: -1 | 1) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= draft.slots.length) return;
      const next = [...draft.slots];
      const a = next[fromIndex]!;
      const b = next[toIndex]!;
      next[fromIndex] = b;
      next[toIndex] = a;
      setSlotsOrder(next);
    },
    [draft.slots, setSlotsOrder],
  );

  return (
    <SafeAreaView testID="app-root" className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          testID="game-config-scroll"
          keyboardShouldPersistTaps="handled"
          className="flex-1"
        >
          <View className="px-4 pb-8 pt-2">
            <View className="mb-6 items-center">
              <Text className="mb-2 text-center text-sm font-medium text-neutral-700">
                Nombre de joueurs
              </Text>
              <View testID="player-count-row" className="flex-row items-center justify-center gap-4">
                <Pressable
                  testID="player-count-minus"
                  accessibilityRole="button"
                  disabled={draft.playerCount <= PLAYER_COUNT_MIN}
                  onPress={() => setPlayerCount(draft.playerCount - 1)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 active:bg-neutral-100"
                >
                  <Text className="text-lg">−</Text>
                </Pressable>
                <Text
                  testID="player-count-value"
                  className="min-w-[32px] text-center text-xl font-semibold"
                >
                  {draft.playerCount}
                </Text>
                <Pressable
                  testID="player-count-plus"
                  accessibilityRole="button"
                  disabled={draft.playerCount >= PLAYER_COUNT_MAX}
                  onPress={() => setPlayerCount(draft.playerCount + 1)}
                  className="rounded-lg border border-neutral-300 px-4 py-2 active:bg-neutral-100"
                >
                  <Text className="text-lg">+</Text>
                </Pressable>
              </View>
            </View>

            <Text className="mb-2 text-sm font-medium text-neutral-700">Notes (optionnel)</Text>
            <TextInput
              testID="optional-notes-input"
              value={draft.settings.notes ?? ''}
              onChangeText={setNotes}
              placeholder="Remarques sur la partie…"
              multiline
              className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-900"
            />

            {draft.slots.map((slot, index) => (
              <View key={slot.slotKey} testID={`player-slot-${index}`} className="mb-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-xs text-neutral-500">Joueur {index + 1}</Text>
                  <View className="flex-row items-center gap-1">
                    <Pressable
                      testID={`player-move-up-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel="Monter le joueur"
                      disabled={index === 0}
                      onPress={() => moveSlot(index, -1)}
                      className={`rounded-md p-2 ${index === 0 ? 'opacity-30' : 'active:bg-neutral-100'}`}
                    >
                      <ChevronUp size={20} color="#404040" />
                    </Pressable>
                    <Pressable
                      testID={`player-move-down-${index}`}
                      accessibilityRole="button"
                      accessibilityLabel="Descendre le joueur"
                      disabled={index >= draft.slots.length - 1}
                      onPress={() => moveSlot(index, 1)}
                      className={`rounded-md p-2 ${index >= draft.slots.length - 1 ? 'opacity-30' : 'active:bg-neutral-100'}`}
                    >
                      <ChevronDown size={20} color="#404040" />
                    </Pressable>
                  </View>
                </View>
                <View className="flex-row items-stretch gap-2">
                  <TextInput
                    testID={`player-name-input-${index}`}
                    value={slot.displayName}
                    onChangeText={(t) => setSlotName(index, t)}
                    placeholder="Nom affiché"
                    autoCapitalize="words"
                    className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
                  />
                  <Pressable
                    testID={`pick-player-button-${index}`}
                    accessibilityRole="button"
                    onPress={() => openPicker(index)}
                    className="shrink-0 justify-center rounded-md bg-neutral-100 px-2 py-2"
                  >
                    <Text className="text-center text-xs text-neutral-800">
                      Choisir un joueur existant
                    </Text>
                  </Pressable>
                </View>
                {validation.slotErrors[index] ? (
                  <Text testID={`player-slot-error-${index}`} className="mt-1 text-sm text-red-600">
                    {validation.slotErrors[index]}
                  </Text>
                ) : null}
              </View>
            ))}

            {validation.duplicateNamesError ? (
              <Text testID="duplicate-names-message" className="mb-4 text-sm text-red-600">
                {validation.duplicateNamesError}
              </Text>
            ) : null}

            {startError ? (
              <Text testID="start-error-message" className="mb-4 text-sm text-red-600">
                {startError}
              </Text>
            ) : null}

            <Pressable
              testID="load-last-config-button"
              accessibilityRole="button"
              onPress={() => {
                clearStartError();
                void loadLastSavedConfiguration();
              }}
              className="mb-4 rounded-lg border border-neutral-300 py-3"
            >
              <Text className="text-center text-neutral-800">
                Reprendre la dernière configuration
              </Text>
            </Pressable>

            <Pressable
              testID="start-game-button"
              accessibilityRole="button"
              accessibilityState={{ disabled: !validation.valid || isStartingGame }}
              disabled={!validation.valid || isStartingGame}
              onPress={() => {
                clearStartError();
                void startGame();
              }}
              className={`rounded-xl py-4 ${validation.valid && !isStartingGame ? 'bg-neutral-900' : 'bg-neutral-300'}`}
            >
              <Text
                className={`text-center text-base font-semibold ${validation.valid && !isStartingGame ? 'text-white' : 'text-neutral-500'}`}
              >
                {isStartingGame ? 'Démarrage…' : 'Démarrer la partie'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalIndex !== null} animationType="slide" onRequestClose={closePicker}>
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-3">
            <Text className="text-lg font-semibold">Joueurs enregistrés</Text>
            <Pressable testID="close-player-picker" onPress={closePicker}>
              <Text className="text-base text-blue-600">Fermer</Text>
            </Pressable>
          </View>
          <FlatList
            testID="existing-players-list"
            data={pickerPlayers}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <Text className="px-4 py-8 text-center text-neutral-500">
                Aucun joueur — saisissez un nom manuellement ou vérifiez la connexion à l’API.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                testID={`existing-player-row-${item._id}`}
                className="border-b border-neutral-100 px-4 py-4"
                onPress={() => onPickPlayer(item)}
              >
                <Text className="text-base text-neutral-900">{item.displayName}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
