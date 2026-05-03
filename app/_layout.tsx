import { Stack } from "expo-router";
import { AuthProvider } from "../src/contexts/AuthContext";
import { AppProvider } from "../src/contexts/AppContext";
import { StatusBar } from "expo-status-bar";
import { OfflineBanner } from "../src/components/OfflineBanner";
import "../global.css";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import notificationService from '../src/services/notificationService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    Lexend: Lexend_400Regular,
    'Lexend-Light': Lexend_300Light,
    'Lexend-Regular': Lexend_400Regular,
    'Lexend-Medium': Lexend_500Medium,
    'Lexend-SemiBold': Lexend_600SemiBold,
    'Lexend-Bold': Lexend_700Bold,
  });

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const initNotifications = async () => {
      const hasPermission = await notificationService.setupNotifications();
      if (hasPermission) {
        await notificationService.scheduleDailyReminder();
      }
    };
    initNotifications();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        notificationService.scheduleDailyReminder();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="course/[id]" />
          <Stack.Screen name="course/[id]/webview" />
        </Stack>
      </AppProvider>
    </AuthProvider>
  );
}
