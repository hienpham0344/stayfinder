import React, { useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import { Header } from '../../components/common/Header';
import { CategoryFilter } from '../../components/home/CategoryFilter';
import { StayCard } from '../../components/home/StayCard';
import { MOCK_STAYS } from '../../constants/mockStays';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredStays = selectedCategory === 'all'
    ? MOCK_STAYS
    : MOCK_STAYS.filter((stay) => stay.category === selectedCategory);

  return (
    <View className="flex-1 bg-gray-50">
      <Header />
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <FlatList
        data={filteredStays}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StayCard stay={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Text className="text-base text-gray-500 font-medium">
              Không tìm thấy homestay phù hợp với danh mục này
            </Text>
          </View>
        }
      />
    </View>
  );
}
