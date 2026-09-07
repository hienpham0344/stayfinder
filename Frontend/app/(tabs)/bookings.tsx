import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { MOCK_STAYS } from '../../constants/mockStays';
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

export default function BookingsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingBookings = [
    {
      id: 'b-101',
      stay: MOCK_STAYS[0],
      checkIn: '15/10/2026',
      checkOut: '18/10/2026',
      guests: 2,
      total: 4050000,
      status: 'Confirmed',
    },
  ];

  const pastBookings = [
    {
      id: 'b-100',
      stay: MOCK_STAYS[1],
      checkIn: '01/08/2026',
      checkOut: '04/08/2026',
      guests: 2,
      total: 8900000,
      status: 'Completed',
    },
  ];

  const displayList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <View className="flex-1 bg-gray-50 pt-12">
      {/* Header Title */}
      <View className="px-5 pb-3 bg-white border-b border-gray-100">
        <Text className="text-2xl font-extrabold text-gray-900">Chuyến đi của bạn</Text>
      </View>

      {/* Tabs Filter */}
      <View className="flex-row bg-white px-5 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => setActiveTab('upcoming')}
          className={`py-3.5 mr-6 border-b-2 ${
            activeTab === 'upcoming' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-sm font-bold ${
              activeTab === 'upcoming' ? 'text-primary' : 'text-gray-500'
            }`}
          >
            Sắp khởi hành ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('past')}
          className={`py-3.5 border-b-2 ${
            activeTab === 'past' ? 'border-primary' : 'border-transparent'
          }`}
        >
          <Text
            className={`text-sm font-bold ${
              activeTab === 'past' ? 'text-primary' : 'text-gray-500'
            }`}
          >
            Đã hoàn thành ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
              <View className="flex-row items-center">
                <CheckCircle2 size={16} color="#128807" />
                <Text className="text-xs font-bold text-emerald-800 ml-1.5">
                  {item.status === 'Confirmed' ? 'Đã xác nhận' : 'Hoàn thành'}
                </Text>
              </View>
              <Text className="text-xs font-semibold text-gray-400">Mã: #{item.id}</Text>
            </View>

            <View className="flex-row py-3 border-b border-gray-100">
              <Image
                source={{ uri: item.stay.images[0] }}
                className="w-20 h-20 rounded-xl"
                resizeMode="cover"
              />
              <View className="flex-1 ml-3 justify-between">
                <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                  {item.stay.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <MapPin size={13} color={COLORS.gray} />
                  <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
                    {item.stay.location.city}, {item.stay.location.province}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Calendar size={13} color={COLORS.gray} />
                  <Text className="text-xs text-gray-500 ml-1">
                    {item.checkIn} – {item.checkOut}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-3">
              <Text className="text-xs text-gray-500">Tổng thanh toán:</Text>
              <Text className="text-base font-extrabold text-primary">
                {formatPrice(item.total)} đ
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
