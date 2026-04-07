import type { FinishedGameRecord } from '../src/domain/finishedGameRecord';
import { aggregatePlayerStats, buildWinCountData, normalizePlayerKey } from '../src/domain/globalStats';

describe('globalStats (ASC-23)', () => {
  it('agrège par nom normalisé', () => {
    expect(normalizePlayerKey('  Alice  ')).toBe('alice');
  });

  it('compte parties, victoires et scores', () => {
    const g1: FinishedGameRecord = {
      id: 'a',
      version: 1,
      endedAt: '2026-01-02T00:00:00.000Z',
      playerNames: ['A', 'B'],
      settings: {},
      roundsCompleted: [
        { roundIndex: 1, announcements: [], tricks: [], scores: [5, 0] },
      ],
    };
    const g2: FinishedGameRecord = {
      id: 'b',
      version: 1,
      endedAt: '2026-01-03T00:00:00.000Z',
      playerNames: ['A', 'B'],
      settings: {},
      roundsCompleted: [
        { roundIndex: 1, announcements: [], tricks: [], scores: [0, 3] },
      ],
    };
    const stats = aggregatePlayerStats([g1, g2]);
    const a = stats.find((s) => s.displayName === 'A');
    const b = stats.find((s) => s.displayName === 'B');
    expect(a?.gamesPlayed).toBe(2);
    expect(a?.gamesWon).toBe(1);
    expect(a?.totalScore).toBe(5);
    expect(b?.gamesWon).toBe(1);
    expect(b?.totalScore).toBe(3);
  });
});

describe('buildWinCountData (ASC-24)', () => {
  it('limite le nombre de barres', () => {
    const stats = aggregatePlayerStats([]);
    expect(buildWinCountData(stats, 5)).toEqual([]);
  });
});
