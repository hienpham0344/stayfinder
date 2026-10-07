import { useUserWindowDimensions } from '../../components/ui/useUserWindowDimensions';
import { Tabs, usePathname } from 'expo-router';
import { Home, Search, Heart, CalendarCheck, User } from 'lucide-react-native';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { Se121SharedAsset, fullFrameNavigationAsset } from '../../components/ui/Se121SharedAssets';
import { COLORS, TYPOGRAPHY } from '../../constants/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useUserWindowDimensions();
  const compact = width <= 340;
  const activeIndex = pathname.endsWith('/search') ? 1
    : pathname.endsWith('/bookings') ? 2
    : pathname.endsWith('/wishlist') ? 3
    : pathname.endsWith('/profile') ? 4 : 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarBackground: () => <View pointerEvents="none" style={StyleSheet.absoluteFill}><View style={{ position: 'absolute', left: Math.round(width * (activeIndex + 0.5) / 5 - 15), bottom: 1 + insets.bottom, width: 28, height: 3, borderRadius: 1.5, backgroundColor: COLORS.primary }} /></View>,
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: { flex: 1, minWidth: 0 },
        tabBarIconStyle: { width: 24, height: 24 },
        tabBarStyle: {
          backgroundColor: COLORS.bgWhite,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderLight,
          height: 72 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderWidth: 1,
          borderColor: COLORS.borderTealSoft,
          ...Platform.select({ web: { boxShadow: '0px -8px 14px rgba(5,31,26,0.14)' }, default: { elevation: 8, shadowColor: '#051F1A', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.14, shadowRadius: 14 } }),
        },
        tabBarLabel: ({ focused, children }) => <Text numberOfLines={1} style={{ fontFamily: focused ? TYPOGRAPHY.families.bold : TYPOGRAPHY.families.regular, fontSize: compact ? 10 : 12, lineHeight: 16, marginTop: 4, color: focused ? COLORS.primary : COLORS.inkSoft }}>{children}</Text>,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <Se121SharedAsset source={fullFrameNavigationAsset(0, activeIndex)} width={24} nativeFallback={<Home color={color} fill={focused ? color : 'none'} size={24} />} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Se121SharedAsset source={fullFrameNavigationAsset(1, activeIndex)} width={24} nativeFallback={<Search color={color} size={24} />} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Se121SharedAsset source={fullFrameNavigationAsset(2, activeIndex)} width={24} nativeFallback={<CalendarCheck color={color} size={24} />} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) => <Se121SharedAsset source={fullFrameNavigationAsset(3, activeIndex)} width={24} nativeFallback={<Heart color={color} fill={focused ? color : 'none'} size={24} />} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <Se121SharedAsset source={fullFrameNavigationAsset(4, activeIndex)} width={24} nativeFallback={<User color={color} fill={focused ? color : 'none'} size={24} />} />,
        }}
      />
    </Tabs>
  );
}
