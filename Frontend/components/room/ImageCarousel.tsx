import React, { useState } from 'react';
import { View, Image, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS, RADII } from '../../constants/tokens';

interface ImageCarouselProps {
  images: string[];
  onOpen?: () => void;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, onOpen }) => {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const slide = Math.round(
            e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
          );
          if (slide !== activeIndex) {
            setActiveIndex(slide);
          }
        }}
        scrollEventThrottle={16}
      >
        {images.map((img, idx) => (
          <Pressable key={idx} onPress={onOpen} accessibilityLabel={`Mở ảnh ${idx + 1} trên ${images.length}`}>
            <Image source={{ uri: img }} style={{ width, height: 256 }} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {images.map((_, index) => <View key={index} style={[styles.dot, index === activeIndex && styles.activeDot]} />)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 256, backgroundColor: COLORS.bgSecondary },
  dots: { position: 'absolute', bottom: 15, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: RADII.full, backgroundColor: COLORS.borderSage },
  activeDot: { backgroundColor: COLORS.bgWhite },
});
