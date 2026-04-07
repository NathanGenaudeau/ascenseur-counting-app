import * as screens from '../src/screens';

describe('Architecture des modules', () => {
  it('expose les écrans racine depuis le module screens', () => {
    expect(screens.GameConfigurationScreen).toBeDefined();
    expect(screens.GameSessionScreen).toBeDefined();
    expect(screens.HistoryScreen).toBeDefined();
    expect(screens.StatisticsScreen).toBeDefined();
  });
});
