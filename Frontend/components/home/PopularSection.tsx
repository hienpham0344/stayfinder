import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star, MapPin } from 'lucide-react-native';
import { Stay } from '../../types/stay';
import { router } from 'expo-router';

interface PopularSectionProps {
  stays: Stay[];
}

export const PopularSection: React.FC<PopularSectionProps> = ({ stays }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <View className="px-4 my-3">
      <Text className="text-base font-extrabold text-gray-900 mb-3">Phổ biến gần bạn</Text>

      {stays.map((stay) => (
        <TouchableOpacity
          key={stay.id}
          onPress={() => router.push(`/room/${stay.id}` as any)}
          activeOpacity={0.9}
          className="bg-white rounded-2xl p-3 mb-3 border border-gray-100 shadow-sm flex-row items-center"
        >
          <Image
            source={{ uri: stay.images[0] }}
            className="w-24 h-24 rounded-xl"
            resizeMode="cover"
          />

          <View className="flex-1 ml-3.5 justify-between py-0.5">
            <View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-gray-900 flex-1 mr-1" numberOfLines={1}>
                  {stay.title}
                </Text>
                <View className="flex-row items-center">
                  <Star size={13} color="#FFB800" fill="#FFB800" />
                  <Text className="text-xs font-bold text-gray-800 ml-1">{stay.rating}</Text>
                  <Text className="text-[10px] text-gray-400 ml-0.5">({stay.reviewCount})</Text>
                </View>
              </View>

              {stay.cityArea && (
                <View className="flex-row items-center mt-1">
                  <MapPin size={12} color="#717171" />
                  <Text className="text-xs text-gray-500 font-medium ml-1" numberOfLines={1}>
                    {stay.cityArea}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-baseline justify-between mt-2 pt-2 border-t border-gray-100">
              <Text className="text-sm font-extrabold text-primary">
                {formatPrice(stay.pricePerNight)} đ <Text className="text-xs text-gray-500 font-normal">/ đêm</Text>
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};
