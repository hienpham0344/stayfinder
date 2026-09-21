import { Tabs, usePathname } from 'expo-router';
import { Home, Search, Heart, Calendar, User } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../constants/tokens';

export default function TabsLayout() {
  const pathname = usePathname();

  // Home ('/' hoặc '/index') và Wishlist ('/wishlist') dùng bottomNavStrong (alpha 0.20)
  // Search ('/search'), Bookings ('/bookings'), Profile ('/profile') dùng bottomNavLight (alpha 0.04)
  const isStrongShadow = pathname === '/' || pathname === '/index' || pathname.endsWith('/wishlist');
  const activeShadow = isStrongShadow ? SHADOWS.bottomNavStrong : SHADOWS.bottomNavLight;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.bgWhite,
          borderTopWidth: 1,
          borderTopColor: COLORS.borderLight,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: activeShadow.elevation,
          shadowColor: activeShadow.shadowColor,
          shadowOffset: activeShadow.shadowOffset,
          shadowOpacity: activeShadow.shadowOpacity,
          shadowRadius: activeShadow.shadowRadius,
          ...(activeShadow.boxShadow ? { boxShadow: activeShadow.boxShadow } : {}),
        },
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.fontFamily,
          fontSize: TYPOGRAPHY.sizes.xs,
          fontWeight: TYPOGRAPHY.weights.medium as any,
          lineHeight: TYPOGRAPHY.lineHeights.xs,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Home color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Tìm kiếm',
          tabBarIcon: ({ color }) => <Search color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Yêu thích',
          tabBarIcon: ({ color }) => <Heart color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Đặt phòng',
          tabBarIcon: ({ color }) => <Calendar color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
