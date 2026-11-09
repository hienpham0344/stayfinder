import { StayImage } from '../ui/StayImage';
import React, { useEffect, useRef, useState } from 'react';
import { View, ImageSourcePropType, ImageStyle, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ImageOff } from '../../constants/icons';
import { COLORS, RADII } from '../../constants/tokens';

interface ImageCarouselProps {
  images: string[];
  imageSources?: ImageSourcePropType[];
  imageTransforms?: ImageStyle[];
  onOpen?: () => void;
}

function CarouselSlide({ source, width, index, count, transform, onOpen }: { source: ImageSourcePropType; width: number; index: number; count: number; transform?: ImageStyle; onOpen?: () => void }) {
  return <Pressable onPress={onOpen} style={[styles.slide, { width }]} accessibilityRole="button" accessibilityLabel={`Open photo ${index + 1} of ${count}`}>
    <StayImage source={source} style={transform ? [styles.transformedImage, transform] : styles.image} resizeMode={transform ? 'stretch' : 'cover'} />
  </Pressable>;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, imageSources, imageTransforms, onOpen }) => {
  const [galleryWidth, setGalleryWidth] = useState(390);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const pendingPage = useRef<number | null>(null);

  useEffect(() => {
    if (pendingPage.current === null) return;
    const page = pendingPage.current;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: page * galleryWidth, animated: false });
      setActiveIndex(page);
      pendingPage.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [galleryWidth]);

  return (
    <View style={styles.container} onLayout={(event) => {
      const measuredWidth = event.nativeEvent.layout.width;
      if (measuredWidth > 0 && measuredWidth !== galleryWidth) {
        pendingPage.current = activeIndex;
        setGalleryWidth(measuredWidth);
      }
    }}>
      <ScrollView
        style={styles.scroll}
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          if (pendingPage.current !== null || e.nativeEvent.layoutMeasurement.width <= 0) return;
          const slide = Math.max(0, Math.min(images.length - 1, Math.round(
            e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
          )));
          if (slide !== activeIndex) {
            setActiveIndex(slide);
          }
        }}
        scrollEventThrottle={64}
      >
        {images.map((img, idx) => <CarouselSlide key={img} source={imageSources?.[idx] ?? { uri: img }} transform={imageTransforms?.[idx]} width={galleryWidth} index={idx} count={images.length} onOpen={onOpen} />)}
      </ScrollView>

      {images.length > 1 && <View style={styles.dots}>
        {images.map((_, index) => <View key={index} style={[styles.dot, index === activeIndex && styles.activeDot]} />)}
      </View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 256, backgroundColor: COLORS.bgSecondary },
  scroll: { width: '100%' },
  slide: { height: 256, flexShrink: 0, overflow: 'hidden', backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  transformedImage: { position: 'absolute' },
  dots: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: RADII.full, backgroundColor: COLORS.bgSurface, opacity: 0.5 },
  activeDot: { opacity: 1 },
});
