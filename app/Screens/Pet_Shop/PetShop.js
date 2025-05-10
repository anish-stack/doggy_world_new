import { View, Text, Dimensions, Linking, StatusBar, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';
import useGetBannersHook from '../../hooks/GetBannersHook';
import TopHeadPart from '../../layouts/TopHeadPart';
import { ScrollView } from 'react-native';
import ImageSlider from '../../layouts/ImageSlider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios'
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';
import AllProducts from './AllProducts';

const { width } = Dimensions.get('window');
const PHONE_NUMBER = 'tel:9811299059';
const BANNER_TYPE = 'shop';

export default function PetShop() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const { fetchBanners, sliders } = useGetBannersHook();

  const handleCallPress = useCallback(() => {
    Linking.openURL(PHONE_NUMBER);
  }, []);

  const handlePetShopCategories = useCallback(() => {
    const Categories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/petshop-category`);
        if (response.data.success) {
          // Filter active categories and sort by position
          const filteredData = response.data.data
            .filter(item => item.active)
            .sort((a, b) => a.position - b.position);
          setData(filteredData);
        }
      } catch (error) {
        console.log(error);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    Categories();
  }, []);

  useEffect(() => {
    handlePetShopCategories();
    fetchBanners(BANNER_TYPE);
  }, [fetchBanners, handlePetShopCategories]);

  const navigateToScreen = (item) => {
    navigation.navigate('Dynamic_Shop', {
      id: item._id,
      title: item.title
    });
  };

  const renderCategoryCard = (item, index) => {
    // Alternate layout for even/odd items
    const isEven = index % 2 === 0;

    return (
      <TouchableOpacity
        key={item._id}
        style={[
          styles.categoryCard,
          { backgroundColor: item.backgroundColour || '#f0f0f0' }
        ]}
        onPress={() => navigateToScreen(item)}
        activeOpacity={0.8}
      >
        <View style={styles.categoryContent}>
          <View style={styles.categoryTextContainer}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
            <View style={styles.shopNowButton}>
              <Text style={styles.shopNowText}>Shop Now</Text>
              <MaterialIcons name="arrow-forward-ios" size={14} color="#fff" />
            </View>
          </View>

          {item.imageUrl && item.imageUrl.url ? (
           <View style={{height:120}}>
             <Image
              source={{ uri: item.imageUrl.url }}
              style={styles.categoryImage}
              resizeMode="cover"
            />
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesome5 name="paw" size={40} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TopHeadPart title="Furry Friends Hub" fnc={handleCallPress} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Slider */}
        <View style={styles.bannerContainer}>
          <ImageSlider images={sliders} height={170} />
        </View>

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={40} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handlePetShopCategories}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : data.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="box-open" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No categories available</Text>
            </View>
          ) : (
            <View style={styles.categoriesContainer}>
              {data.map((item, index) => renderCategoryCard(item, index))}
            </View>
          )}
        </View>




        {/* Special Offers */}
        <View style={styles.specialOffersContainer}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.specialOfferCard}
          >
            <View style={styles.specialOfferContent}>
              <View>
                <Text style={styles.specialOfferTitle}>Special Offer</Text>
                <Text style={styles.specialOfferDesc}>Get 20% off on all dog food</Text>
                <TouchableOpacity style={styles.specialOfferButton}>
                  <Text style={styles.specialOfferButtonText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={{ uri: 'https://res.cloudinary.com/do34gd7bu/image/upload/v1746015177/uploads/coelsnbh50mg3cdzpt6n.png' }}
                style={styles.specialOfferImage}
                resizeMode="contain"
              />
            </View>
          </LinearGradient>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    marginBottom: 15,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    padding: 5,
  },
  viewAllText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  errorText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  categoriesContainer: {
    marginBottom: 10,
  },
  categoryCard: {
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  shopNowText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  categoryImage: {
    width: 100,
    height: "100%",
    position: 'relative',
    bottom: -15,
    objectFit: 'cover'
  },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  specialOffersContainer: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  specialOfferCard: {
    borderRadius: 12,
    padding: 15,
    overflow: 'hidden',
  },
  specialOfferContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialOfferTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  specialOfferDesc: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    opacity: 0.9,
  },
  specialOfferButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  specialOfferButtonText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  specialOfferImage: {
    width: 120,
    height: 120,
  },
  bottomSpacing: {
    height: 20,
  },
});
