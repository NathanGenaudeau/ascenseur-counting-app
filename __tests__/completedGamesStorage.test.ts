import { loadFinishedGameRecordsFromSupabase } from '../src/data/repositories/finishedGamesLoader';
import type { FinishedGameRecord } from '../src/domain/finishedGameRecord';
import { loadCompletedGames } from '../src/services/completedGamesStorage';

jest.mock('../src/data/repositories/finishedGamesLoader', () => ({
  loadFinishedGameRecordsFromSupabase: jest.fn(),
}));

describe('completedGamesStorage (Supabase)', () => {
  it('délègue le chargement au loader', async () => {
    const sample: FinishedGameRecord = {
      id: 'ga',
      version: 1,
      endedAt: '2026-01-01T10:00:00.000Z',
      playerNames: ['A'],
      settings: {},
      roundsCompleted: [{ roundIndex: 1, announcements: [1], tricks: [1], scores: [1] }],
    };
    jest.mocked(loadFinishedGameRecordsFromSupabase).mockResolvedValueOnce([sample]);

    const list = await loadCompletedGames();

    expect(loadFinishedGameRecordsFromSupabase).toHaveBeenCalled();
    expect(list).toEqual([sample]);
  });
});
