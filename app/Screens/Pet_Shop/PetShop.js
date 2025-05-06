import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import DynmaicSlider from '../Services/Bakery/Dynamic_Screen/DynamicSlider';
import { useNavigation } from '@react-navigation/native';
import AllProducts from './AllProducts';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const LoadingPlaceholder = () => (
  <View style={styles.loadingContainer}>
    <MaterialIcons name="pets" size={48} color="#B32113" />
    <Text style={styles.loadingText}>Fetching pet supplies...</Text>
  </View>
);

const ErrorView = ({ message, onRetry }) => (
  <View style={styles.errorContainer}>
    <MaterialIcons name="error-outline" size={48} color="#B32113" />
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

export default function PetShop() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [slider, setSlider] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [petshopsRes, slidersRes] = await Promise.all([
        axios.get('https://admindoggy.adsdigitalmedia.com/api/petshops?populate=*'),
        axios.get('https://admindoggy.adsdigitalmedia.com/api/bakery-sliders?populate=*')
      ]);

      const fetchedData = petshopsRes.data.data;
      const fetchSlider = slidersRes.data.data;

      const filteredSliderData = fetchSlider.filter(
        (item) => item.isPetShop?.Title === 'Pet Shop'
      );

      const filterFetchData = fetchedData.filter(
        (item) => item.Title !== 'Pet Shop'
      );

      setSlider(filteredSliderData);
      setData(filterFetchData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Unable to load pet shop data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sliderImages = useMemo(() => {
    const images = slider.flatMap((item) => item.images).map((image) => image.url);
    return [{ id: 1, src: images }];
  }, [slider]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => a.postion - b.postion);
  }, [data]);

  const renderCategory = useCallback(({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 100)}
      layout={Layout.springify()}
      key={item.id}
    >
      <TouchableOpacity
        style={styles.categoryCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('Dynamic_Shop', {
            id: item.documentId,
            title: item.Title
          })
        }
      >
        <Image
          source={{ uri: item?.Image?.url }}
          style={styles.categoryImage}
        />
        <View style={styles.categoryContent}>
          <Text style={styles.categoryTitle}>{item.Title}</Text>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#FFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  ), [navigation]);

  if (loading && !refreshing) {
    return <LoadingPlaceholder />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={fetchData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.sliderContainer}>
        <DynmaicSlider
          navigationShow={true}
          heightPass={160}
          mode={'cover'}
          autoPlay={true}
          Dealy={3000}
          isUri={true}
          imagesByProp={sliderImages}
        />
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="pets" size={24} color="#B32113" />
          <Text style={styles.sectionTitle}>
            Shop By <Text style={styles.highlight}>Categories</Text>
          </Text>
        </View>

        <View style={styles.categoriesGrid}>
          {sortedData.length > 0 ? (
            sortedData.map((item, index) => renderCategory({ item, index }))
          ) : (
            <Text style={styles.emptyText}>No categories available</Text>
          )}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="shopping-basket" size={24} color="#B32113" />
          <Text style={styles.sectionTitle}>
            Featured <Text style={styles.highlight}>Bakery Products</Text>
          </Text>
        </View>
        <AllProducts />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#B32113',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  highlight: {
    color: '#B32113',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  categoryCard: {
    width: (width - 48) / 3,
    backgroundColor: '#B32113',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
    padding: 20,
    width: '100%',
  },
});