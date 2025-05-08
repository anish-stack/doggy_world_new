import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const { width } = Dimensions.get('window');

const ImageSlider = ({ images }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  
  const flattenedImages = useMemo(() => {
    if (!images || images.length === 0) return [];
    return images || [];
  }, [images]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  useEffect(() => {
    if (flattenedImages.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % flattenedImages.length;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, flattenedImages.length]);

  if (!flattenedImages.length) return null;

  return (
    <View style={styles.sliderContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {flattenedImages.map((item, index) => (
          <Image
            key={index}
            source={{ uri: item?.url }}
            style={styles.sliderImage}
            resizeMode="stretch"
          />
        ))}
      </ScrollView>

      {flattenedImages.length > 1 && (
        <View style={styles.pagination}>
          {flattenedImages.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 16, 8],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'transparent']}
        style={styles.sliderGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: '100%',
    height: verticalScale(140),

    overflow: 'hidden',
    position: 'relative',
    
  },
  sliderImage: {
    width,
    height: '100%',
   
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: verticalScale(20),
    alignSelf: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: verticalScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: '#FFFFFF',
    marginHorizontal: scale(3),
  },
  sliderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: verticalScale(50),
    zIndex: 1,
  },
});

export default ImageSlider;