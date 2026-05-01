import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScoreEvolutionChart } from '../components/ScoreEvolutionChart';
import type { FinishedGameRecord } from '../domain/finishedGameRecord';
import { buildFinalRanking } from '../domain/gameOutcome';
import { computeCumulativeScores } from '../domain/scoring';
import { deleteCompletedGame, loadCompletedGames } from '../services/completedGamesStorage';

function formatEndedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function HistoryScreen() {
  const [games, setGames] = useState<FinishedGameRecord[]>([]);
  const [selected, setSelected] = useState<FinishedGameRecord | null>(null);
  const isFocused = useIsFocused();

  const refreshGames = useCallback(async () => {
    const list = await loadCompletedGames();
    setGames(list);
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;
    void (async () => {
      const list = await loadCompletedGames();
      if (!cancelled) setGames(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [isFocused]);

  const requestDeleteGame = useCallback(
    (game: FinishedGameRecord, afterDelete: () => void) => {
      Alert.alert(
        'Supprimer la partie ?',
        'Toutes les données de cette partie (manches, scores, participants liés à la partie) seront définitivement supprimées.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              void (async () => {
                const ok = await deleteCompletedGame(game.id);
                if (ok) {
                  afterDelete();
                  await refreshGames();
                } else {
                  Alert.alert('Erreur', 'La suppression a échoué. Vérifiez la connexion ou réessayez.');
                }
              })();
            },
          },
        ],
      );
    },
    [refreshGames],
  );

  if (selected) {
    const cum = computeCumulativeScores(selected.roundsCompleted, selected.playerNames.length);
    const ranking = buildFinalRanking(selected.playerNames, cum);
    const winnerLabel = ranking.filter((r) => r.rank === 1).map((r) => r.displayName).join(', ');

    return (
      <SafeAreaView testID="screen-history" className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="px-4 pb-8">
            <Pressable
              testID="history-back-button"
              accessibilityRole="button"
              onPress={() => setSelected(null)}
              className="mb-4 py-2"
            >
              <Text className="text-base font-medium text-secondary-800">← Retour</Text>
            </Pressable>
            <Text className="mb-1 text-xl font-semibold text-primary-900">Détail de la partie</Text>
            <Text testID="history-detail-date" className="mb-1 text-sm text-secondary-700">
              {formatEndedAt(selected.endedAt)}
            </Text>
            <Text className="mb-4 text-sm text-secondary-800">
              {selected.roundsCompleted.length} manche{selected.roundsCompleted.length > 1 ? 's' : ''}
              {winnerLabel ? ` · Gagnant : ${winnerLabel}` : ''}
            </Text>

            <Text className="mb-2 text-sm font-medium text-primary-800">Classement final</Text>
            <View className="mb-6 rounded-xl border border-primary-200 bg-primary-50 p-3">
              {ranking.map((row, i) => (
                <View
                  key={`${row.playerIndex}-${i}`}
                  testID={`history-detail-rank-${i}`}
                  className="mb-2 flex-row items-center justify-between last:mb-0"
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="w-8 text-base font-semibold text-primary-600">{row.rank}.</Text>
                    <Text className="text-base text-primary-900">{row.displayName}</Text>
                  </View>
                  <Text className="text-base font-semibold text-primary-900">{row.totalScore}</Text>
                </View>
              ))}
            </View>

            <ScoreEvolutionChart
              roundsCompleted={selected.roundsCompleted}
              playerNames={selected.playerNames}
            />

            <Pressable
              testID="history-detail-delete"
              accessibilityRole="button"
              onPress={() =>
                requestDeleteGame(selected, () => {
                  setSelected(null);
                })
              }
              className="mt-8 rounded-xl border border-red-200 bg-red-50 py-3 active:bg-red-100"
            >
              <Text className="text-center text-base font-medium text-red-700">Supprimer cette partie</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="screen-history" className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View className="border-b border-primary-200 px-4 pb-3 pt-2">
        <Text className="text-xl font-semibold text-primary-900">Historique</Text>
      </View>
      <FlatList
        testID="history-list"
        data={games}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12 }}
        ListEmptyComponent={
          <Text testID="history-empty" className="text-center text-secondary-700">
            Aucune partie enregistrée pour le moment. Terminez une partie depuis l’onglet Partie.
          </Text>
        }
        renderItem={({ item }) => {
          const n = item.roundsCompleted.length;
          return (
            <View className="mb-3 flex-row overflow-hidden rounded-xl border border-primary-200 bg-primary-50">
              <Pressable
                testID={`history-item-${item.id}`}
                accessibilityRole="button"
                onPress={() => setSelected(item)}
                className="min-w-0 flex-1 p-4 active:bg-primary-100"
              >
                <Text className="text-base font-medium text-primary-900">{formatEndedAt(item.endedAt)}</Text>
                <Text className="mt-1 text-sm text-secondary-800" numberOfLines={2}>
                  {item.playerNames.join(', ')}
                </Text>
                <Text className="mt-2 text-xs text-neutral-500">
                  {n} manche{n > 1 ? 's' : ''}
                </Text>
              </Pressable>
              <Pressable
                testID={`history-delete-${item.id}`}
                accessibilityRole="button"
                accessibilityLabel="Supprimer la partie"
                onPress={() => requestDeleteGame(item, () => { })}
                className="justify-center border-l border-primary-200 px-3 active:bg-red-50"
              >
                <Text className="text-sm font-medium text-red-600">Supprimer</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
