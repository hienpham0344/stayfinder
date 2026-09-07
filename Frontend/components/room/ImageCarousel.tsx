import React, { useState } from 'react';
import { View, Image, ScrollView, Dimensions, Text } from 'react-native';

interface ImageCarouselProps {
  images: string[];
}

const { width } = Dimensions.get('window');

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View className="relative h-72 w-full bg-gray-900">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const slide = Math.ceil(
            e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
          );
          if (slide !== activeIndex) {
            setActiveIndex(slide);
          }
        }}
        scrollEventThrottle={16}
      >
        {images.map((img, idx) => (
          <Image
            key={idx}
            source={{ uri: img }}
            style={{ width, height: 288 }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Image Counter Badge */}
      <View className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 rounded-full">
        <Text className="text-white text-xs font-bold">
          {activeIndex + 1} / {images.length}
        </Text>
      </View>
    </View>
  );
};
