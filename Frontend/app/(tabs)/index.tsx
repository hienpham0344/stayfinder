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
import { STAY_CATALOG, stayImage } from '../../constants/stayCatalog';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/tokens';
import { MotionScreen } from '../../components/ui/MotionScreen';
import { MotionView } from '../../components/ui/MotionView';
import { apiEnabled } from '../../services/api';
import { LiveHomeScreen } from '../../components/live/LiveCatalog';

export default function HomeScreen() {
  return apiEnabled ? <LiveHomeScreen /> : <DemoHomeScreen />;
}

function DemoHomeScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);

  const categoryStays = STAY_CATALOG.filter((stay) => selectedCategory === 'all' || stay.type === selectedCategory);
  const displayRecommended = categoryStays.slice(0, 4);
  const displayPopular = categoryStays.filter((stay) => stay.isPopularNearYou).length ? categoryStays.filter((stay) => stay.isPopularNearYou) : categoryStays.slice(0, 3);
  const handleSeeAll = () => {
    router.push(`/search?category=${selectedCategory}` as never);
  };
  const openCriteria = () => router.push('/search?entry=criteria&origin=home' as never);
  const openFilters = () => router.push('/search?entry=filters&origin=home' as never);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgMain} />
      <MotionScreen style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <MotionView delay={0} duration={700}><HomeHeader
            onSearchPress={openCriteria}
            onFilterPress={openFilters}
            locationName="Find your next escape"
            onLocationPress={() => router.push('/search?entry=destination&origin=home' as never)}
            onNotificationPress={() => setShowNotifications((visible) => !visible)}
          /></MotionView>
          {showNotifications && <TouchableOpacity onPress={() => setShowNotifications(false)} accessibilityRole="button" accessibilityLabel="Dismiss notifications" style={{ padding: 16, marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.bgSecondary, borderRadius: 16 }}><Text style={{ color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.families.regular }}>You're all caught up. New trip updates will appear here.</Text></TouchableOpacity>}
          {/* Section 1: Promo Banner */}
          <MotionView delay={80} preset="scale" duration={780}><PromoBanner onPress={handleSeeAll} /></MotionView>

          {/* Section 2: Category Chips (Hotels, Homestays, Villas, Resorts, Cabins) */}
          <MotionView delay={140}><CategoryScroll
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          /></MotionView>

          {/* Section 3: Recommended for you (Horizontal Card Scroll) */}
          <View style={styles.sectionContainer}>
            <MotionView style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">Worth the journey</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll} accessibilityRole="button">
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </MotionView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {displayRecommended.map((stay, index) => (
                <MotionView key={`${selectedCategory}-${stay.id}`} delay={index * 70}>
                <PropertyCardHorizontal
                  key={stay.id}
                  stay={stay}
                  imageSource={stayImage(stay)}
                  onPress={() => router.push(`/room/${stay.id}` as never)}
                />
                </MotionView>
              ))}
            </ScrollView>
          </View>

          {/* Section 4: Popular near you (Vertical Property Cards) */}
          <View style={styles.sectionContainer}>
            <MotionView style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} accessibilityRole="header">A stay for every story</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleSeeAll} accessibilityRole="button">
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </MotionView>

            <View style={styles.verticalListContainer}>
              {displayPopular.map((stay, index) => (
                <MotionView key={`${selectedCategory}-${stay.id}`} delay={index * 70}><PropertyCardVertical stay={stay} imageSource={stayImage(stay)} onPress={() => router.push(`/room/${stay.id}` as never)} /></MotionView>
              ))}
            </View>
          </View>
        </ScrollView>
      </MotionScreen>
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
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: SPACING.section,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.families.regular,
    flexShrink: 1,
    marginRight: 12,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.7,
    color: COLORS.dark,
  },
  seeAllText: {
    fontFamily: TYPOGRAPHY.families.regular,
    fontSize: 13,
    lineHeight: 24,
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
