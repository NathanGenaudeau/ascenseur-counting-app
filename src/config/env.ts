export type AppEnv = 'development' | 'preview' | 'production';

/**
 * Environnement applicatif dérivé de variables `EXPO_PUBLIC_*` (incluses au build).
 * Ne jamais y exposer de secrets : réservé aux drapeaux non sensibles (URL publiques, noms d’environnement).
 */
export function getAppEnv(): AppEnv {
  const raw = process.env.EXPO_PUBLIC_APP_ENV;
  if (raw === 'preview' || raw === 'production') {
    return raw;
  }
  return 'development';
}

/**
 * URL publique de l’API (sans chemin final). Non secret.
 */
export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? '';
}

/**
 * URL du projet Supabase (`https://xxx.supabase.co`). Non secret.
 */
export function getSupabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
}

/**
 * Clé publique « anon » Supabase (prévue pour le client, protégée par RLS).
 * Ne jamais y mettre la service role key.
 */
export function getSupabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
}
