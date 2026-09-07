import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Heart, Share2, Star, MapPin, Award, ShieldCheck } from 'lucide-react-native';
import { MOCK_STAYS } from '../../constants/mockStays';
import { ImageCarousel } from '../../components/room/ImageCarousel';
import { AmenityGrid } from '../../components/room/AmenityGrid';
import { PriceFooter } from '../../components/room/PriceFooter';
import { COLORS } from '../../constants/colors';

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams();
  const stay = MOCK_STAYS.find((s) => s.id === id) || MOCK_STAYS[0];

  return (
    <View className="flex-1 bg-white">
      {/* Scrollable Room Detail Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Gallery Header */}
        <View className="relative">
          <ImageCarousel images={stay.images} />

          {/* Header Action Buttons Overlay */}
          <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2.5 bg-white/90 rounded-full shadow-md"
            >
              <ArrowLeft size={20} color={COLORS.dark} />
            </TouchableOpacity>

            <View className="flex-row space-x-2">
              <TouchableOpacity className="p-2.5 bg-white/90 rounded-full shadow-md mr-2">
                <Share2 size={18} color={COLORS.dark} />
              </TouchableOpacity>
              <TouchableOpacity className="p-2.5 bg-white/90 rounded-full shadow-md">
                <Heart size={18} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Room Info Body */}
        <View className="p-5">
          <Text className="text-2xl font-extrabold text-gray-900 leading-tight">
            {stay.title}
          </Text>

          {/* Rating & Location Summary */}
          <View className="flex-row items-center mt-2.5 pb-4 border-b border-gray-100">
            <Star size={16} color="#FFB800" fill="#FFB800" />
            <Text className="text-sm font-bold text-gray-900 ml-1.5">{stay.rating}</Text>
            <Text className="text-xs text-gray-500 ml-1">({stay.reviewCount} đánh giá)</Text>
            <Text className="text-gray-300 mx-2">•</Text>
            <MapPin size={14} color={COLORS.gray} />
            <Text className="text-xs text-gray-700 font-semibold ml-1 flex-1" numberOfLines={1}>
              {stay.location.address}
            </Text>
          </View>

          {/* Capacity Stats */}
          <View className="py-4 border-b border-gray-100 flex-row items-center justify-around bg-gray-50 rounded-2xl my-3 px-3">
            <View className="items-center">
              <Text className="text-xs text-gray-400">Tối đa</Text>
              <Text className="text-sm font-bold text-gray-800">{stay.maxGuests} khách</Text>
            </View>
            <View className="h-6 w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-xs text-gray-400">Phòng ngủ</Text>
              <Text className="text-sm font-bold text-gray-800">{stay.bedrooms} phòng</Text>
            </View>
            <View className="h-6 w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-xs text-gray-400">Giường</Text>
              <Text className="text-sm font-bold text-gray-800">{stay.beds} giường</Text>
            </View>
            <View className="h-6 w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-xs text-gray-400">Phòng tắm</Text>
              <Text className="text-sm font-bold text-gray-800">{stay.baths} phòng</Text>
            </View>
          </View>

          {/* Host Profile */}
          <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center flex-1 mr-2">
              <Image
                source={{ uri: stay.host.avatar }}
                className="w-12 h-12 rounded-full mr-3 border border-gray-200"
              />
              <View>
                <Text className="text-sm font-bold text-gray-900">Chủ nhà {stay.host.name}</Text>
                <Text className="text-xs text-gray-500">Tham gia {stay.host.joinedDate}</Text>
              </View>
            </View>
            {stay.host.isSuperhost && (
              <View className="flex-row items-center bg-red-50 border border-primary/20 px-3 py-1.5 rounded-full">
                <Award size={14} color={COLORS.primary} />
                <Text className="text-xs font-bold text-primary ml-1">Chủ nhà siêu cấp</Text>
              </View>
            )}
          </View>

          {/* Stay Description */}
          <View className="py-4 border-b border-gray-100">
            <Text className="text-base font-bold text-gray-900 mb-2">Mô tả chỗ ở</Text>
            <Text className="text-sm text-gray-600 leading-relaxed">{stay.description}</Text>
          </View>

          {/* Amenities Grid */}
          <AmenityGrid amenities={stay.amenities} />

          {/* Protection policy */}
          <View className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex-row items-center">
            <ShieldCheck size={24} color="#059669" className="mr-3" />
            <View className="flex-1 ml-2">
              <Text className="text-xs font-bold text-emerald-900">Bảo vệ StayFinder Cover</Text>
              <Text className="text-xs text-emerald-700 mt-0.5">
                Được bảo vệ hoàn tiền nếu chủ nhà hủy phòng đột xuất hoặc thông tin sai lệch.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Price & Reserve Bar */}
      <PriceFooter stayId={stay.id} pricePerNight={stay.pricePerNight} />
    </View>
  );
}
