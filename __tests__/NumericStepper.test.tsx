import { fireEvent, render, screen } from '@testing-library/react-native';

import { NumericStepper } from '../src/components/NumericStepper';

describe('NumericStepper', () => {
  it('prend les couleurs du feu pendant l’appui en série réussie', () => {
    render(<NumericStepper testID="s" value={1} max={5} onChange={jest.fn()} tone="fire" />);
    const plus = screen.getByTestId('s-plus');

    fireEvent(plus, 'pressIn');
    expect(plus).toHaveStyle({ borderColor: '#ff6a1a', backgroundColor: 'rgba(255, 106, 26, 0.32)' });

    fireEvent(plus, 'pressOut');
    expect(plus).not.toHaveStyle({ borderColor: '#ff6a1a' });
  });

  it('prend les couleurs de la glace pendant l’appui en série ratée', () => {
    render(<NumericStepper testID="s" value={1} max={5} onChange={jest.fn()} tone="ice" />);
    const minus = screen.getByTestId('s-minus');

    fireEvent(minus, 'pressIn');
    expect(minus).toHaveStyle({ borderColor: '#ffffff', backgroundColor: 'rgba(127, 220, 255, 0.28)' });
  });

  it('ne colore pas un bouton désactivé', () => {
    render(<NumericStepper testID="s" value={0} max={5} onChange={jest.fn()} tone="fire" />);
    const minus = screen.getByTestId('s-minus');

    fireEvent(minus, 'pressIn');
    expect(minus).not.toHaveStyle({ borderColor: '#ff6a1a' });
  });

  it('incrémente et décrémente la valeur', () => {
    const onChange = jest.fn();
    render(<NumericStepper testID="s" value={2} max={5} onChange={onChange} />);
    fireEvent.press(screen.getByTestId('s-plus'));
    fireEvent.press(screen.getByTestId('s-minus'));
    expect(onChange.mock.calls).toEqual([[3], [1]]);
  });
});
