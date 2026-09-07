import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Header } from '../../components/common/Header';
import { PromoBanner } from '../../components/home/PromoBanner';
import { CategoryFilter } from '../../components/home/CategoryFilter';
import { RecommendedSection } from '../../components/home/RecommendedSection';
import { PopularSection } from '../../components/home/PopularSection';
import { MOCK_STAYS } from '../../constants/mockStays';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredStays = selectedCategory === 'all'
    ? MOCK_STAYS
    : MOCK_STAYS.filter((stay) => stay.type === selectedCategory || stay.category === selectedCategory);

  const recommendedStays = filteredStays.filter((s) => s.isRecommended || s.isFeatured);
  const popularStays = filteredStays.filter((s) => s.isPopularNearYou || !s.isRecommended);

  return (
    <View className="flex-1 bg-gray-50">
      <Header />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Section 1: Promo Banner (SPECIAL OFFER) */}
        <PromoBanner />

        {/* Section 2: Categories (Hotel, Homestay, Resort, Villas) */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Section 3: Recommended for you */}
        <RecommendedSection stays={recommendedStays.length > 0 ? recommendedStays : MOCK_STAYS} />

        {/* Section 4: Popular near you */}
        <PopularSection stays={popularStays.length > 0 ? popularStays : MOCK_STAYS} />
      </ScrollView>
    </View>
  );
}
