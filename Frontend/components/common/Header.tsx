import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';

export const Header: React.FC = () => {
  return (
    <View className="px-5 pt-12 pb-3 bg-white border-b border-gray-100 shadow-sm">
      {/* Brand Header Logo */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text className="text-2xl font-black text-primary tracking-tight">StayFinder</Text>
          <Sparkles size={16} color="#FF385C" className="ml-1" />
        </View>
      </View>

      {/* Search Bar Input & Filter Button */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.9}
          className="flex-1 flex-row items-center px-4 py-2.5 bg-gray-100 rounded-2xl mr-2"
        >
          <Search size={18} color="#717171" />
          <Text className="text-xs text-gray-500 font-medium ml-2">Bạn muốn ở đâu?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
          className="p-3 bg-neutral-900 rounded-2xl shadow-sm"
        >
          <SlidersHorizontal size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
