// StayFinder: neutral dark surfaces, warm ivory accents and explicit contrast roles.
export const COLORS = {
  primary: '#EEE4D4',
  primaryHover: '#E4D5BE',
  primaryActive: '#EEE4D4',
  primaryLight: '#EEE4D4',
  primarySoft: '#302B26',
  primaryContainer: '#2F2922',
  primaryMuted: '#CBB89B',
  onPrimary: '#24211E',
  photoText: '#FFFFFF',
  dark: '#F3EEE7',
  textPrimary: '#F3EEE7',
  textSecondary: '#C7C0B7',
  textMuted: '#A7A19A',
  textPlaceholder: '#938D86',
  bgMain: '#1A1A1A',
  bgSecondary: '#2B2927',
  bgCard: '#252423',
  bgSurface: '#252423',
  bgWhite: '#FFFFFF',
  canvas: '#242220',
  borderLight: '#393633',
  borderDark: '#635B53',
  borderDefault: '#393633',
  borderControl: '#81796F',
  borderMuted: '#332F2C',
  error: '#FFADB2',
  errorDark: '#FFB3AB',
  errorBg: '#46282D',
  warning: '#E9C985',
  accentRed: '#F29191',
  accentOrange: '#E7B989',
  inkNavy: '#F3EEE7',
  inkSoft: '#C7C0B7',
  inkSubtle: '#A7A19A',
  borderTealSoft: '#393633',
  surfaceMint: '#302B26',
  surfacePale: '#252423',
  surfaceSage: '#2B2927',
  borderSage: '#635B53',
  actionTeal: '#EEE4D4',
  validation: '#FFADB2',
  starSurface: '#3B3328',
  starGold: '#E9C985',
  overlayBlack: '#000000',
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'PlusJakartaSans-Regular',
  families: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
  },
  monoFamily: 'Liberation Mono',
  mono: {
    fontSize: 16,
    letterSpacing: 1.6,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  sizes: {
    xs: 12,
    sm: 13,
    base: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  lineHeights: {
    xs: 16,
    sm: 18,
    base: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
  },
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, section: 30 } as const;
export const SIZES = { button: 52, appBar: 56, bottomNav: 72, stickyCta: 84, icon: 24, iconButton: 48 } as const;

export const MOTION = { screen: 560, reveal: 680, overlayEnter: 480, overlayExit: 320, press: 240 } as const;

export const RADII = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  promo: 18,
  xl: 18,
  xxl: 24,
  full: 9999,
} as const;

// SHADOWS: Trích xuất 100% từ Figma API effects.
// Xử lý SPREAD âm trong React Native:
// - iOS (RN native): shadowRadius = Math.max(0.5, (blur + spread) / 2) để thu nhỏ vùng mờ tương ứng spread âm.
// - Android: elevation = round(|offsetY| + blur/4 + spread)
// - Web / RN 0.76+: boxShadow string giữ 100% thông số Figma (x, y, blur, spread, color).
export const SHADOWS = {
  // #1: 32 lần — Voucher cards, Wishlist cards, Property cards
  // Figma: Y:4, Blur:12, Spread:0, Alpha:0.04
  cardSoft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6, // (12 + 0) / 2
    elevation: 7, // |4| + 12/4 + 0
    boxShadow: '0px 4px 12px 0px rgba(0, 0, 0, 0.04)',
  },
  // #2: 13 lần — Wishlist grid items, Booking cards
  // Figma: Y:1, Blur:2, Spread:0, Alpha:0.05
  cardSubtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1, // (2 + 0) / 2
    elevation: 2, // |1| + 2/4 + 0
    boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
  },
  // #3: Lớp 1 Nút CTA cố định
  // Figma: Y:2, Blur:4, Spread:-2, Alpha:0.10
  stickyCTA_layer1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 1, // (4 + (-2)) / 2 = 1
    elevation: 1, // |2| + 4/4 + (-2) = 1
    boxShadow: '0px 2px 4px -2px rgba(0, 0, 0, 0.10)',
  },
  // #4: Lớp 2 Nút CTA cố định
  // Figma: Y:4, Blur:6, Spread:-1, Alpha:0.10
  stickyCTA_layer2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 2.5, // (6 + (-1)) / 2 = 2.5
    elevation: 5, // |4| + 6/4 + (-1) = 4.5 -> 5
    boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.10)',
  },
  // #5: Lớp 1 Balance Card, BottomNav, FAB
  // Figma: Y:4, Blur:6, Spread:-4, Alpha:0.10
  elevated_layer1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 1, // (6 + (-4)) / 2 = 1
    elevation: 2, // |4| + 6/4 + (-4) = 1.5 -> 2
    boxShadow: '0px 4px 6px -4px rgba(0, 0, 0, 0.10)',
  },
  // #6: Lớp 2 Balance Card, BottomNav, FAB
  // Figma: Y:10, Blur:15, Spread:-3, Alpha:0.10
  elevated_layer2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 6, // (15 + (-3)) / 2 = 6
    elevation: 11, // |10| + 15/4 + (-3) = 10.75 -> 11
    boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.10)',
  },
  // #7: Profile, Bookings, Search BottomNavBar
  // Figma: Y:-4, Blur:12, Spread:0, Alpha:0.04
  bottomNavLight: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 6, // (12 + 0) / 2
    elevation: 7, // |-4| + 12/4 + 0
    boxShadow: '0px -4px 12px 0px rgba(0, 0, 0, 0.04)',
  },
  // #8: Home, Wishlist BottomNavBar
  // Figma: Y:-4, Blur:12, Spread:0, Alpha:0.20
  bottomNavStrong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.20,
    shadowRadius: 6, // (12 + 0) / 2
    elevation: 7, // |-4| + 12/4 + 0
    boxShadow: '0px -4px 12px 0px rgba(0, 0, 0, 0.20)',
  },
  // #9: Payment Sticky CTA, Booking Bar
  // Figma: Y:-4, Blur:12, Spread:0, Alpha:0.08
  stickyFooter: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 6, // (12 + 0) / 2
    elevation: 7, // |-4| + 12/4 + 0
    boxShadow: '0px -4px 12px 0px rgba(0, 0, 0, 0.08)',
  },
  // #13: Compare Prices Bottom Sheet
  // Figma: Y:-8, Blur:24, Spread:0, Alpha:0.12
  bottomSheetSmall: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 12, // (24 + 0) / 2
    elevation: 14, // |-8| + 24/4 + 0
    boxShadow: '0px -8px 24px 0px rgba(0, 0, 0, 0.12)',
  },
  // #15: Filters Bottom Sheet
  // Figma: Y:-12, Blur:40, Spread:0, Alpha:0.10
  bottomSheetLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.10,
    shadowRadius: 20, // (40 + 0) / 2
    elevation: 22, // |-12| + 40/4 + 0
    boxShadow: '0px -12px 40px 0px rgba(0, 0, 0, 0.10)',
  },
} as const;


