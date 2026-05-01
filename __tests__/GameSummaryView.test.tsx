import { fireEvent, render, screen } from '@testing-library/react-native';

import { GameSummaryView } from '../src/components/GameSummaryView';

describe('GameSummaryView (ASC-20)', () => {
  it('affiche le classement et le bouton nouvelle partie', () => {
    const onNewGame = jest.fn();
    render(
      <GameSummaryView
        playerNames={['A', 'B']}
        cumulativeScores={[2, 0]}
        roundsCompleted={[
          {
            roundIndex: 1,
            announcements: [1, 1],
            tricks: [1, 1],
            scores: [1, 1],
          },
        ]}
        onNewGame={onNewGame}
      />,
    );
    expect(screen.getByTestId('game-summary-title')).toBeOnTheScreen();
    expect(screen.getByTestId('summary-ranking-row-0')).toBeOnTheScreen();
    expect(screen.getByTestId('summary-tile-bet-best')).toBeOnTheScreen();
    expect(screen.getByTestId('summary-tile-streak-best')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('summary-new-game-button'));
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });
});
