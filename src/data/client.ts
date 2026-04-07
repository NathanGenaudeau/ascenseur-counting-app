import { getApiBaseUrl } from '../config/env';
import { createApiClient, type ApiClient } from './apiClient';
import { PersistenceGateway } from './persistence/gateway';
import { resetSupabaseClientForTests } from './supabaseClient';

let singleton: ApiClient | null = null;
let persistenceGateway: PersistenceGateway | null = null;

/** Instance partagée utilisée par les services données (une fois l’URL configurée). */
export function getDataClient(): ApiClient {
  if (singleton === null) {
    singleton = createApiClient({ baseUrl: getApiBaseUrl() });
  }
  return singleton;
}

/** Passerelle persistance (API HTTP / Supabase côté serveur). */
export function getPersistenceGateway(): PersistenceGateway {
  if (persistenceGateway === null) {
    persistenceGateway = new PersistenceGateway(getDataClient());
  }
  return persistenceGateway;
}

/** Permet de réinitialiser le client en test. */
export function resetDataClientForTests(): void {
  singleton = null;
  persistenceGateway = null;
  resetSupabaseClientForTests();
}
