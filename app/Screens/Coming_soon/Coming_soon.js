import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withDelay,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width } = Dimensions.get('window');
const CARD_PADDING = 20;
const CARD_WIDTH = width - (CARD_PADDING * 2);

export default function ComingSoon() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 1000 });
    translateY.value = withSequence(
      withDelay(300, withSpring(0, { damping: 12 }))
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value
  }));

  if (!fontsLoaded) {
    return null;
  }

  const offers = [
    {
      icon: '🎁',
      title: 'Early Bird Offer',
      description: 'Get 50% off on first consultation',
      date: 'Launching in 7 days'
    },
    {
      icon: '💉',
      title: 'Vaccination Package',
      description: 'Complete pet vaccination at 30% off',
      date: 'Coming next month'
    },
    {
      icon: '🏠',
      title: 'Home Visit',
      description: 'Free home visits for senior pets',
      date: 'Starting soon'
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['rgba(179, 33, 19, 0.1)', 'transparent']}
        style={styles.gradient}
      />

      <Animated.View style={[styles.content, animatedStyle]}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=1600&auto=format&fit=crop' }}
          style={styles.image}
        />

        <View style={styles.headerContainer}>
          <Text style={styles.title}>Something Amazing{'\n'}is Coming Soon!</Text>
          <Text style={styles.subtitle}>
            We're working hard to bring you the best pet care experience. Stay tuned for exclusive offers and features!
          </Text>
        </View>

        <View style={styles.offersList}>
          {offers.map((offer, index) => (
            <View key={index} style={styles.offerCard}>
              <View style={styles.offerIcon}>
                <Text style={styles.offerIconText}>{offer.icon}</Text>
              </View>
              <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerDescription}>{offer.description}</Text>
                <Text style={styles.offerDate}>{offer.date}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.notifyButton}
          // onPress={() => router.push('/')}
        >
          <MaterialIcons name="notifications-active" size={24} color="#FFF" />
          <Text style={styles.notifyButtonText}>Notify Me</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          // onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  content: {
    padding: CARD_PADDING,
    alignItems: 'center',
  },
  image: {
    width: CARD_WIDTH,
    height: 250,
    borderRadius: 20,
    marginBottom: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  offersList: {
    width: '100%',
    marginBottom: 32,
  },
  offerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  offerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(179, 33, 19, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  offerIconText: {
    fontSize: 24,
  },
  offerContent: {
    flex: 1,
  },
  offerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  offerDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  offerDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#B32113',
  },
  notifyButton: {
    flexDirection: 'row',
    backgroundColor: '#B32113',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  notifyButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666666',
  },
});