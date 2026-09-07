import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';

export const Header: React.FC = () => {
  return (
    <View className="px-4 pt-12 pb-3 bg-white border-b border-gray-100 shadow-sm">
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/search')}
        activeOpacity={0.9}
        className="flex-row items-center justify-between px-4 py-3 bg-white rounded-full border border-gray-200 shadow-md"
      >
        <View className="flex-row items-center flex-1 space-x-3">
          <Search size={20} color="#FF385C" />
          <View className="ml-3">
            <Text className="text-sm font-bold text-neutral-800">Bạn muốn đi đâu?</Text>
            <Text className="text-xs text-gray-500">Đà Lạt • Sapa • Phú Quốc • Bất kỳ tuần nào</Text>
          </View>
        </View>
        <View className="p-2 rounded-full bg-gray-100">
          <SlidersHorizontal size={16} color="#222222" />
        </View>
      </TouchableOpacity>
    </View>
  );
};
