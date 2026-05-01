import React from 'react';
import { render, screen } from '@testing-library/react-native';

import App from '../App';

describe('App', () => {
  it('affiche l’écran de configuration par défaut', () => {
    render(<App />);
    expect(screen.getByTestId('game-config-scroll')).toBeOnTheScreen();
    expect(screen.getByText('Nombre de joueurs')).toBeOnTheScreen();
    expect(screen.getByText('Démarrer la partie')).toBeOnTheScreen();
  });

  it('applique les utilitaires NativeWind (classes Tailwind sur les composants)', () => {
    render(<App />);
    const root = screen.getByTestId('app-root');
    expect(root.props.className).toContain('flex-1');
    expect(root.props.className).toContain('bg-white');
    const section = screen.getByText('Nombre de joueurs');
    expect(section.props.className).toContain('font-medium');
    expect(section.props.className).toContain('text-primary-800');
  });
});
