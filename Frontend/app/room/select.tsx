import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Check, Users, Coffee } from 'lucide-react-native';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS } from '../../constants/colors';

export default function RoomSelectionScreen() {
  const { id } = useLocalSearchParams();
  const stay = MOCK_STAYS.find((s) => s.id === id) || MOCK_STAYS[0];
  const roomTiers = stay.roomTiers || [
    {
      id: 'rt-std',
      name: 'Phòng Deluxe Standard View Thung Lũng',
      description: 'Phòng giường đôi ban công rộng ngắm view thiên nhiên',
      sizeSqm: 38,
      bedType: '1 Giường King',
      pricePerNight: stay.pricePerNight,
      maxGuests: stay.maxGuests,
      includesBreakfast: true,
      cancellationPolicy: 'Miễn phí hủy trước 48h',
      availableCount: 3,
    },
  ];

  const [selectedTierId, setSelectedTierId] = useState<string>(roomTiers[0].id);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <ArrowLeft size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">Lựa chọn hạng phòng</Text>
          <Text className="text-xs text-gray-500" numberOfLines={1}>{stay.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {roomTiers.map((tier) => {
          const isSelected = selectedTierId === tier.id;
          return (
            <TouchableOpacity
              key={tier.id}
              onPress={() => setSelectedTierId(tier.id)}
              activeOpacity={0.9}
              className={`bg-white rounded-2xl p-4 mb-4 border ${
                isSelected ? 'border-primary shadow-md' : 'border-gray-200 shadow-sm'
              }`}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <Text className="text-base font-extrabold text-gray-900">{tier.name}</Text>
                  <Text className="text-xs text-gray-500 mt-1">{tier.description}</Text>

                  <View className="flex-row items-center mt-2">
                    <View className="flex-row items-center mr-3">
                      <Users size={14} color={COLORS.gray} />
                      <Text className="text-xs text-gray-700 ml-1">
                        Tối đa {tier.maxGuests} người
                      </Text>
                    </View>
                    {tier.includesBreakfast && (
                      <View className="flex-row items-center">
                        <Coffee size={14} color="#128807" />
                        <Text className="text-xs font-semibold text-emerald-800 ml-1">
                          Miễn phí bữa sáng
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View
                  className={`w-5 h-5 rounded-full border items-center justify-center ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}
                >
                  {isSelected && <Check size={12} color="#FFFFFF" />}
                </View>
              </View>

              <View className="flex-row items-baseline justify-between pt-3 mt-3 border-t border-gray-100">
                <Text className="text-xs text-emerald-800 font-medium">
                  {tier.cancellationPolicy}
                </Text>

                <View className="items-end">
                  {tier.originalPrice && (
                    <Text className="text-xs text-gray-400 line-through">
                      {formatPrice(tier.originalPrice)} đ
                    </Text>
                  )}
                  <Text className="text-base font-black text-primary">
                    {formatPrice(tier.pricePerNight)} đ <Text className="text-xs text-gray-500 font-normal">/ đêm</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sticky Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-3.5 flex-row items-center justify-between shadow-lg">
        <View>
          <Text className="text-xs text-gray-400">Đã chọn 1 phòng</Text>
          <Text className="text-base font-black text-primary">
            {formatPrice(
              roomTiers.find((r) => r.id === selectedTierId)?.pricePerNight || stay.pricePerNight
            )}{' '}
            đ <Text className="text-xs text-gray-500 font-normal">/ đêm</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push(`/booking/guest-info?id=${stay.id}&tierId=${selectedTierId}` as any)}
          activeOpacity={0.85}
          className="bg-primary px-6 py-3 rounded-xl shadow-md"
        >
          <Text className="text-white font-bold text-sm">Tiếp tục (Nhập TT)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
