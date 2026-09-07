import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, User, Mail, Phone, MessageSquare, ShieldCheck } from 'lucide-react-native';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS } from '../../constants/colors';

export default function GuestInfoScreen() {
  const { id, tierId } = useLocalSearchParams();
  const stay = MOCK_STAYS.find((s) => s.id === id) || MOCK_STAYS[0];

  const [fullName, setFullName] = useState('Phạm Văn Hiển');
  const [email, setEmail] = useState('hienpham@stayfinder.vn');
  const [phone, setPhone] = useState('0987654321');
  const [specialRequest, setSpecialRequest] = useState('');

  const handleNextToPayment = () => {
    router.push(`/booking/checkout?id=${stay.id}&tierId=${tierId}` as any);
  };

  return (
    <View className="flex-1 bg-white pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <ArrowLeft size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Thông tin người đặt phòng</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text className="text-xs text-gray-500 mb-4">
          Thông tin này sẽ được gửi tới chủ nhà để làm thủ tục nhận phòng (Check-in).
        </Text>

        {/* Full Name Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-gray-800 mb-1.5">Họ và tên đầy đủ *</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-3.5 py-3 border border-gray-200">
            <User size={18} color={COLORS.gray} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên..."
              className="flex-1 ml-2.5 text-sm text-gray-900 font-medium"
            />
          </View>
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-gray-800 mb-1.5">Địa chỉ Email xác nhận *</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-3.5 py-3 border border-gray-200">
            <Mail size={18} color={COLORS.gray} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="nhapemail@domain.com"
              className="flex-1 ml-2.5 text-sm text-gray-900 font-medium"
            />
          </View>
        </View>

        {/* Phone Input */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-gray-800 mb-1.5">Số điện thoại liên hệ *</Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl px-3.5 py-3 border border-gray-200">
            <Phone size={18} color={COLORS.gray} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="09xx xxx xxx"
              className="flex-1 ml-2.5 text-sm text-gray-900 font-medium"
            />
          </View>
        </View>

        {/* Special Request */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-800 mb-1.5">Yêu cầu đặc biệt (Không bắt buộc)</Text>
          <View className="bg-gray-50 rounded-2xl p-3 border border-gray-200 flex-row">
            <MessageSquare size={18} color={COLORS.gray} />
            <TextInput
              value={specialRequest}
              onChangeText={setSpecialRequest}
              multiline
              numberOfLines={3}
              placeholder="Ví dụ: Cần phòng tầng cao, check-in muộn lúc 20h..."
              className="flex-1 ml-2.5 text-sm text-gray-900 font-medium"
            />
          </View>
        </View>

        <View className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex-row items-center mb-6">
          <ShieldCheck size={20} color="#059669" />
          <Text className="text-xs text-emerald-800 ml-2.5 flex-1">
            Thông tin của bạn được bảo mật tuyệt đối theo chính sách riêng tư của StayFinder.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNextToPayment}
          activeOpacity={0.9}
          className="bg-primary py-4 rounded-2xl items-center shadow-md"
        >
          <Text className="text-white font-bold text-base">Tiếp tục đến Thanh toán</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
