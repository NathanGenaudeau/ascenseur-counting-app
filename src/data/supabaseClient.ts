import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAnonKey, getSupabaseUrl } from '../config/env';

import type { Database } from './database.types';

let singleton: SupabaseClient<Database> | null | undefined;

/**
 * Client Supabase typé (Postgres + Auth + Realtime selon configuration projet).
 * Compatible Expo : variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
 * Retourne `null` si l’URL ou la clé anon est absente.
 */
export function getTypedSupabaseClient(): SupabaseClient<Database> | null {
  if (singleton !== undefined) {
    return singleton;
  }
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    singleton = null;
    return null;
  }
  singleton = createClient<Database>(url, key);
  return singleton;
}

/** Alias historique — préférer `getTypedSupabaseClient` pour la clarté ASC-47. */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  return getTypedSupabaseClient();
}

/** Tests uniquement : réinitialise le singleton. */
export function resetSupabaseClientForTests(): void {
  singleton = undefined;
}
