/** Accès aux données, clients API et mappages vers les modèles métier. */

export { createApiClient, type ApiClient, type ApiClientConfig } from './apiClient';
export { getDataClient, getPersistenceGateway, resetDataClientForTests } from './client';
export * from './persistence';
export { getSupabaseClient, resetSupabaseClientForTests } from './supabaseClient';
