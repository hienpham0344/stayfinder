import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Search, X, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { MOCK_STAYS } from '../../constants/mockStays';
import { StayCard } from '../../components/home/StayCard';
import { COLORS } from '../../constants/colors';

const LOCATIONS = ['Tất cả', 'Đà Lạt', 'Phú Quốc', 'Sapa', 'Đà Nẵng'];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Tất cả');

  const filteredStays = MOCK_STAYS.filter((stay) => {
    const matchesQuery =
      stay.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stay.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stay.location.province.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      selectedLocation === 'Tất cả' ||
      stay.location.city.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesQuery && matchesLocation;
  });

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {/* Search Header Input */}
      <View className="px-4 pb-3 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row items-center bg-gray-100 rounded-2xl px-3.5 py-2.5">
          <Search size={20} color={COLORS.gray} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo tên homestay, thành phố (ví dụ: Đà Lạt)..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2.5 text-sm text-gray-900 font-medium py-1"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <X size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Location Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {LOCATIONS.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <TouchableOpacity
                key={loc}
                onPress={() => setSelectedLocation(loc)}
                activeOpacity={0.8}
                className={`flex-row items-center px-4 py-2 rounded-full mr-2 border ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-200'
                }`}
              >
                <MapPin size={14} color={isSelected ? '#FFFFFF' : COLORS.gray} className="mr-1" />
                <Text
                  className={`text-xs font-semibold ml-1 ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-sm font-bold text-gray-700">
          {filteredStays.length} homestay được tìm thấy
        </Text>
        <TouchableOpacity className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-gray-200">
          <SlidersHorizontal size={14} color={COLORS.dark} />
          <Text className="text-xs font-semibold text-gray-700 ml-1.5">Bộ lọc</Text>
        </TouchableOpacity>
      </View>

      {/* Results List */}
      <FlatList
        data={filteredStays}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StayCard stay={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-4">
            <Text className="text-base font-bold text-gray-700">Không tìm thấy địa điểm nào</Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc địa điểm.
            </Text>
          </View>
        }
      />
    </View>
  );
}
