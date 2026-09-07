import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { User, Shield, CreditCard, Settings, HelpCircle, LogOut, ChevronRight, Heart } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

export default function ProfileScreen() {
  const MENU_ITEMS = [
    { id: '1', title: 'Thông tin cá nhân', icon: User },
    { id: '2', title: 'Danh sách yêu thích', icon: Heart },
    { id: '3', title: 'Phương thức thanh toán', icon: CreditCard },
    { id: '4', title: 'Bảo mật & Quyền riêng tư', icon: Shield },
    { id: '5', title: 'Cài đặt ứng dụng', icon: Settings },
    { id: '6', title: 'Trợ giúp & Hỗ trợ', icon: HelpCircle },
  ];

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card Header */}
        <View className="bg-white p-5 border-b border-gray-100 flex-row items-center">
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            }}
            className="w-16 h-16 rounded-full border-2 border-primary"
          />
          <View className="ml-4 flex-1">
            <Text className="text-lg font-bold text-gray-900">Phạm Văn Hiển</Text>
            <Text className="text-xs text-gray-500">hienpham@stayfinder.vn</Text>
            <View className="bg-red-50 px-2.5 py-0.5 rounded-full self-start mt-1.5 border border-primary/20">
              <Text className="text-xs font-bold text-primary">Thành viên VIP</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white mt-4 border-y border-gray-100 px-4">
          {MENU_ITEMS.map((item, index) => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                className={`flex-row items-center justify-between py-4 ${
                  index !== MENU_ITEMS.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-row items-center">
                  <View className="p-2 rounded-xl bg-gray-100 mr-3">
                    <IconComp size={18} color={COLORS.dark} />
                  </View>
                  <Text className="text-sm font-semibold text-gray-800">{item.title}</Text>
                </View>
                <ChevronRight size={18} color={COLORS.gray} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center bg-white mt-6 py-4 px-4 border-y border-gray-100"
        >
          <LogOut size={18} color="#D32F2F" className="mr-2" />
          <Text className="text-sm font-bold text-red-600 ml-2">Đăng xuất</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 mt-6">
          StayFinder App v1.0.0 • Powered by Expo 57 & NativeWind
        </Text>
      </ScrollView>
    </View>
  );
}
