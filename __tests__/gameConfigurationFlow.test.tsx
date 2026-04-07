import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import App from '../App';

jest.mock('../src/data/supabaseClient', () => {
  const actual = jest.requireActual('../src/data/supabaseClient');
  return {
    ...actual,
    /** Client factice : le flux vérifie seulement la présence d’un client avant d’appeler le mock gameSessionSupabase. */
    getTypedSupabaseClient: jest.fn(() => ({})),
    getSupabaseClient: jest.fn(() => ({})),
  };
});

describe('Configuration de partie (parcours)', () => {
  it('active le démarrage uniquement avec des noms valides puis affiche les joueurs sur Partie', async () => {
    render(<App />);

    expect(screen.getByTestId('start-game-button').props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId('player-name-input-0'), 'Alice');
    fireEvent.changeText(screen.getByTestId('player-name-input-1'), 'Bob');
    fireEvent.changeText(screen.getByTestId('player-name-input-2'), 'Clara');
    fireEvent.changeText(screen.getByTestId('player-name-input-3'), 'Dan');

    await waitFor(() => {
      expect(screen.getByTestId('start-game-button').props.accessibilityState?.disabled).toBe(false);
    });

    fireEvent.press(screen.getByTestId('start-game-button'));

    await waitFor(() => {
      expect(screen.getByTestId('validate-announcements-button')).toBeOnTheScreen();
    });
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clara').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dan').length).toBeGreaterThan(0);
  });

  it('met à jour le nombre de champs lorsque le nombre de joueurs change', () => {
    render(<App />);
    fireEvent.press(screen.getByTestId('player-count-minus'));
    expect(screen.getByTestId('player-count-value').props.children).toBe(3);
    expect(screen.getByTestId('player-name-input-2')).toBeOnTheScreen();
    expect(screen.queryByTestId('player-name-input-3')).toBeNull();
  });
});
