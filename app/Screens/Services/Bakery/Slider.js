import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  PanResponder
} from 'react-native';
import { ScaledSheet, moderateScale } from 'react-native-size-matters';
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
  const images = imagesByProp;
  
  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);
  
  const goToPrevious = useCallback(() => {
    if (images.length <= 1) return;
    setActiveIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);
  console.log(" i am render")
  // Reset timer when navigation buttons are pressed or when autoPlay, delay changes
  useEffect(() => {
    if (autoPlay && images.length > 1) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(goToNext, delay);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [autoPlay, delay, goToNext, images.length]);
  
  // PanResponder setup with useRef to prevent recreation on each render
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
  
  if (images.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noImageText}>No images available</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer} {...panResponder.panHandlers}>
        <Image
          source={isUri ? { uri: String(images[activeIndex]?.url) } : images[activeIndex]?.src}
          style={styles.image}
          // Add error and loading handling
          onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
        />
        
        {navigationShow && images.length > 1 && (
          <View style={styles.navigation}>
            <TouchableOpacity 
              onPress={goToPrevious} 
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Icon name="chevron-back" size={moderateScale(15)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={goToNext} 
              style={styles.navButton}
              activeOpacity={0.7}
            >
              <Icon name="chevron-forward" size={moderateScale(15)} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Add pagination indicators */}
        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = ScaledSheet.create({
  container: {
    alignItems: 'center',
    marginTop: '0@ms',
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: '180@ms',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f1f1',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    borderRadius: '30@ms',
    margin: '12@ms',
    padding: '5@ms',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30@ms',
    height: '30@ms',
  },
  noImageText: {
    fontSize: '16@ms',
    color: '#555',
  },
  pagination: {
    position: 'absolute',
    bottom: '10@ms',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: '8@ms',
    height: '8@ms',
    borderRadius: '4@ms',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: '3@ms',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: '10@ms',
    height: '10@ms',
    borderRadius: '5@ms',
  },
});

export default CustomSlider;