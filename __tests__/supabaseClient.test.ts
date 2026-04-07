import { getSupabaseAnonKey, getSupabaseUrl } from '../src/config/env';
import { getSupabaseClient, getTypedSupabaseClient, resetSupabaseClientForTests } from '../src/data/supabaseClient';

describe('Client Supabase typé (ASC-47)', () => {
  const prevUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    resetSupabaseClientForTests();
    if (prevUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = prevUrl;
    if (prevKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = prevKey;
  });

  it('retourne null sans URL ou sans clé anon', () => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(getSupabaseUrl()).toBe('');
    expect(getSupabaseAnonKey()).toBe('');
    expect(getSupabaseClient()).toBeNull();
    expect(getTypedSupabaseClient()).toBeNull();
  });
});
