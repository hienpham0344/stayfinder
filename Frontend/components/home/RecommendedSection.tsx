import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Star, MapPin, Heart } from 'lucide-react-native';
import { Stay } from '../../types/stay';
import { router } from 'expo-router';

interface RecommendedSectionProps {
  stays: Stay[];
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({ stays }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <View className="my-3">
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-base font-extrabold text-gray-900">Gợi ý dành cho bạn</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
          <Text className="text-xs font-bold text-primary">Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {stays.map((stay) => (
          <TouchableOpacity
            key={stay.id}
            onPress={() => router.push(`/room/${stay.id}` as any)}
            activeOpacity={0.9}
            className="w-64 mr-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <View className="relative h-36 w-full bg-gray-100">
              <Image source={{ uri: stay.images[0] }} className="w-full h-full" resizeMode="cover" />
              <TouchableOpacity className="absolute top-2.5 right-2.5 p-1.5 bg-white/80 rounded-full">
                <Heart size={16} color="#222222" />
              </TouchableOpacity>
              {stay.distanceKm && (
                <View className="absolute bottom-2.5 left-2.5 bg-black/70 px-2 py-0.5 rounded-full flex-row items-center">
                  <MapPin size={11} color="#FFFFFF" />
                  <Text className="text-white text-[10px] font-semibold ml-1">
                    Cách {stay.distanceKm} km
                  </Text>
                </View>
              )}
            </View>

            <View className="p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-gray-900 flex-1 mr-1" numberOfLines={1}>
                  {stay.title}
                </Text>
                <View className="flex-row items-center">
                  <Star size={13} color="#FFB800" fill="#FFB800" />
                  <Text className="text-xs font-bold text-gray-800 ml-1">{stay.rating}</Text>
                </View>
              </View>

              <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                {stay.location.city}, {stay.location.province}
              </Text>

              <View className="flex-row items-baseline mt-2 pt-2 border-t border-gray-100">
                <Text className="text-sm font-extrabold text-primary">
                  {formatPrice(stay.pricePerNight)} đ
                </Text>
                <Text className="text-xs text-gray-500 ml-1">/ đêm</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
