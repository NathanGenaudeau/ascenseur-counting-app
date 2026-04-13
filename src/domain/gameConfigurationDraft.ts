/**
 * Brouillon de configuration de partie (avant validation / persistance).
 * Modèle extensible : champs obligatoires minimaux + paramètres optionnels (ASC-8).
 */
export const PLAYER_COUNT_MIN = 3;
export const PLAYER_COUNT_MAX = 10;

export type GameDraftSettings = {
  /** Paramètres additionnels non bloquants pour le flux minimal. */
  extensions?: Record<string, unknown>;
  /** Exemple de paramètre optionnel (extensibilité UI). */
  notes?: string;
  /** Anciennes configs ; ignoré (pic défini en partie par « Descendre »). */
  maxCardsPerRound?: number;
};

export type PlayerSlotDraft = {
  /** Identifiant stable pour la liste (réordonnancement, clés React). */
  slotKey: string;
  /** Nom affiché (obligatoire pour démarrer si pas de contournement métier). */
  displayName: string;
  /** Si renseigné, référence un joueur persisté (ASC-25). */
  playerId?: string;
};

export function createSlotKey(): string {
  return `slot_${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

export type GameConfigurationDraft = {
  playerCount: number;
  slots: PlayerSlotDraft[];
  settings: GameDraftSettings;
};

export type GameConfigurationValidationResult = {
  valid: boolean;
  /** Erreurs par index de slot (nom vide, etc.) */
  slotErrors: Record<number, string>;
  playerCountError?: string;
  duplicateNamesError?: string;
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function ensureSlotsLength(slots: PlayerSlotDraft[], count: number): PlayerSlotDraft[] {
  const next = slots.slice(0, count).map((s) => ({
    ...s,
    slotKey: s.slotKey ?? createSlotKey(),
  }));
  while (next.length < count) {
    next.push({ displayName: '', slotKey: createSlotKey() });
  }
  return next;
}

export function createDefaultDraft(playerCount = 4): GameConfigurationDraft {
  const n = Math.min(PLAYER_COUNT_MAX, Math.max(PLAYER_COUNT_MIN, playerCount));
  return {
    playerCount: n,
    slots: Array.from({ length: n }, () => ({ displayName: '', slotKey: createSlotKey() })),
    settings: { extensions: {} },
  };
}

export function validateGameConfigurationDraft(draft: GameConfigurationDraft): GameConfigurationValidationResult {
  const slotErrors: Record<number, string> = {};

  if (
    typeof draft.playerCount !== 'number' ||
    draft.playerCount < PLAYER_COUNT_MIN ||
    draft.playerCount > PLAYER_COUNT_MAX
  ) {
    return {
      valid: false,
      slotErrors,
      playerCountError: `Le nombre de joueurs doit être entre ${PLAYER_COUNT_MIN} et ${PLAYER_COUNT_MAX}.`,
    };
  }

  if (draft.slots.length !== draft.playerCount) {
    return {
      valid: false,
      slotErrors,
      playerCountError: 'Le nombre de lignes joueur ne correspond pas au nombre de joueurs.',
    };
  }

  const names = draft.slots.map((s) => s.displayName.trim());

  for (let i = 0; i < names.length; i++) {
    if (names[i].length === 0) {
      slotErrors[i] = 'Nom requis';
    }
  }

  const norm = names.map(normalizeName);
  const seen = new Map<string, number>();
  let duplicateNamesError: string | undefined;

  for (let i = 0; i < names.length; i++) {
    if (names[i].length === 0) continue;
    const k = norm[i];
    if (seen.has(k)) {
      const j = seen.get(k)!;
      slotErrors[i] = slotErrors[i] ?? 'Nom en double';
      slotErrors[j] = slotErrors[j] ?? 'Nom en double';
      duplicateNamesError = 'Deux joueurs ont le même nom.';
    } else {
      seen.set(k, i);
    }
  }

  const valid = Object.keys(slotErrors).length === 0 && duplicateNamesError === undefined;

  return {
    valid,
    slotErrors: valid ? {} : slotErrors,
    duplicateNamesError,
  };
}

export function serializeGameConfigurationDraft(draft: GameConfigurationDraft): string {
  return JSON.stringify({
    version: 1 as const,
    playerCount: draft.playerCount,
    slots: draft.slots.map((s) => ({
      displayName: s.displayName,
      playerId: s.playerId,
      slotKey: s.slotKey,
    })),
    settings: draft.settings,
  });
}

export function parseGameConfigurationDraft(json: string): GameConfigurationDraft | null {
  try {
    const raw = JSON.parse(json) as unknown;
    if (typeof raw !== 'object' || raw === null) return null;
    const o = raw as Record<string, unknown>;
    if (o.version !== 1) return null;
    const playerCount = o.playerCount;
    const slots = o.slots;
    const settings = o.settings;
    if (typeof playerCount !== 'number') return null;
    if (!Array.isArray(slots)) return null;
    const parsedSlots: PlayerSlotDraft[] = slots.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        displayName: typeof r.displayName === 'string' ? r.displayName : '',
        playerId: typeof r.playerId === 'string' ? r.playerId : undefined,
        slotKey: typeof r.slotKey === 'string' ? r.slotKey : createSlotKey(),
      };
    });
    const parsedSettings: GameDraftSettings =
      typeof settings === 'object' && settings !== null && !Array.isArray(settings)
        ? (settings as GameDraftSettings)
        : { extensions: {} };
    return {
      playerCount,
      slots: ensureSlotsLength(parsedSlots, playerCount),
      settings: parsedSettings,
    };
  } catch {
    return null;
  }
}
