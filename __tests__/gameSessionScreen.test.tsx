import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { GameSessionProvider, useGameSession } from '../src/context/GameSessionContext';
import type { RootTabParamList } from '../src/navigation/AppNavigator';
import { GameSessionScreen } from '../src/screens/GameSessionScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();

function EmptyTabScreen() {
  return <View />;
}

function SessionGameSessionScreen() {
  return (
    <SeedThreePlayers>
      <GameSessionScreen />
    </SeedThreePlayers>
  );
}

function SessionTestRoot() {
  return (
    <NavigationContainer>
      <GameSessionProvider>
        <Tab.Navigator initialRouteName="GameSession" screenOptions={{ headerShown: false }}>
          <Tab.Screen name="GameConfiguration" component={EmptyTabScreen} />
          <Tab.Screen name="GameSession" component={SessionGameSessionScreen} />
          <Tab.Screen name="History" component={EmptyTabScreen} />
          <Tab.Screen name="Statistics" component={EmptyTabScreen} />
        </Tab.Navigator>
      </GameSessionProvider>
    </NavigationContainer>
  );
}

function SeedThreePlayers({ children }: { children: React.ReactNode }) {
  const { setSession } = useGameSession();
  useEffect(() => {
    setSession({
      players: [{ displayName: 'A' }, { displayName: 'B' }, { displayName: 'C' }],
      settings: {},
    });
  }, [setSession]);
  return <View>{children}</View>;
}

describe('GameSessionScreen (phase 5)', () => {
  it('affiche le cumul et permet une manche complète', async () => {
    render(<SessionTestRoot />);

    await waitFor(() => {
      expect(screen.getByTestId('cumulative-score-0')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('cumulative-score-0').props.children).toBe(0);

    fireEvent.changeText(screen.getByTestId('announce-input-0'), '3');
    fireEvent.changeText(screen.getByTestId('announce-input-1'), '3');
    fireEvent.changeText(screen.getByTestId('announce-input-2'), '3');

    fireEvent.press(screen.getByTestId('validate-announcements-button'));

    await waitFor(() => {
      expect(screen.getByTestId('tricks-input-0')).toBeOnTheScreen();
    });

    expect(screen.getByTestId('recap-announce-0').props.children).toBe(3);

    fireEvent.changeText(screen.getByTestId('tricks-input-0'), '3');
    fireEvent.changeText(screen.getByTestId('tricks-input-1'), '2');
    fireEvent.changeText(screen.getByTestId('tricks-input-2'), '3');

    fireEvent.press(screen.getByTestId('finalize-round-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cumulative-score-0').props.children).toBe(3);
    });
    expect(screen.getByTestId('cumulative-score-1').props.children).toBe(-1);

    expect(screen.getByTestId('score-evolution-chart')).toBeOnTheScreen();
    expect(screen.getByTestId('chart-legend-row-0')).toBeOnTheScreen();
    expect(screen.getByTestId('end-game-button')).toBeOnTheScreen();
  });
});

describe('GameSessionScreen (phase 7)', () => {
  it('affiche le récapitulatif après fin de partie', async () => {
    render(<SessionTestRoot />);

    await waitFor(() => {
      expect(screen.getByTestId('cumulative-score-0')).toBeOnTheScreen();
    });

    fireEvent.changeText(screen.getByTestId('announce-input-0'), '3');
    fireEvent.changeText(screen.getByTestId('announce-input-1'), '3');
    fireEvent.changeText(screen.getByTestId('announce-input-2'), '3');
    fireEvent.press(screen.getByTestId('validate-announcements-button'));
    await waitFor(() => {
      expect(screen.getByTestId('tricks-input-0')).toBeOnTheScreen();
    });
    fireEvent.changeText(screen.getByTestId('tricks-input-0'), '3');
    fireEvent.changeText(screen.getByTestId('tricks-input-1'), '2');
    fireEvent.changeText(screen.getByTestId('tricks-input-2'), '3');
    fireEvent.press(screen.getByTestId('finalize-round-button'));

    await waitFor(() => {
      expect(screen.getByTestId('end-game-button')).toBeOnTheScreen();
    });
    fireEvent.press(screen.getByTestId('end-game-button'));

    await waitFor(() => {
      expect(screen.getByTestId('game-summary-title')).toBeOnTheScreen();
    });
    expect(screen.getByTestId('summary-ranking-row-0')).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId('summary-new-game-button'));
    fireEvent.press(screen.getByLabelText('GameSession, tab, 2 of 4'));
    await waitFor(() => {
      expect(screen.getByText('Démarrez une partie depuis l’onglet Configuration.')).toBeOnTheScreen();
    });
  });
});
