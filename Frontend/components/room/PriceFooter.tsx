import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

interface PriceFooterProps {
  stayId: string;
  pricePerNight: number;
}

export const PriceFooter: React.FC<PriceFooterProps> = ({ stayId, pricePerNight }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-3.5 flex-row items-center justify-between shadow-lg">
      <View>
        <View className="flex-row items-baseline">
          <Text className="text-lg font-extrabold text-primary">
            {formatPrice(pricePerNight)} đ
          </Text>
          <Text className="text-xs text-gray-500 ml-1">/ đêm</Text>
        </View>
        <Text className="text-xs text-gray-400">Đã bao gồm thuế & phí</Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push(`/booking/checkout?id=${stayId}` as any)}
        activeOpacity={0.85}
        className="bg-primary px-7 py-3 rounded-xl shadow-md"
      >
        <Text className="text-white font-bold text-base">Đặt phòng ngay</Text>
      </TouchableOpacity>
    </View>
  );
};
