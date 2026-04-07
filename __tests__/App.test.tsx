import React from 'react';
import { render, screen } from '@testing-library/react-native';

import App from '../App';

describe('App', () => {
  it('affiche le socle de l’application Ascenseur', () => {
    render(<App />);
    expect(screen.getByText('Ascenseur')).toBeOnTheScreen();
    expect(screen.getByText('Suivi de parties')).toBeOnTheScreen();
  });

  it('affiche une icône Lucide pour l’identité visuelle', () => {
    render(<App />);
    expect(screen.getByTestId('app-brand-icon')).toBeOnTheScreen();
  });

  it('applique les utilitaires NativeWind (classes Tailwind sur les composants)', () => {
    render(<App />);
    const root = screen.getByTestId('app-root');
    expect(root.props.className).toContain('flex-1');
    expect(root.props.className).toContain('bg-white');
    const title = screen.getByText('Ascenseur');
    expect(title.props.className).toContain('text-2xl');
    expect(title.props.className).toContain('font-semibold');
  });
});
