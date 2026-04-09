import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Cog, History, LineChart, PlayCircle } from 'lucide-react-native';

import { GameConfigurationProvider } from '../context/GameConfigurationContext';
import { GameSessionProvider } from '../context/GameSessionContext';
import { GameConfigurationScreen } from '../screens/GameConfigurationScreen';
import { GameSessionScreen } from '../screens/GameSessionScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';

export type RootTabParamList = {
  GameConfiguration: undefined;
  GameSession: undefined;
  History: undefined;
  Statistics: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <GameSessionProvider>
        <GameConfigurationProvider>
          <Tab.Navigator
            screenOptions={{
              /** Pas d’en-tête : les titres sont déjà portés par la barre d’onglets en bas. */
              headerShown: false,
              tabBarActiveTintColor: '#171717',
              tabBarInactiveTintColor: '#737373',
            }}
          >
            <Tab.Screen
              name="GameConfiguration"
              component={GameConfigurationScreen}
              options={{
                title: 'Configuration',
                tabBarIcon: ({ color, size }) => <Cog color={color} size={size} />,
                tabBarAccessibilityLabel: 'Configuration de partie',
              }}
            />
            <Tab.Screen
              name="GameSession"
              component={GameSessionScreen}
              options={{
                title: 'Partie',
                tabBarIcon: ({ color, size }) => <PlayCircle color={color} size={size} />,
                tabBarAccessibilityLabel: 'Partie en cours',
              }}
            />
            <Tab.Screen
              name="History"
              component={HistoryScreen}
              options={{
                title: 'Historique',
                tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
                tabBarAccessibilityLabel: 'Historique des parties',
              }}
            />
            <Tab.Screen
              name="Statistics"
              component={StatisticsScreen}
              options={{
                title: 'Statistiques',
                tabBarIcon: ({ color, size }) => <LineChart color={color} size={size} />,
                tabBarAccessibilityLabel: 'Statistiques globales',
              }}
            />
          </Tab.Navigator>
        </GameConfigurationProvider>
      </GameSessionProvider>
    </NavigationContainer>
  );
}
