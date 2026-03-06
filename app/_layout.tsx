import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient();

function ThemeController() {
  const theme = usePreferencesStore((state) => state.theme);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(theme);
  }, [setColorScheme, theme]);

  return null;
}

export default function RootLayout() {
  const theme = usePreferencesStore((state) => state.theme);
  const [fontsLoaded] = useFonts({
    BricolageGrotesque: require('../assets/fonts/BricolageGrotesque.ttf'),
    InstrumentSans: require('../assets/fonts/InstrumentSans.ttf'),
    JetBrainsMono: require('../assets/fonts/JetBrainsMono.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NAV_THEME[theme]}>
          <ThemeController />
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="review" />
            <Stack.Screen name="settings" />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
