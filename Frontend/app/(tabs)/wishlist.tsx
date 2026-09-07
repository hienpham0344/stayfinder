import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { MOCK_STAYS } from '../../constants/mockStays';
import { Heart, Star, MapPin } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { router } from 'expo-router';

export default function WishlistScreen() {
  const wishlistStays = [MOCK_STAYS[0], MOCK_STAYS[1]];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {/* Header Title */}
      <View className="px-5 pb-3 bg-white border-b border-gray-100 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-extrabold text-gray-900">Danh sách yêu thích</Text>
          <Text className="text-xs text-gray-500 mt-0.5">{wishlistStays.length} chỗ ở đã lưu</Text>
        </View>
      </View>

      {/* Wishlist Grid / List */}
      <FlatList
        data={wishlistStays}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/room/${item.id}` as any)}
            className="bg-white rounded-2xl p-3.5 mb-4 border border-gray-200 shadow-sm flex-row"
          >
            <View className="relative">
              <Image
                source={{ uri: item.images[0] }}
                className="w-28 h-28 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-full">
                <Heart size={16} color="#FF385C" fill="#FF385C" />
              </TouchableOpacity>
            </View>

            <View className="flex-1 ml-3.5 justify-between">
              <View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-primary">{item.type}</Text>
                  <View className="flex-row items-center">
                    <Star size={13} color="#FFB800" fill="#FFB800" />
                    <Text className="text-xs font-bold text-gray-800 ml-1">{item.rating}</Text>
                  </View>
                </View>
                <Text className="text-sm font-bold text-gray-900 mt-0.5" numberOfLines={1}>
                  {item.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={12} color={COLORS.gray} />
                  <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
                    {item.location.city}, {item.location.province}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-baseline justify-between pt-2 border-t border-gray-100">
                <Text className="text-sm font-extrabold text-primary">
                  {formatPrice(item.pricePerNight)} đ <Text className="text-xs text-gray-500 font-normal">/ đêm</Text>
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
