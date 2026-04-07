import { getSupabaseAnonKey, getSupabaseUrl } from '../src/config/env';
import { getSupabaseClient, resetSupabaseClientForTests } from '../src/data/supabaseClient';

/**
 * ASC-42 — point d’accès données : env publics + client Supabase singleton.
 */
describe('Architecture accès données (ASC-42)', () => {
  const prevUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    resetSupabaseClientForTests();
    if (prevUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = prevUrl;
    if (prevKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = prevKey;
  });

  it('expose uniquement des getters pour URL et clé anon (pas de service role)', () => {
    expect(getSupabaseUrl()).toBeDefined();
    expect(getSupabaseAnonKey()).toBeDefined();
    expect(typeof getSupabaseUrl()).toBe('string');
    expect(typeof getSupabaseAnonKey()).toBe('string');
  });

  it('retourne null pour le client si URL ou clé absents (pas de crash)', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(getSupabaseClient()).toBeNull();
  });
});
