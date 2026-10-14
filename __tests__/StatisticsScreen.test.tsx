import { NavigationContainer } from '@react-navigation/native';
import { render, screen, within } from '@testing-library/react-native';

import type { FinishedGameRecord } from '../src/domain/finishedGameRecord';
import { computeRoundScoresForPlayers } from '../src/domain/scoring';
import { StatisticsScreen } from '../src/screens/StatisticsScreen';
import { loadCompletedGames } from '../src/services/completedGamesStorage';

jest.mock('../src/services/completedGamesStorage', () => ({
  loadCompletedGames: jest.fn(),
}));

function renderScreen() {
  return render(
    <NavigationContainer>
      <StatisticsScreen />
    </NavigationContainer>,
  );
}

/** Une manche à 1 carte : le premier joueur réussit son pari (1 pt), les autres font 0 ou -1. */
function oneRoundGame(id: string, playerNames: string[]): FinishedGameRecord {
  const announcements = playerNames.map((_, i) => (i === 0 ? 1 : 0));
  const tricks = playerNames.map((_, i) => (i === 0 || i === playerNames.length - 1 ? 1 : 0));
  tricks[0] = 1;
  return {
    id,
    version: 1,
    endedAt: '2026-01-01T00:00:00.000Z',
    playerNames,
    settings: {},
    roundsCompleted: [
      { roundIndex: 1, announcements, tricks, scores: computeRoundScoresForPlayers(announcements, tricks) },
    ],
  };
}

describe('StatisticsScreen', () => {
  it('affiche un message sans partie terminée', async () => {
    jest.mocked(loadCompletedGames).mockResolvedValue([]);
    renderScreen();
    expect(await screen.findByTestId('statistics-empty')).toBeOnTheScreen();
  });

  it('remplace les podiums par un message tant qu’aucun joueur n’a 3 parties, mais garde le tableau', async () => {
    jest.mocked(loadCompletedGames).mockResolvedValue([
      oneRoundGame('g1', ['Ann', 'Bob', 'Cid']),
      oneRoundGame('g2', ['Ann', 'Bob', 'Cid']),
    ]);
    renderScreen();
    expect(await screen.findByTestId('statistics-not-enough-games')).toBeOnTheScreen();
    expect(screen.queryByTestId('podium-winRate')).toBeNull();
    expect(screen.getByTestId('player-stats-table')).toBeOnTheScreen();
    expect(screen.getByTestId('statistics-player-row-0-games')).toHaveTextContent('2');
  });

  it('réserve les podiums aux joueurs à 3 parties ou plus, le tableau montre tout le monde', async () => {
    jest.mocked(loadCompletedGames).mockResolvedValue([
      oneRoundGame('g1', ['Ann', 'Bob', 'Cid']),
      oneRoundGame('g2', ['Ann', 'Bob', 'Cid']),
      oneRoundGame('g3', ['Ann', 'Bob', 'Cid', 'Dan']),
    ]);

    renderScreen();

    expect(await screen.findByTestId('podium-winRate')).toBeOnTheScreen();
    for (const id of ['averagePlacement', 'averagePoints', 'bestBetStreak', 'betSuccessRate']) {
      expect(screen.getByTestId(`podium-${id}`)).toBeOnTheScreen();
    }
    // Ann gagne les 3 parties : 1re place au centre, 100 % de victoires
    expect(screen.getByTestId('podium-winRate-place-1-value')).toHaveTextContent('100 %');

    expect(screen.getByTestId('player-stats-table')).toBeOnTheScreen();
    expect(screen.getByTestId('statistics-player-row-0')).toHaveTextContent(/Ann/);
    expect(screen.getByTestId('statistics-player-row-0-games')).toHaveTextContent('3');
    // Dan n'a joué qu'une partie : absent des podiums, présent dans le tableau
    expect(screen.queryByTestId('statistics-not-enough-games')).toBeNull();
    expect(screen.getAllByText('Dan')).toHaveLength(1);
    expect(within(screen.getByTestId('player-stats-table')).getByText('Dan')).toBeOnTheScreen();
    expect(screen.getByTestId('statistics-player-row-3')).toBeOnTheScreen();
  });
});
