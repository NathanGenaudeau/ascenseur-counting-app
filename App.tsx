import './global.css';

import { Bangers_400Regular } from '@expo-google-fonts/bangers';
import {
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AppNavigator } from './src/navigation/AppNavigator';

void SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loaded] = useFonts({
    Bangers_400Regular,
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <View className="flex-1 bg-void-950" />;
  }

  return <AppNavigator />;
}
