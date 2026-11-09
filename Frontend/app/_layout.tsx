import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Platform, View } from 'react-native';
import { COLORS } from '../constants/tokens';
import { AppStateProvider } from '../state/AppState';
import { LiveStateProvider } from '../state/LiveState';
import { apiEnabled } from '../services/api';
import { PerformanceProbe } from '../components/ui/PerformanceProbe';
import { MotionPreferenceProvider } from '../components/ui/useReducedMotion';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgMain }}><ActivityIndicator color={COLORS.primary} /></View>;
  }

  const app = <>
      <StatusBar style="light" />
      <PerformanceProbe />
      <View style={{ flex: 1, backgroundColor: COLORS.canvas }}><View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', backgroundColor: COLORS.bgMain }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgMain },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="room/[id]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="booking/checkout" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      </View></View>
    </>;
  return <MotionPreferenceProvider>{apiEnabled ? <LiveStateProvider>{app}</LiveStateProvider>
    : <AppStateProvider>{app}</AppStateProvider>}</MotionPreferenceProvider>;
}
