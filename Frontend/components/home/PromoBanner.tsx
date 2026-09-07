import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Gift, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';

export const PromoBanner: React.FC = () => {
  return (
    <View className="mx-4 my-3 p-4 bg-primary rounded-3xl shadow-md overflow-hidden relative">
      <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full self-start mb-2">
        <Gift size={14} color="#FFFFFF" />
        <Text className="text-white text-xs font-bold uppercase tracking-wider ml-1.5">
          ƯU ĐÃI ĐẶC BIỆT
        </Text>
      </View>

      <Text className="text-xl font-black text-white leading-tight">
        Tiết kiệm 20% cho lần đặt phòng đầu tiên
      </Text>
      <Text className="text-xs text-white/90 mt-1">
        Áp dụng cho mọi khách sạn, homestay trên toàn quốc.
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/rewards' as any)}
        activeOpacity={0.85}
        className="mt-3 bg-white py-2 px-4 rounded-xl self-start flex-row items-center shadow-sm"
      >
        <Text className="text-primary font-bold text-xs">Nhận ưu đãi ngay</Text>
        <ArrowRight size={14} color="#FF385C" className="ml-1" />
      </TouchableOpacity>
    </View>
  );
};
