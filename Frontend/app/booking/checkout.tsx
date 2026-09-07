import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Calendar, Users, CreditCard, CheckCircle2 } from 'lucide-react-native';
import { MOCK_STAYS } from '../../constants/mockStays';
import { COLORS } from '../../constants/colors';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const stay = MOCK_STAYS.find((s) => s.id === id) || MOCK_STAYS[0];

  const [nights] = useState(3);
  const [guests] = useState(2);
  const [selectedPayment, setSelectedPayment] = useState<'MOMO' | 'VNPay' | 'CreditCard'>('MOMO');
  const [isSuccess, setIsSuccess] = useState(false);

  const roomTotal = stay.pricePerNight * nights;
  const totalAmount = roomTotal + stay.cleaningFee + stay.serviceFee;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handleConfirmBooking = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.replace('/(tabs)/bookings');
    }, 1500);
  };

  if (isSuccess) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <CheckCircle2 size={72} color="#128807" />
        <Text className="text-2xl font-extrabold text-gray-900 mt-4 text-center">
          Đặt phòng thành công!
        </Text>
        <Text className="text-sm text-gray-500 mt-2 text-center">
          Mã xác nhận chuyến đi đã được gửi tới email của bạn.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <ArrowLeft size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Xác nhận và thanh toán</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Stay Brief Card */}
        <View className="flex-row p-3.5 bg-gray-50 rounded-2xl border border-gray-200 mb-6">
          <Image
            source={{ uri: stay.images[0] }}
            className="w-24 h-24 rounded-xl border border-gray-200"
            resizeMode="cover"
          />
          <View className="flex-1 ml-3.5 justify-between">
            <View>
              <Text className="text-xs font-semibold text-primary">{stay.type}</Text>
              <Text className="text-sm font-bold text-gray-900 mt-0.5" numberOfLines={2}>
                {stay.title}
              </Text>
            </View>
            <Text className="text-xs font-medium text-gray-500">
              {stay.location.city}, {stay.location.province}
            </Text>
          </View>
        </View>

        {/* Trip Details */}
        <View className="py-4 border-b border-gray-100">
          <Text className="text-base font-bold text-gray-900 mb-3">Chuyến đi của bạn</Text>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Calendar size={18} color={COLORS.gray} />
              <View className="ml-2.5">
                <Text className="text-xs font-semibold text-gray-800">Ngày đặt phòng</Text>
                <Text className="text-xs text-gray-500">15 Th10 – 18 Th10 ({nights} đêm)</Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Users size={18} color={COLORS.gray} />
              <View className="ml-2.5">
                <Text className="text-xs font-semibold text-gray-800">Số lượng khách</Text>
                <Text className="text-xs text-gray-500">{guests} người lớn</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price Breakdown */}
        <View className="py-4 border-b border-gray-100">
          <Text className="text-base font-bold text-gray-900 mb-3">Chi tiết giá</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-gray-600">
              {formatPrice(stay.pricePerNight)} đ x {nights} đêm
            </Text>
            <Text className="text-xs font-semibold text-gray-900">{formatPrice(roomTotal)} đ</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs text-gray-600">Phí vệ sinh</Text>
            <Text className="text-xs font-semibold text-gray-900">{formatPrice(stay.cleaningFee)} đ</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-xs text-gray-600">Phí dịch vụ StayFinder</Text>
            <Text className="text-xs font-semibold text-gray-900">{formatPrice(stay.serviceFee)} đ</Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-gray-200">
            <Text className="text-sm font-extrabold text-gray-900">Tổng cộng (VND)</Text>
            <Text className="text-base font-extrabold text-primary">{formatPrice(totalAmount)} đ</Text>
          </View>
        </View>

        {/* Payment Method Options */}
        <View className="py-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Phương thức thanh toán</Text>
          
          {[
            { id: 'MOMO', name: 'Ví MoMo', desc: 'Thanh toán quét mã QR siêu tốc' },
            { id: 'VNPay', name: 'Cổng VNPAY', desc: 'Thẻ ATM nội địa / Internet Banking' },
            { id: 'CreditCard', name: 'Thẻ Visa / Mastercard', desc: 'Thanh toán quốc tế bảo mật' },
          ].map((pm) => (
            <TouchableOpacity
              key={pm.id}
              onPress={() => setSelectedPayment(pm.id as any)}
              activeOpacity={0.8}
              className={`flex-row items-center justify-between p-3.5 rounded-2xl mb-2 border ${
                selectedPayment === pm.id
                  ? 'bg-red-50/50 border-primary'
                  : 'bg-white border-gray-200'
              }`}
            >
              <View className="flex-row items-center">
                <CreditCard size={20} color={selectedPayment === pm.id ? COLORS.primary : COLORS.gray} />
                <View className="ml-3">
                  <Text className="text-xs font-bold text-gray-900">{pm.name}</Text>
                  <Text className="text-xs text-gray-500">{pm.desc}</Text>
                </View>
              </View>
              <View
                className={`w-4 h-4 rounded-full border items-center justify-center ${
                  selectedPayment === pm.id ? 'border-primary bg-primary' : 'border-gray-300'
                }`}
              >
                {selectedPayment === pm.id && <View className="w-1.5 h-1.5 rounded-full bg-white" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          onPress={handleConfirmBooking}
          activeOpacity={0.9}
          className="bg-primary py-4 rounded-2xl items-center mt-4 shadow-md"
        >
          <Text className="text-white font-bold text-base">Xác nhận thanh toán ({formatPrice(totalAmount)} đ)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
