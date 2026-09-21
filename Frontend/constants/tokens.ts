// Design tokens extracted 100% directly from Figma Node 34:2 (SE121)

export const COLORS = {
  // Primary Teal Palette
  primary: '#005F55',
  primaryHover: '#007A6D',
  primaryActive: '#0B7A6D',
  primaryLight: '#98F3E3',
  primarySoft: '#AAFFEF',
  primaryContainer: '#00201C',
  primaryMuted: '#7CD6C7',

  // Neutral Palette
  dark: '#181D1B',
  textPrimary: '#181D1B',
  textSecondary: '#3E4946',
  textMuted: '#6E7976',
  textPlaceholder: '#6B7280',

  // Background Palette
  bgMain: '#F6FAF8',
  bgSecondary: '#EBEFEC',
  bgCard: '#F1F4F2',
  bgSurface: '#FAFAFA',
  bgWhite: '#FFFFFF',

  // Borders
  borderLight: '#DFE3E1',
  borderDark: '#BDC9C5',
  borderDefault: '#E5E7EB',
  borderMuted: '#E5E9E7',

  // Feedback Colors
  error: '#BA1A1A',
  errorDark: '#AC3323',
  errorBg: '#FFDAD6',
  warning: '#F59E0B',
  accentRed: '#EF6466',
  accentOrange: '#FD6E58',
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'Plus Jakarta Sans',
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

export const RADII = {
  xs: 2,
  sm: 5,
  md: 6,
  lg: 16,
  xl: 32,
  xxl: 48,
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


