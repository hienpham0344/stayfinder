import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { HomeHeader } from '../../components/home/HomeHeader';
import { PromoBanner } from '../../components/home/PromoBanner';
import { CategoryScroll } from '../../components/home/CategoryScroll';
import { PropertyCardHorizontal } from '../../components/home/PropertyCardHorizontal';
import { PropertyCardVertical } from '../../components/home/PropertyCardVertical';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('Hotel');

  const filteredStays = MOCK_STAYS.filter(
    (stay) => stay.type === selectedCategory || stay.category === selectedCategory
  );

  const recommendedStays = filteredStays.length > 0
    ? filteredStays.filter((s) => s.isRecommended || s.isFeatured)
    : MOCK_STAYS.filter((s) => s.isRecommended || s.isFeatured);

  const displayRecommended =
    recommendedStays.length > 0 ? recommendedStays : MOCK_STAYS;

  const popularStays = filteredStays.length > 0
    ? filteredStays.filter((s) => s.isPopularNearYou || !s.isRecommended)
    : MOCK_STAYS.filter((s) => s.isPopularNearYou || !s.isRecommended);

  const displayPopular =
    popularStays.length > 0 ? popularStays : MOCK_STAYS;

  const handleSeeAll = () => {
    router.push('/search');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgMain} />
      <View style={styles.container}>
        {/* Header with Brand "StayFinder" & Search Bar */}
        <HomeHeader onSearchPress={handleSeeAll} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Section 1: Promo Banner */}
          <PromoBanner onPress={handleSeeAll} />

          {/* Section 2: Category Chips (Hotels, Homestays, Villas, Resorts, Cabins) */}
          <CategoryScroll
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Section 3: Recommended for you (Horizontal Card Scroll) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dành cho bạn</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {displayRecommended.map((stay) => (
                <PropertyCardHorizontal key={stay.id} stay={stay} />
              ))}
            </ScrollView>
          </View>

          {/* Section 4: Popular near you (Vertical Property Cards) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gần bạn & Phổ biến</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.verticalListContainer}>
              {displayPopular.map((stay) => (
                <PropertyCardVertical key={stay.id} stay={stay} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgMain,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  sectionContainer: {
    marginBottom: SPACING.section,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: TYPOGRAPHY.sizes.lg, // 20px
    lineHeight: TYPOGRAPHY.lineHeights.lg,
    color: COLORS.dark,
  },
  seeAllText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
    color: COLORS.primary,
  },
  horizontalScrollContent: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },
  verticalListContainer: {
    paddingHorizontal: SPACING.xl,
  },
});
