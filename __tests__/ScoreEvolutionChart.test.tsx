import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ScoreEvolutionChart } from '../src/components/ScoreEvolutionChart';

describe('ScoreEvolutionChart', () => {
  it('affiche la légende pour chaque joueur (ASC-14)', () => {
    render(
      <ScoreEvolutionChart
        roundsCompleted={[]}
        playerNames={['A', 'B', 'C']}
      />,
    );
    expect(screen.getByTestId('chart-legend-row-0')).toBeOnTheScreen();
    expect(screen.getByTestId('chart-legend-row-1')).toBeOnTheScreen();
    expect(screen.getByTestId('chart-legend-row-2')).toBeOnTheScreen();
    expect(screen.getByTestId('chart-legend-swatch-0')).toBeOnTheScreen();
  });

  it('affiche le graphique après au moins une manche (ASC-13)', () => {
    render(
      <ScoreEvolutionChart
        roundsCompleted={[
          {
            roundIndex: 1,
            announcements: [],
            tricks: [],
            scores: [2, -1],
          },
        ]}
        playerNames={['A', 'B']}
      />,
    );
    expect(screen.getByTestId('score-evolution-chart')).toBeOnTheScreen();
    expect(screen.queryByTestId('score-chart-placeholder')).toBeNull();
  });

  it('affiche un message sans manche validée', () => {
    render(<ScoreEvolutionChart roundsCompleted={[]} playerNames={['A']} />);
    expect(screen.getByTestId('score-chart-placeholder')).toBeOnTheScreen();
  });
});
