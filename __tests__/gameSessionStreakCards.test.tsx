import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { GameSessionProvider, useGameSession } from '../src/context/GameSessionContext';
import type { RootTabParamList } from '../src/navigation/AppNavigator';
import { GameSessionScreen } from '../src/screens/GameSessionScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const PLAYERS = ['A', 'B', 'C', 'D', 'E'];

function Empty() {
  return <View />;
}

function SeedPlayers({ children }: { children: React.ReactNode }) {
  const { setSession } = useGameSession();
  useEffect(() => {
    setSession({ players: PLAYERS.map((displayName) => ({ displayName })), settings: {} });
  }, [setSession]);
  return <View>{children}</View>;
}

function SeededSession() {
  return (
    <SeedPlayers>
      <GameSessionScreen />
    </SeedPlayers>
  );
}

function Root() {
  return (
    <NavigationContainer>
      <GameSessionProvider>
        <Tab.Navigator initialRouteName="GameSession" screenOptions={{ headerShown: false }}>
          <Tab.Screen name="GameConfiguration" component={Empty} />
          <Tab.Screen name="GameSession" component={SeededSession} />
          <Tab.Screen name="History" component={Empty} />
          <Tab.Screen name="Statistics" component={Empty} />
        </Tab.Navigator>
      </GameSessionProvider>
    </NavigationContainer>
  );
}

const hidden = { includeHiddenElements: true };

/**
 * Manche r (r cartes) : tout le monde annonce 0, le joueur A ramasse les r plis.
 * A rate donc chaque pari (série ratée), les autres les réussissent (série réussie).
 */
async function playRound(round: number) {
  fireEvent.press(screen.getByTestId('validate-announcements-button'));
  await waitFor(() => expect(screen.getByTestId('tricks-input-0-plus')).toBeOnTheScreen());
  for (let k = 0; k < round; k++) {
    fireEvent.press(screen.getByTestId('tricks-input-0-plus'));
  }
  fireEvent.press(screen.getByTestId('finalize-round-button'));
  await waitFor(() => expect(screen.getByTestId('validate-announcements-button')).toBeOnTheScreen());
}

describe('Cartes joueurs pendant les séries', () => {
  it('garde toutes les cartes affichées quand l’ordre tourne et que les séries apparaissent', async () => {
    render(<Root />);
    await waitFor(() => expect(screen.getByTestId('player-card-0')).toBeOnTheScreen());

    for (let round = 1; round <= 5; round++) {
      await playRound(round);
      for (let i = 0; i < PLAYERS.length; i++) {
        expect(screen.getByTestId(`player-card-${i}`)).toBeOnTheScreen();
        expect(screen.getByTestId(`announce-input-${i}-value`)).toBeOnTheScreen();
      }
    }

    // Le style de la carte ne dépend pas de la série (seul le liseré, un enfant, apparaît ou non).
    expect(screen.getByTestId('player-card-0').props.style).toEqual(
      screen.getByTestId('player-card-1').props.style,
    );
    expect(screen.queryByTestId('player-card-accent-0')).toBeNull();

    // Après 5 manches : A en série ratée, les autres en série réussie.
    expect(screen.getByTestId('player-loss-streak-backdrop-0', hidden)).toBeTruthy();
    for (let i = 1; i < PLAYERS.length; i++) {
      expect(screen.getByTestId(`player-streak-backdrop-${i}`, hidden)).toBeTruthy();
    }
  });

  it('affiche le liseré rose tant qu’aucune série n’est en cours', async () => {
    render(<Root />);
    await waitFor(() => expect(screen.getByTestId('player-card-0')).toBeOnTheScreen());
    for (let i = 0; i < PLAYERS.length; i++) {
      expect(screen.getByTestId(`player-card-accent-${i}`)).toBeOnTheScreen();
    }
  });

  it('affiche les cartes dans l’ordre de prise de parole de la manche', async () => {
    render(<Root />);
    await waitFor(() => expect(screen.getByTestId('player-card-0')).toBeOnTheScreen());
    await playRound(1);

    // Manche 2 : le joueur B (index 1) parle en premier.
    const order = screen
      .getAllByTestId(/^player-card-\d$/)
      .map((el) => Number(String(el.props.testID).replace('player-card-', '')));
    expect(order).toEqual([1, 2, 3, 4, 0]);
  });
});
