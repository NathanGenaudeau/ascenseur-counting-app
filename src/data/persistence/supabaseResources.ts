/**
 * Noms de tables Postgres (schéma public, Supabase) et segments d’URL REST (`/v1/...`).
 * Les clés TypeScript restent en camelCase ; les valeurs SQL sont en snake_case.
 */
export const SUPABASE_TABLE = {
  players: 'players',
  games: 'games',
  gamePlayers: 'game_players',
  rounds: 'rounds',
  roundResults: 'round_results',
  gameConfigTemplates: 'game_config_templates',
  gameConfigTemplatePlayers: 'game_config_template_players',
} as const;

export type SupabaseTableName = (typeof SUPABASE_TABLE)[keyof typeof SUPABASE_TABLE];

/** Préfixe d’API pour toutes les ressources persistées (Edge Functions ou proxy HTTP). */
export const PERSISTENCE_API_PREFIX = '/v1';

/**
 * Segments d’URL REST (kebab-case) alignés backend.
 */
export const REST_RESOURCE_SEGMENT: Record<keyof typeof SUPABASE_TABLE, string> = {
  players: 'players',
  games: 'games',
  gamePlayers: 'game-players',
  rounds: 'rounds',
  roundResults: 'round-results',
  gameConfigTemplates: 'game-config-templates',
  gameConfigTemplatePlayers: 'game-config-template-players',
};
