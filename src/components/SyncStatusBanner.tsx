import { Pressable, Text, View } from 'react-native';

type Props = {
  unsyncedRounds: number;
  onRetry: () => void;
};

/** Signale un échec d’enregistrement côté serveur ; les données restent sur l’appareil. */
export function SyncStatusBanner({ unsyncedRounds, onRetry }: Props) {
  const detail =
    unsyncedRounds > 0
      ? `${unsyncedRounds} manche${unsyncedRounds > 1 ? 's' : ''} en attente d’envoi.`
      : 'La fin de partie n’est pas encore enregistrée.';
  return (
    <View
      testID="sync-error-banner"
      accessibilityRole="alert"
      className="mx-4 mb-3 flex-row items-center gap-3 rounded-xl border border-red-500/40 bg-red-950/40 px-3 py-2"
    >
      <Text className="min-w-0 flex-1 font-sans text-sm text-red-300">
        Synchronisation impossible. {detail}
      </Text>
      <Pressable
        testID="sync-retry-button"
        accessibilityRole="button"
        onPress={onRetry}
        className="shrink-0 rounded-lg border border-red-400/60 px-2.5 py-1.5 active:opacity-80"
      >
        <Text className="font-sans-medium text-sm text-red-300">Réessayer</Text>
      </Pressable>
    </View>
  );
}
