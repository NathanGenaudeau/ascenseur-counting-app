import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Cog, History, LineChart, PlayCircle } from 'lucide-react-native';

import { GameConfigurationProvider } from '../context/GameConfigurationContext';
import { GameSessionProvider } from '../context/GameSessionContext';
import { GameConfigurationScreen } from '../screens/GameConfigurationScreen';
import { GameSessionScreen } from '../screens/GameSessionScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatisticsScreen } from '../screens/StatisticsScreen';
import { ICON_ACCENT_HEX } from '../theme';

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
      <StatusBar style="light" />
      <GameSessionProvider>
        <GameConfigurationProvider>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: ICON_ACCENT_HEX,
              tabBarInactiveTintColor: '#4a4a62',
              tabBarStyle: {
                backgroundColor: '#0a080e',
                borderTopColor: '#2d1a2b',
                borderTopWidth: 1,
                paddingTop: 4,
              },
              tabBarLabelStyle: { fontFamily: 'Bangers_400Regular', fontSize: 13 },
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
