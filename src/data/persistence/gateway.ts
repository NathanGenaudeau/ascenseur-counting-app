import type { ApiClient } from '../apiClient';
import {
  PERSISTENCE_API_PREFIX,
  REST_RESOURCE_SEGMENT,
  SUPABASE_TABLE,
  type SupabaseTableName,
} from './supabaseResources';

export type PersistenceResourceKey = keyof typeof REST_RESOURCE_SEGMENT;

/**
 * Point d’entrée pour la persistance via l’API HTTP (backend serverless / Supabase).
 */
export class PersistenceGateway {
  constructor(private readonly api: ApiClient) {}

  /** Chemin REST pour une ressource (sans identifiant de ligne). */
  resourceBasePath(key: PersistenceResourceKey): string {
    const segment = REST_RESOURCE_SEGMENT[key];
    return `${PERSISTENCE_API_PREFIX}/${segment}`;
  }

  /** Chemin REST pour une ligne précise (`…/players/abc`). */
  resourceDocumentPath(key: PersistenceResourceKey, documentId: string): string {
    const base = this.resourceBasePath(key);
    const id = encodeURIComponent(documentId);
    return `${base}/${id}`;
  }

  /**
   * Vérifie que l’API répond (à implémenter côté serveur).
   * Convention : `GET /v1/meta/health` → 204 ou 200 sans corps obligatoire.
   */
  async healthCheck(): Promise<boolean> {
    const res = await this.api.request(`${PERSISTENCE_API_PREFIX}/meta/health`, { method: 'GET' });
    return res.ok;
  }

  list(key: PersistenceResourceKey, init?: RequestInit): Promise<Response> {
    return this.api.request(this.resourceBasePath(key), { ...init, method: 'GET' });
  }

  getById(key: PersistenceResourceKey, id: string, init?: RequestInit): Promise<Response> {
    return this.api.request(this.resourceDocumentPath(key, id), { ...init, method: 'GET' });
  }

  create(key: PersistenceResourceKey, body: unknown, init?: RequestInit): Promise<Response> {
    return this.api.request(this.resourceBasePath(key), {
      ...init,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  replace(key: PersistenceResourceKey, id: string, body: unknown, init?: RequestInit): Promise<Response> {
    return this.api.request(this.resourceDocumentPath(key, id), {
      ...init,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  remove(key: PersistenceResourceKey, id: string, init?: RequestInit): Promise<Response> {
    return this.api.request(this.resourceDocumentPath(key, id), { ...init, method: 'DELETE' });
  }
}

/** Indique si la chaîne est un nom de table Postgres connu (schéma aligné Supabase). */
export function isSupabaseTableName(value: string): value is SupabaseTableName {
  return Object.values(SUPABASE_TABLE).includes(value as SupabaseTableName);
}
