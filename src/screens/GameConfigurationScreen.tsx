import { Layers } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
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
          <View className="px-4 pb-8">
            <View className="mb-6 items-center">
              <View testID="app-brand-icon" className="mb-2 items-center justify-center">
                <Layers accessibilityLabel="Ascenseur" size={28} color="#171717" />
              </View>
              <Text className="mb-1 text-2xl font-semibold text-neutral-900">Ascenseur</Text>
              <Text className="text-base text-neutral-600">Suivi de parties</Text>
            </View>

            <Text className="mb-2 text-sm font-medium text-neutral-700">Nombre de joueurs</Text>
            <View testID="player-count-row" className="mb-6 flex-row items-center gap-4">
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

            <Text className="mb-2 text-sm font-medium text-neutral-700">Notes (optionnel)</Text>
            <TextInput
              testID="optional-notes-input"
              value={draft.settings.notes ?? ''}
              onChangeText={setNotes}
              placeholder="Remarques sur la partie…"
              multiline
              className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-900"
            />

            <Text className="mb-2 text-sm font-medium text-neutral-700">Joueurs</Text>
            {draft.slots.map((slot, index) => (
              <View key={index} testID={`player-slot-${index}`} className="mb-4">
                <Text className="mb-1 text-xs text-neutral-500">Joueur {index + 1}</Text>
                <TextInput
                  testID={`player-name-input-${index}`}
                  value={slot.displayName}
                  onChangeText={(t) => setSlotName(index, t)}
                  placeholder="Nom affiché"
                  autoCapitalize="words"
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900"
                />
                {validation.slotErrors[index] ? (
                  <Text testID={`player-slot-error-${index}`} className="mt-1 text-sm text-red-600">
                    {validation.slotErrors[index]}
                  </Text>
                ) : null}
                <Pressable
                  testID={`pick-player-button-${index}`}
                  accessibilityRole="button"
                  onPress={() => openPicker(index)}
                  className="mt-2 self-start rounded-md bg-neutral-100 px-3 py-2"
                >
                  <Text className="text-sm text-neutral-800">Choisir un joueur existant</Text>
                </Pressable>
                {slot.playerId ? (
                  <Text
                    testID={`player-linked-id-${index}`}
                    className="mt-1 text-xs text-neutral-500"
                  >
                    Réf. joueur : {slot.playerId}
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
