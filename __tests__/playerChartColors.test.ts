import { getPlayerChartColor, PLAYER_CHART_COLORS } from '../src/utils/playerChartColors';

describe('playerChartColors (ASC-14)', () => {
  it('attribue une couleur stable par index', () => {
    expect(getPlayerChartColor(0)).toBe(PLAYER_CHART_COLORS[0]);
    expect(getPlayerChartColor(1)).toBe(PLAYER_CHART_COLORS[1]);
    expect(getPlayerChartColor(0)).toBe(getPlayerChartColor(0));
  });

  it('couvre 10 joueurs sans collision cyclique sur la palette', () => {
    const set = new Set(Array.from({ length: 10 }, (_, i) => getPlayerChartColor(i)));
    expect(set.size).toBe(10);
  });
});
