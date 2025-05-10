import { View, Text, TouchableOpacity, Linking, StyleSheet, Dimensions, ScrollView } from 'react-native';
import React, { useEffect, useMemo, useCallback, memo } from 'react';
import UpperLayout from '../../layouts/UpperLayout';
import CustomSlider from '../Services/Bakery/Slider';
import GroomingServices from './GroomingServices';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGetBannersHook from '../../hooks/GetBannersHook';

const { width } = Dimensions.get('window');

// Memoize static data
const BUSINESS_HOURS = "10:00 AM - 9:00 PM";
const PHONE_NUMBER = 'tel:9811299059';
const SLIDER_DELAY = 3000;
const BANNER_TYPE = 'grooming';

const Grooming = () => {
  const { fetchBanners, sliders } = useGetBannersHook();
  

  const sliderProps = useMemo(() => ({
    autoPlay: true,
    navigationShow: true,
    isUri: true,
    delay: SLIDER_DELAY,
    imagesByProp: sliders
  }), [sliders]);
  
  // Memoize the callback function
  const handleCallPress = useCallback(() => {
    Linking.openURL(PHONE_NUMBER);
  }, []);
  
  // Fetch data only once when component mounts
  useEffect(() => {
    fetchBanners(BANNER_TYPE);
  }, [fetchBanners]);

  
  // Memoize the business hours section
  const BusinessHoursSection = useMemo(() => (
    <View style={styles.infoContainer}>
      <Text style={styles.openText}>
        Open: <Text style={styles.timeText}>{BUSINESS_HOURS}</Text>
      </Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleCallPress}
        style={styles.buttonContainer}
      >
        <Text style={styles.confusedText}>Confused? Call Now</Text>
      </TouchableOpacity>
    </View>
  ), [handleCallPress]);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <UpperLayout title="Dog Grooming" />
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollViewContent}
        >
          <CustomSlider {...sliderProps} />
          {BusinessHoursSection}
          <GroomingServices />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width,
    padding: 10,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  openText: {
    fontSize: 14,
    color: '#333',
  },
  timeText: {
    fontWeight: 'bold',
    color: '#B32113',
  },
  confusedText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    textDecorationColor: '#B32113',
    color: '#B32113',
    paddingHorizontal: 5,
    paddingVertical: 3,
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 5,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
});

export default memo(Grooming);