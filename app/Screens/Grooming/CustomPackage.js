import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  PanResponder
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CustomSlider = memo(({
  autoPlay = false,
  delay = 3000,
  isUri = false,
  imagesByProp = [],
  navigationShow = true
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef(null);
  const images = useRef(imagesByProp).current;

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (autoPlay && images.length > 1) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(goToNext, delay);
      return () => clearInterval(timerRef.current);
    }
  }, [autoPlay, delay, goToNext, images.length]);

  useEffect(() => {
    useRef(imagesByProp).current = imagesByProp;
  }, [imagesByProp]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
      onPanResponderEnd: (_, gestureState) => {
        if (gestureState.dx > 50) goToPrevious();
        else if (gestureState.dx < -50) goToNext();
      },
    })
  ).current;

  if (!images || images.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noImageText}>No images available</Text>
      </View>
    );
  }

  const safeIndex = activeIndex < images.length ? activeIndex : 0;
  const currentImage = images[safeIndex];

  return (
    <View style={styles.container}>
      <Image
        source={isUri ? { uri: currentImage?.url } : currentImage?.src}
        style={styles.image}
        resizeMode="contain"
        onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
      />
      <View style={styles.imageContainer} {...panResponder.panHandlers}>

        {navigationShow && images.length > 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity onPress={goToPrevious} style={styles.navButton} activeOpacity={0.7}>
              <Icon name="chevron-back" size={15} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={goToNext} style={styles.navButton} activeOpacity={0.7}>
              <Icon name="chevron-forward" size={15} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.paginationDot,
                  index === safeIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = {
  container: {
    alignItems: 'center',
    marginTop: 0,
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f1f1',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  navigation: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    margin: 12,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  noImageText: {
    fontSize: 16,
    color: '#555',
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
};

export default CustomSlider;
