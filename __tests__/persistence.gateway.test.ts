import { createApiClient } from '../src/data/apiClient';
import { isSupabaseTableName, PersistenceGateway } from '../src/data/persistence/gateway';

describe('PersistenceGateway (API persistance / Supabase)', () => {
  it('construit les chemins REST pour chaque ressource', () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const api = createApiClient({ baseUrl: 'https://api.test', fetchImpl });
    const gw = new PersistenceGateway(api);

    expect(gw.resourceBasePath('players')).toBe('/v1/players');
    expect(gw.resourceBasePath('gamePlayers')).toBe('/v1/game-players');
    expect(gw.resourceDocumentPath('games', 'abc')).toBe('/v1/games/abc');
    expect(gw.resourceDocumentPath('games', 'a/b')).toBe('/v1/games/a%2Fb');
  });

  it('healthCheck appelle GET /v1/meta/health', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const api = createApiClient({ baseUrl: 'https://api.test', fetchImpl });
    const gw = new PersistenceGateway(api);

    const ok = await gw.healthCheck();

    expect(ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.test/v1/meta/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('create envoie POST JSON sur la ressource', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response('{}', { status: 201 }));
    const api = createApiClient({ baseUrl: 'https://x', fetchImpl });
    const gw = new PersistenceGateway(api);

    await gw.create('players', { displayName: 'Nico' });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://x/v1/players',
      expect.objectContaining({
        method: 'POST',
        body: '{"displayName":"Nico"}',
      }),
    );
  });

  it('isSupabaseTableName reconnaît les noms de tables Postgres', () => {
    expect(isSupabaseTableName('players')).toBe(true);
    expect(isSupabaseTableName('game_players')).toBe(true);
    expect(isSupabaseTableName('round_results')).toBe(true);
    expect(isSupabaseTableName('unknown')).toBe(false);
  });
});
