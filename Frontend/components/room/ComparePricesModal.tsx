import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, ArrowRight, TrendingDown } from 'lucide-react-native';
import { PriceProviderComparison } from '../../types/stay';
import { COLORS } from '../../constants/colors';
import { router } from 'expo-router';

interface ComparePricesModalProps {
  visible: boolean;
  onClose: () => void;
  stayId: string;
  stayTitle: string;
  comparisons: PriceProviderComparison[];
}

export const ComparePricesModal: React.FC<ComparePricesModalProps> = ({
  visible,
  onClose,
  stayId,
  stayTitle,
  comparisons,
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl p-5 max-h-[80%] border-t border-gray-200">
          {/* Sheet Handle */}
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-3" />

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <TrendingDown size={20} color={COLORS.primary} />
              <Text className="text-base font-extrabold text-gray-900 ml-2">
                So sánh giá giữa các đối tác
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
              <X size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-gray-500 mt-2 mb-4">
            Giá công khai cho <Text className="font-bold text-gray-800">{stayTitle}</Text>
          </Text>

          <ScrollView className="space-y-3">
            {comparisons.map((comp, idx) => (
              <View
                key={idx}
                className={`p-4 rounded-2xl border flex-row items-center justify-between mb-2.5 ${
                  comp.isBestValue
                    ? 'bg-red-50/60 border-primary shadow-sm'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <Text className="text-sm font-bold text-gray-900">{comp.providerName}</Text>
                    {comp.isBestValue && (
                      <View className="bg-primary px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-[10px] font-bold text-white uppercase">
                          Giá tốt nhất
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    Đã bao gồm thuế & phí dịch vụ
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-base font-black text-primary">
                    {formatPrice(comp.pricePerNight)} đ
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      router.push(`/room/select?id=${stayId}` as any);
                    }}
                    className="mt-1 flex-row items-center bg-primary px-3 py-1.5 rounded-xl"
                  >
                    <Text className="text-white text-xs font-bold mr-1">Chọn phòng</Text>
                    <ArrowRight size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
