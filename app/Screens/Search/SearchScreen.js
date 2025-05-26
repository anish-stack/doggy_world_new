import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [petProducts, setPetProducts] = useState([]);
  const [bakeryProducts, setBakeryProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // API URLs
  const PET_API = 'http://192.168.1.22:8000/api/v1/petshop-get-product';
  const BAKERY_API = 'http://192.168.1.22:8000/api/v1/get-bakery-product';

  // Fetch data from APIs
  const fetchProducts = async () => {
    try {
      setInitialLoading(true);

      const [petResponse, bakeryResponse] = await Promise.all([
        fetch(PET_API),
        fetch(BAKERY_API)
      ]);

      const petData = await petResponse.json();
      const bakeryData = await bakeryResponse.json();

      if (petData.success && petData.products) {
        const petProductsWithType = petData.products.map(product => ({
          ...product,
          productType: 'pet'
        }));
        setPetProducts(petProductsWithType);
      }

      if (bakeryData.success && bakeryData.products) {
        const bakeryProductsWithType = bakeryData.products.map(product => ({
          ...product,
          productType: 'bakery'
        }));
        setBakeryProducts(bakeryProductsWithType);
      }

      // Combine and get top products
      const allProducts = [
        ...(petData.products || []).map(p => ({ ...p, productType: 'pet' })),
        ...(bakeryData.products || []).map(p => ({ ...p, productType: 'bakery' }))
      ];

      const topProductsList = allProducts.filter(product => product.isOnTopProduct);
      setTopProducts(topProductsList);
      setFilteredProducts(topProductsList); // Show top products initially

    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  // Debounced search function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Smart search function with regex and price filtering
  const performSearch = (query) => {
    if (!query.trim()) {
      setFilteredProducts(topProducts);
      return;
    }

    setLoading(true);

    const allProducts = [...petProducts, ...bakeryProducts];

    // Parse search query for price filtering
    const priceMatch = query.match(/under\s+(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;

    // Remove price part from query for text search
    const textQuery = query.replace(/under\s+\d+/i, '').trim();

    let results = allProducts;

    // Apply text search if query exists
    if (textQuery) {
      const searchRegex = new RegExp(textQuery.split(' ').join('|'), 'gi');
      results = allProducts.filter(product => {
        return (
          searchRegex.test(product.name) ||
          searchRegex.test(product.description) ||
          searchRegex.test(product.tag || '') ||
          searchRegex.test(product.flavour || '')
        );
      });
    }

    // Apply price filter if specified
    if (maxPrice) {
      results = results.filter(product => {
        const price = product.discountPrice || product.price;
        return price <= maxPrice;
      });
    }

    // Sort by relevance (top products first, then by name)
    results.sort((a, b) => {
      if (a.isOnTopProduct && !b.isOnTopProduct) return -1;
      if (!a.isOnTopProduct && b.isOnTopProduct) return 1;
      return a.name.localeCompare(b.name);
    });

    setFilteredProducts(results);
    setLoading(false);
  };

  const debouncedSearch = useCallback(debounce(performSearch, 300), [petProducts, bakeryProducts, topProducts]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Navigate to product detail screen
  const handleProductPress = (product) => {
    const screenName = product.productType === 'pet'
      ? 'Dynamic_Details_Shop'
      : 'Dynamic_Details_Shop_Bakery';

    navigation.navigate(screenName, {
      id: product._id,
      title: product.name,
    });
  };


  // Render product badge
  const renderBadge = (productType) => {
    const isPet = productType === 'pet';
    return (
      <View style={[styles.badge, { backgroundColor: isPet ? '#FF6B6B' : '#4ECDC4' }]}>
        <Text style={styles.badgeText}>
          {isPet ? 'Pet Product' : 'Bakery Product'}
        </Text>
      </View>
    );
  };

  // Render product item
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productContent}>
        <Image
          source={{ uri: item.mainImage?.url?.endsWith('.avif') ? item.mainImage.url.replace('.avif', '.jpg') : item.mainImage?.url }}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.name}
            </Text>
            {renderBadge(item.productType)}
          </View>

          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {item.tag && (
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          )}

          <View style={styles.priceContainer}>
            <Text style={styles.discountPrice}>
              ₹{item.discountPrice || item.price}
            </Text>
            {item.discountPrice && (
              <Text style={styles.originalPrice}>₹{item.price}</Text>
            )}
            {item.offPercentage > 0 && (
              <Text style={styles.discount}>{item.offPercentage}% OFF</Text>
            )}
          </View>

          <View style={styles.featuresContainer}>
            {item.freeDelivery && (
              <Text style={styles.feature}>🚚 Free Delivery</Text>
            )}
            {item.isCod && (
              <Text style={styles.feature}>💰 COD</Text>
            )}
            {item.freshStock && (
              <Text style={styles.feature}>✨ Fresh Stock</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search here (e.g., 'Cookies under 500')"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        {loading && (
          <View style={styles.searchLoadingContainer}>
            <ActivityIndicator size="small" color="#4ECDC4" />
            <Text style={styles.searchLoadingText}>Searching...</Text>
          </View>
        )}

        <Text style={styles.resultsHeader}>
          {searchQuery ? `Search Results (${filteredProducts.length})` : `Top Products (${filteredProducts.length})`}
        </Text>

        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={50} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No products found' : 'No top products available'}
              </Text>
              <Text style={styles.emptySubText}>
                Try searching with different keywords
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  searchLoadingText: {
    marginLeft: 8,
    color: '#666',
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginVertical: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 3.84,
    // elevation: 5,
  },
  productContent: {
    flexDirection: 'row',
    padding: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  tagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discount: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  feature: {
    fontSize: 11,
    color: '#666',
    marginRight: 12,
    marginBottom: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});