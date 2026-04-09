import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import App from '../App';

describe('Navigation principale', () => {
  it('affiche l’onglet Configuration par défaut', () => {
    render(<App />);
    expect(screen.getByText('Nombre de joueurs')).toBeOnTheScreen();
  });

  it('permet d’accéder à l’écran Historique via l’onglet', async () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText('Historique des parties'));
    await waitFor(() => {
      expect(screen.getByTestId('screen-history')).toBeOnTheScreen();
    });
    expect(
      screen.getByText('Parties terminées enregistrées sur cet appareil.'),
    ).toBeOnTheScreen();
  });

  it('permet d’accéder à l’écran Partie via l’onglet', () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText('Partie en cours'));
    expect(screen.getByTestId('screen-game-session')).toBeOnTheScreen();
  });

  it('permet d’accéder aux Statistiques via l’onglet', async () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText('Statistiques globales'));
    await waitFor(() => {
      expect(screen.getByTestId('screen-statistics')).toBeOnTheScreen();
    });
  });
});
