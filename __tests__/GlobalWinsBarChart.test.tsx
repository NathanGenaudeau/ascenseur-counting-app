import { render, screen } from '@testing-library/react-native';

import { GlobalWinsBarChart } from '../src/components/GlobalWinsBarChart';

describe('GlobalWinsBarChart (ASC-24)', () => {
  it('affiche des barres lorsque des données existent', () => {
    render(
      <GlobalWinsBarChart
        data={[
          { displayName: 'A', wins: 3 },
          { displayName: 'B', wins: 1 },
        ]}
      />,
    );
    expect(screen.getByTestId('global-wins-chart')).toBeOnTheScreen();
    expect(screen.getByTestId('global-wins-bar-row-0')).toBeOnTheScreen();
  });

  it('affiche un message vide sans données', () => {
    render(<GlobalWinsBarChart data={[]} />);
    expect(screen.getByTestId('global-wins-chart-empty')).toBeOnTheScreen();
  });
});
