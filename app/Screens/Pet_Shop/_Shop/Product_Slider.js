import React, { useState, useRef, useEffect } from 'react';
import { View, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';

const { width } = Dimensions.get('window');

export default function Product_Slider({ images = [], PassHeight = 350,isNavigation=true }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const ImagesReceived = images && images.map((item) => item.url);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % ImagesReceived.length; 
      setCurrentIndex(nextIndex);
      scrollViewRef.current.scrollTo({ x: nextIndex * width, animated: true });
    }, 3000); 

    return () => clearInterval(interval); 
  }, [currentIndex, ImagesReceived]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    scrollViewRef.current.scrollTo({ x: index * width, animated: true });
  };

  const handleScroll = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleMomentumScrollEnd = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Gesture-enabled slider */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={{ width }}
      >
        {ImagesReceived.map((item, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: item }} style={[styles.image, { height: PassHeight }]} />
          </View>
        ))}
      </ScrollView>

{isNavigation && (

      <View style={styles.dotsContainer}>
        {ImagesReceived.map((_, index) => (
          <TouchableOpacity key={index} onPress={() => handleDotClick(index)}>
            <Icon
              name={index === currentIndex ? 'rightcircle' : 'leftcircle'}
              size={14}
              color={index === currentIndex ? '#B32113' : '#ccc'}
              style={styles.dot}
            />
          </TouchableOpacity>
        ))}
      </View>
)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width - 20,
    resizeMode: 'cover',
    borderRadius: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    marginHorizontal: 5,
  },
});
