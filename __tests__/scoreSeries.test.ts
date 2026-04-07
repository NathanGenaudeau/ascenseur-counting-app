import { buildCumulativeSeriesPerPlayer, getYRangeForSeries } from '../src/domain/scoreSeries';

describe('buildCumulativeSeriesPerPlayer (ASC-13)', () => {
  it('construit des points cumulés dans l’ordre des manches', () => {
    const rounds = [
      { roundIndex: 1, announcements: [], tricks: [], scores: [3, -1] },
      { roundIndex: 2, announcements: [], tricks: [], scores: [-2, 4] },
    ];
    const series = buildCumulativeSeriesPerPlayer(rounds, 2);
    expect(series[0].map((p) => p.cumulative)).toEqual([0, 3, 1]);
    expect(series[1].map((p) => p.cumulative)).toEqual([0, -1, 3]);
  });

  it('inclut le point de départ à zéro', () => {
    const series = buildCumulativeSeriesPerPlayer([], 2);
    expect(series[0]).toEqual([{ roundIndex: 0, cumulative: 0 }]);
    expect(series[1]).toEqual([{ roundIndex: 0, cumulative: 0 }]);
  });
});

describe('getYRangeForSeries', () => {
  it('englobe les valeurs négatives', () => {
    const range = getYRangeForSeries([
      [
        { roundIndex: 0, cumulative: 0 },
        { roundIndex: 1, cumulative: -3 },
      ],
    ]);
    expect(range.minY).toBeLessThanOrEqual(-3);
    expect(range.maxY).toBeGreaterThanOrEqual(0);
  });
});
