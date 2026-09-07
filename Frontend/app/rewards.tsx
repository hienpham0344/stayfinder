import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Award, Gift, Sparkles, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { MOCK_USER_TIER, MOCK_VOUCHERS } from '../constants/mockStays';
import { COLORS } from '../constants/colors';

export default function RewardsWalletScreen() {
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);
  const tier = MOCK_USER_TIER;

  const handleRedeem = (id: string) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isUnlocked: true } : v))
    );
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <ArrowLeft size={22} color={COLORS.dark} />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-gray-900">Ví điểm thưởng & Ưu đãi</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        {/* Tier Points Card */}
        <View className="bg-neutral-900 p-5 rounded-3xl shadow-lg mb-5 relative overflow-hidden">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/40">
              <Award size={14} color="#F59E0B" />
              <Text className="text-amber-400 text-xs font-bold ml-1.5 uppercase">
                Hạng thành viên {tier.name}
              </Text>
            </View>
            <Sparkles size={20} color="#F59E0B" />
          </View>

          <Text className="text-xs text-gray-400 mt-1">Số điểm tích lũy của bạn</Text>
          <Text className="text-3xl font-black text-white mt-1">
            {formatNumber(tier.currentPoints)} <Text className="text-sm font-normal text-amber-400">điểm</Text>
          </Text>

          {/* Progress Bar to next tier */}
          <View className="mt-4 pt-3 border-t border-neutral-800">
            <View className="flex-row justify-between text-xs mb-1.5">
              <Text className="text-xs text-gray-400">Tiến trình lên hạng VIP Kim Cương</Text>
              <Text className="text-xs font-bold text-white">
                {tier.currentPoints} / {tier.nextTierPoints} pts
              </Text>
            </View>
            <View className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${(tier.currentPoints / tier.nextTierPoints) * 100}%` }}
              />
            </View>
          </View>
        </View>

        {/* Member Tier Benefits */}
        <View className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-5">
          <Text className="text-sm font-bold text-gray-900 mb-3">Đặc quyền hạng VIP</Text>
          {tier.benefits.map((b, idx) => (
            <View key={idx} className="flex-row items-center mb-2">
              <Check size={16} color="#128807" />
              <Text className="text-xs text-gray-700 font-medium ml-2">{b}</Text>
            </View>
          ))}
        </View>

        {/* Vouchers List */}
        <Text className="text-base font-extrabold text-gray-900 mb-3">Kho Voucher & Mã giảm giá</Text>
        {vouchers.map((v) => (
          <View
            key={v.id}
            className={`p-4 rounded-2xl mb-3 border ${
              v.isUnlocked ? 'bg-white border-primary/30 shadow-sm' : 'bg-gray-100 border-gray-200 opacity-80'
            }`}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-2">
                <View className="flex-row items-center mb-1">
                  <Gift size={16} color={COLORS.primary} />
                  <Text className="text-sm font-bold text-gray-900 ml-2">{v.title}</Text>
                </View>
                <Text className="text-xs text-gray-500">
                  Đơn tối thiểu: {formatNumber(v.minSpend)} đ • Hạn dùng: {v.expiryDate}
                </Text>
              </View>

              <TouchableOpacity
                disabled={v.isUnlocked}
                onPress={() => handleRedeem(v.id)}
                className={`px-3.5 py-2 rounded-xl ${
                  v.isUnlocked ? 'bg-emerald-50 border border-emerald-200' : 'bg-primary'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    v.isUnlocked ? 'text-emerald-700' : 'text-white'
                  }`}
                >
                  {v.isUnlocked ? 'Đã nhận' : `Đổi (${v.pointsRequired} pts)`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
