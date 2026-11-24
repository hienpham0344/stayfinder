import { StyleSheet } from 'react-native-css-interop';
(StyleSheet as unknown as { setFlag?: (name: string, value: string) => void }).setFlag?.('darkMode', 'class');

import '../global.css';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Platform, View } from 'react-native';
import { COLORS } from '../constants/tokens';
import { AppStateProvider } from '../state/AppState';
import { LiveStateProvider } from '../state/LiveState';
import { apiEnabled } from '../services/api';
import { PerformanceProbe } from '../components/ui/PerformanceProbe';
import { MotionPreferenceProvider } from '../components/ui/useReducedMotion';

function RootNavigator() {
  const segments = useSegments();
  const firstSegment = segments[0] as string | undefined;
  const isDashboard = firstSegment === 'admin' || firstSegment === 'partner';

  return (
    <View style={{ flex: 1, backgroundColor: isDashboard ? (firstSegment === 'admin' ? '#F9FAFB' : '#F8FAFC') : COLORS.canvas }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: Platform.OS === 'web' && !isDashboard ? 520 : undefined,
          alignSelf: 'center',
          backgroundColor: isDashboard ? 'transparent' : COLORS.bgMain,
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: isDashboard ? 'transparent' : COLORS.bgMain },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="partner" options={{ headerShown: false }} />
          <Stack.Screen name="room/[id]" options={{ headerShown: false, presentation: 'card' }} />
          <Stack.Screen name="booking/checkout" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgMain }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const app = (
    <>
      <StatusBar style="light" />
      <PerformanceProbe />
      <RootNavigator />
    </>
  );

  return (
    <MotionPreferenceProvider>
      {apiEnabled ? <LiveStateProvider>{app}</LiveStateProvider> : <AppStateProvider>{app}</AppStateProvider>}
    </MotionPreferenceProvider>
  );
}
