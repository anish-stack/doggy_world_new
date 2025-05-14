import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  StatusBar
} from 'react-native';
import { MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchCakeDesign, fetchFlavours, fetchQunatity } from './utils';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';

const CakesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // State management
  const [selectedFlavourId, setSelectedFlavourId] = useState(null);
  const [selectedQuantityId, setSelectedQuantityId] = useState(null);
  const [selectedDesignId, setSelectedDesignId] = useState(null);
  const [flavours, setFlavours] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [quantities, setQuantities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredDesigns, setFilteredDesigns] = useState([]);

  // Animation values
  const buttonScale = useSharedValue(1);

  const cardWidth = useMemo(() => {
    const padding = 20;
    const gap = 12;
    const cardsPerRow = width > 768 ? 3 : 2;
    return (width - (padding * 2) - (gap * (cardsPerRow - 1))) / cardsPerRow;
  }, [width]);

  // Fetch data with proper error handling
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [flavourResponse, designResponse, quantityResponse] = await Promise.all([
        fetchFlavours(),
        fetchCakeDesign(),
        fetchQunatity()
      ]);

      if (flavourResponse && designResponse && quantityResponse) {
        setFlavours(flavourResponse);
        setDesigns(designResponse);
        setQuantities(quantityResponse);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      setError('Unable to load bakery data. Please try again.');
      Alert.alert('Error', 'Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter designs based on selected flavor
  useEffect(() => {
    if (selectedFlavourId && designs.length > 0) {
      const filtered = designs.filter(design => 
        design.whichFlavoredCake && 
        design.whichFlavoredCake.some(flavor => flavor._id === selectedFlavourId)
      );
      setFilteredDesigns(filtered.length > 0 ? filtered : designs);
    } else {
      setFilteredDesigns(designs);
    }
  }, [selectedFlavourId, designs]);

  const handleFlavourSelect = useCallback((id) => {
    setSelectedFlavourId(prevId => prevId === id ? null : id);
    // Reset design selection when flavor changes
    setSelectedDesignId(null);
  }, []);

  const handleQuantitySelect = useCallback((id) => {
    setSelectedQuantityId(prevId => prevId === id ? null : id);
  }, []);

  const handleDesignSelect = useCallback((id) => {
    setSelectedDesignId(prevId => prevId === id ? null : id);
  }, []);

  const handleNextStep = useCallback(() => {
    if (!selectedFlavourId || !selectedQuantityId || !selectedDesignId) {
      Alert.alert('Incomplete Selection', 'Please select a flavour, quantity, and design to continue.');
      return;
    }

    // Animate button press
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    navigation.navigate('Cake-Delivery', {
      flavourId: selectedFlavourId,
      quantityId: selectedQuantityId,
      designId: selectedDesignId,
    });
  }, [selectedFlavourId, selectedQuantityId, selectedDesignId, navigation, buttonScale]);

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }]
    };
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#B32113', '#FF6B6B']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Fetching delicious cakes for your pet...</Text>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1581/1581645.png' }}
            style={styles.loadingImage}
          />
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" />
        <MaterialIcons name="error-outline" size={64} color="#B32113" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedFlavour = flavours.find(f => f._id === selectedFlavourId);
  const selectedQuantity = quantities.find(q => q._id === selectedQuantityId);
  const selectedDesign = designs.find(d => d._id === selectedDesignId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#B32113', '#FF6B6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={styles.headerTitle}>Paw-fect Cakes 🐾</Text>
          <Text style={styles.headerSubtitle}>Delicious treats for your furry friends</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Flavours Section */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="birthday-cake" size={20} color="#B32113" />
            <Text style={styles.sectionTitle}>Choose a Flavour</Text>
          </View>
          <View style={styles.grid}>
            {flavours.map((flavour) => (
              <TouchableOpacity
              
                key={flavour._id}
                style={[
                  styles.card,
                  { width: cardWidth },
                  selectedFlavourId === flavour._id && styles.selectedCard
                ]}
                onPress={() => handleFlavourSelect(flavour._id)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: flavour.image?.url }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                {selectedFlavourId === flavour._id && (
                  <View style={styles.selectedOverlay}>
                    <MaterialIcons name="check-circle" size={28} color="#FFFFFF" />
                  </View>
                )}
                {flavour?.any_tag && (
                  <View style={[styles.tag, { backgroundColor: '#B32113' }]}>
                    <Text style={styles.tagText}>{flavour.tag_title || 'Popular'}</Text>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{flavour.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Quantities Section */}
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="cake" size={20} color="#B32113" />
            <Text style={styles.sectionTitle}>Select Size</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quantityContainer}
          >
            {quantities.map((quantity) => (
              <TouchableOpacity
                key={quantity._id}
                style={[
                  styles.quantityButton,
                  selectedQuantityId === quantity._id && styles.selectedQuantityButton
                ]}
                onPress={() => handleQuantitySelect(quantity._id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quantityText,
                  selectedQuantityId === quantity._id && styles.selectedQuantityText
                ]}>
                  {quantity.weight}
                </Text>
                <Text style={[
                  styles.priceText,
                  selectedQuantityId === quantity._id && styles.selectedQuantityText
                ]}>
                  ₹{quantity.price}
                </Text>
                <Text style={[
                  styles.descriptionText,
                  selectedQuantityId === quantity._id && styles.selectedQuantityText
                ]}>
                  {quantity.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Designs Section */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="design-services" size={20} color="#B32113" />
            <Text style={styles.sectionTitle}>Select Design</Text>
          </View>
          <View style={styles.designGrid}>
            {filteredDesigns.map((design) => (
              <TouchableOpacity
                key={design._id}
                style={[
                  styles.designCard,
                  selectedDesignId === design._id && styles.selectedDesignCard
                ]}
                onPress={() => handleDesignSelect(design._id)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: design.image?.url }}
                  style={styles.designImage}
                  resizeMode="cover"
                />
                {selectedDesignId === design._id && (
                  <View style={styles.selectedOverlay}>
                    <MaterialIcons name="check-circle" size={28} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.designInfo}>
                  <Text style={styles.designName}>{design.name}</Text>
                  {design.position === 1 && (
                    <View style={styles.bestSellerTag}>
                      <Text style={styles.bestSellerText}>Best Seller</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

  

      {/* Next Step Button */}
      <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedFlavourId || !selectedQuantityId || !selectedDesignId) && styles.disabledButton
          ]}
          onPress={handleNextStep}
          disabled={!selectedFlavourId || !selectedQuantityId || !selectedDesignId}
        >
          <LinearGradient
            colors={['#B32113', '#FF6B6B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.nextButtonText}>Continue to Delivery</Text>
            <MaterialIcons name="arrow-forward" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5.84,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    marginLeft: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
   
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#B32113',
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardContent: {
    padding: 12,
  },
  tag: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    textAlign: 'center',
  },
  quantityContainer: {
    paddingVertical: 5,
  },
  quantityButton: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 130,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedQuantityButton: {
    backgroundColor: '#B32113',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 5,
  },
  priceText: {
    fontSize: 16,
    color: '#B32113',
    fontWeight: '700',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 12,
    color: '#636E72',
    textAlign: 'center',
  },
  selectedQuantityText: {
    color: '#FFF',
  },
  designGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  designCard: {
    width: "45%",
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedDesignCard: {
    borderWidth: 2,
    borderColor: '#B32113',
  },
  designImage: {
    width: '100%',
    height: 140,
  },
  designInfo: {
    padding: 12,
  },
  designName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    textAlign: 'center',
  },
  bestSellerTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 5,
  },
  bestSellerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2D3436',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(179, 33, 19, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryBlur: {
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  summaryContent: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  summaryValue: {
    fontSize: 14,
    color: '#B32113',
    fontWeight: '500',
  },
  loadingGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loadingImage: {
    width: 120,
    height: 120,
    marginTop: 30,
    opacity: 0.8,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#B32113',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#B32113',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CakesScreen;