import { View, Text, ActivityIndicator, StyleSheet, StatusBar, Image, ScrollView, Dimensions, TouchableOpacity, Linking } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import useGetBannersHook from '../../hooks/GetBannersHook';
import ImageSlider from '../../layouts/ImageSlider';
import TopHeadPart from '../../layouts/TopHeadPart';
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';

const { width } = Dimensions.get('window');
const PHONE_NUMBER = 'tel:9811299059';
const BANNER_TYPE = 'preventive';

export default function Physiotherapy() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const { fetchBanners, sliders } = useGetBannersHook();

  const handleCallPress = useCallback(() => {
    Linking.openURL(PHONE_NUMBER);
  }, []);

  const handlePhysioTherepy = useCallback(() => {
    const physio = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-physioTherapy`);
        if (response.data.success) {
          const sortedData = response.data.data.sort((a, b) => a.position - b.position);
          setData(sortedData);
        }
      } catch (error) {
        console.log(error);
        setError('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    physio();
  }, []);

  useEffect(() => {
    handlePhysioTherepy();
    fetchBanners(BANNER_TYPE);
  }, [fetchBanners, handlePhysioTherepy]);

  const navigateToDetail = (item) => {
    navigation.navigate('PhysiotherapyDetails', { service: item });
  };

  const renderServiceCard = (item) => {
    return (
      <TouchableOpacity
        key={item._id}
        style={styles.serviceCard}
        onPress={() => navigateToDetail(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl && item.imageUrl.length > 0 && (
            <Image
              source={{ uri: item.imageUrl[0].url }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
          )}
          {item.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
          {item.offPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{item.offPercentage}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.serviceTitle}>{item.title}</Text>
          <Text style={styles.serviceDesc} numberOfLines={2}>{item.smallDesc}</Text>

          <View style={styles.priceContainer}>
            {item.discountPrice < item.price ? (
              <>
                <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
                <Text style={styles.originalPrice}>₹{item.price}</Text>
              </>
            ) : (
              <Text style={styles.price}>₹{item.price}</Text>
            )}
            <Text style={styles.duration}>{item.priceMinute}</Text>
          </View>

          <TouchableOpacity style={styles.bookButton} onPress={() => navigateToDetail(item)}>
            <Text style={styles.bookButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>

      <StatusBar barStyle={'dark-content'} />
      <View style={styles.container}>
        <TopHeadPart title={'Gentle Pet Healing'} fnc={handleCallPress} />

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.bannerContainer}>
            <ImageSlider images={sliders} height={200} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Pet Physiotherapy Services</Text>
            <Text style={styles.headerSubtitle}>Professional healing for your furry friends</Text>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#6A5ACD" />
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handlePhysioTherepy}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.servicesContainer}>
              {data.map(renderServiceCard)}
            </View>
          )}

          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>Need help with your pet?</Text>
            <Text style={styles.contactDesc}>Our experts are just a call away</Text>
            <TouchableOpacity style={styles.callButton} onPress={handleCallPress}>
              <Text style={styles.callButtonText}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    marginBottom: 15,
  },
  headerContainer: {
    padding: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E53935',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  loaderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#E53935',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#6A5ACD',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  servicesContainer: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  popularText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardContent: {
    padding: 16,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  serviceDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3780',
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A3780',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
  bookButton: {
    backgroundColor: '#942725',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactSection: {
    backgroundColor: '#d97977',
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  contactDesc: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    textAlign: 'center',
  },
  callButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#4A3780',
    fontWeight: 'bold',
    fontSize: 16,
  },
});