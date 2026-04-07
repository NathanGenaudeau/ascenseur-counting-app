import { createApiClient } from '../src/data/apiClient';
import { getDataClient, resetDataClientForTests } from '../src/data/client';

describe('createApiClient', () => {
  it('concatène base URL et chemin et utilise fetch injecté', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    const client = createApiClient({
      baseUrl: 'https://api.test/',
      fetchImpl,
    });

    await client.request('/health');

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/health',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('ajoute Content-Type JSON lorsque body est défini', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetchImpl,
    });

    await client.request('v1/foo', { method: 'POST', body: '{}' });

    const call = fetchImpl.mock.calls[0];
    const headers = call[1].headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });
});

describe('getDataClient', () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    resetDataClientForTests();
    if (previousUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = previousUrl;
    }
  });

  it('réutilise la même instance tant que resetDataClientForTests n’est pas appelé', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com';
    const a = getDataClient();
    const b = getDataClient();
    expect(a).toBe(b);
  });
});
