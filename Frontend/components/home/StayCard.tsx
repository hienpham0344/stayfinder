import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { Stay } from '../../types/stay';
import { router } from 'expo-router';

interface StayCardProps {
  stay: Stay;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

export const StayCard: React.FC<StayCardProps> = ({ stay }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => router.push(`/room/${stay.id}` as any)}
      className="mb-6 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
    >
      {/* Image Carousel */}
      <View className="relative h-64 w-full bg-gray-100">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const slide = Math.ceil(
              e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
            );
            if (slide !== activeImageIndex) {
              setActiveImageIndex(slide);
            }
          }}
          scrollEventThrottle={16}
        >
          {stay.images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={{ width: CARD_WIDTH, height: 256 }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Favorite Button */}
        <TouchableOpacity
          onPress={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-2 bg-white/80 rounded-full"
        >
          <Heart size={20} color={isLiked ? '#FF385C' : '#222222'} fill={isLiked ? '#FF385C' : 'transparent'} />
        </TouchableOpacity>

        {/* Badge tag if featured */}
        {stay.isFeatured && (
          <View className="absolute top-3 left-3 bg-black/80 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">Nổi bật</Text>
          </View>
        )}

        {/* Carousel Dots Indicator */}
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center space-x-1.5">
          {stay.images.map((_, idx) => (
            <View
              key={idx}
              className={`h-1.5 rounded-full ${
                activeImageIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Card Content */}
      <View className="p-3.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
            {stay.location.city}, {stay.location.province}
          </Text>
          <View className="flex-row items-center">
            <Star size={15} color="#FFB800" fill="#FFB800" />
            <Text className="text-sm font-bold text-gray-900 ml-1">{stay.rating}</Text>
          </View>
        </View>

        <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
          {stay.title}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {stay.maxGuests} khách • {stay.bedrooms} phòng ngủ • {stay.beds} giường
        </Text>

        <View className="flex-row items-baseline mt-2">
          <Text className="text-base font-extrabold text-primary">
            {formatPrice(stay.pricePerNight)} đ
          </Text>
          <Text className="text-xs text-gray-500 ml-1">/ đêm</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
