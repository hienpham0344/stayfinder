import React, { useRef, useState } from 'react';
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
  // These local refs mirror Figma's variable-only prototype actions. None of
  // them has a bound visible layer in the Home frame.
  const choiceTitle = useRef('Choose an option');
  const editorShowOne = useRef(true);
  const bookingProperty = useRef('Villa Azure Retreat');

  const displayRecommended = [MOCK_STAYS[0], MOCK_STAYS[1]];
  const displayPopular = [MOCK_STAYS[2], MOCK_STAYS[3]];
  const recommendedImages = [
    require('../../assets/figma/se121-parity/home/recommended-alpine-exact.png'),
    require('../../assets/figma/se121-parity/home/recommended-desert.jpeg'),
  ];
  const popularImages = [
    require('../../assets/figma/se121-parity/home/popular-urban.png'),
    require('../../assets/figma/se121-parity/home/popular-ivy.png'),
  ];

  const handleSeeAll = () => {
    router.push('/search');
  };
  const openCriteria = () => router.push('/search?entry=criteria&origin=home' as never);
  const openFilters = () => router.push('/search?entry=filters&origin=home' as never);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgMain} />
      <View style={styles.container}>
        {/* Header with Brand "StayFinder" & Search Bar */}
        <HomeHeader
          onSearchPress={openCriteria}
          onFilterPress={openFilters}
          // The Figma prototype updates local variables only for these controls;
          // it has no destination frame or visible overlay state.
          onLocationPress={() => { choiceTitle.current = 'Choose destination'; }}
          onNotificationPress={() => { editorShowOne.current = false; }}
        />

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
              <Text style={styles.sectionTitle}>Recommended for you</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {displayRecommended.map((stay, index) => (
                <PropertyCardHorizontal
                  key={stay.id}
                  stay={stay}
                  imageSource={recommendedImages[index]}
                  imageCrop={index === 1 ? 'figma-desert' : undefined}
                  priceLabel={index === 0 ? '$85' : '$120'}
                  onPress={() => { bookingProperty.current = stay.title; }}
                />
              ))}
            </ScrollView>
          </View>

          {/* Section 4: Popular near you (Vertical Property Cards) */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular near you</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.verticalListContainer}>
              {displayPopular.map((stay, index) => (
                <PropertyCardVertical key={stay.id} stay={stay} imageSource={popularImages[index]} onPress={() => { bookingProperty.current = stay.title; }} />
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
    backgroundColor: '#F6FBF9',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
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
