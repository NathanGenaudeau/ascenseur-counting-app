export type ApiClient = {
  request(path: string, init?: RequestInit): Promise<Response>;
};

export type ApiClientConfig = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function joinUrl(base: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Client HTTP minimal vers l’API backend ou les routes proxy Supabase.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const base = normalizeBaseUrl(config.baseUrl);
  const fetchFn = config.fetchImpl ?? globalThis.fetch;

  return {
    async request(path: string, init?: RequestInit): Promise<Response> {
      const url = joinUrl(base, path);
      const headers = new Headers(init?.headers);
      if (!headers.has('Content-Type') && init?.body !== undefined) {
        headers.set('Content-Type', 'application/json');
      }
      return fetchFn(url, { ...init, headers });
    },
  };
}
