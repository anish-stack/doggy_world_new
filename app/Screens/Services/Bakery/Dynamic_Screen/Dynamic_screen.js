import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,

} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeadPart from '../../../../layouts/TopHeadPart';
import { API_END_POINT_URL_LOCAL } from '../../../../constant/constant';

// Icons (using emoji as placeholders - replace with actual icons in production)
const ICONS = {
  COD: "💵",
  RETURN: "↩️",
  FRESH: "✨",
  FREE_DELIVERY: "🚚",
  DISCOUNT: "🔥",
  OUT_OF_STOCK: "⚠️",
  CART: "🛒",
  PLUS: "➕",
  MINUS: "➖",
  CLOSE: "✖️",
  HURRY: "⏱️"
};



const ProductCard = ({ item, onPress }) => {
  const isOutOfStock = item.variants.length > 0
    ? item.variants.every(v => v.stock === 0 || !v.inStock)
    : !item.isProductAvailable;

  return (
    <TouchableOpacity
      style={[styles.productCard, isOutOfStock && styles.outOfStockCard]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isOutOfStock}
    >
      <View style={styles.tagContainer}>
        {item.tag && <Text style={styles.tagText}>{item.tag}</Text>}
        {item.offPercentage > 0 && (
          <Text style={styles.discountTag}>{ICONS.DISCOUNT} {item.offPercentage}% OFF</Text>
        )}
      </View>

      <Image
        source={{ uri: item.mainImage.url }}
        style={[styles.productImage, isOutOfStock && styles.outOfStockImage]}
        resizeMode="cover"
      />

      {isOutOfStock && (
        <View style={styles.outOfStockOverlay}>
          <Text style={styles.outOfStockText}>{ICONS.OUT_OF_STOCK} Out of Stock</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productFlavor}>{item.flavour}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.discountPrice}>₹{item.discountPrice.toFixed(0)}</Text>
          {item.offPercentage > 0 && (
            <Text style={styles.originalPrice}>₹{item.price}</Text>
          )}
        </View>

        {item.offPercentage > 0 && (
          <View style={styles.hurryContainer}>
            <Text style={styles.hurryText}>{ICONS.HURRY} Hurry! Limited time offer</Text>
          </View>
        )}

        <View style={styles.badgeContainer}>
          {item.freeDelivery && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ICONS.FREE_DELIVERY} Free Delivery</Text>
            </View>
          )}
          {item.freshStock && (
            <View style={[styles.badge, styles.freshBadge]}>
              <Text style={styles.badgeText}>{ICONS.FRESH} Fresh</Text>
            </View>
          )}
          {item.isCod && (
            <View style={[styles.badge, styles.codBadge]}>
              <Text style={styles.badgeText}>{ICONS.COD} COD</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};


export default function Dynamic_screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { title, id } = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-bakery-category-product/${id}`);
      if (response.data.success) {
        setData(response.data.product);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProductPress = (product) => {
    navigation.navigate('Dynamic_Details_Shop_Bakery', {
      id: product._id,
      title: product.name
    });
  };


  const renderEmptyList = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found in this category</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TopHeadPart title={title} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => handleProductPress(item)}
            />
          )}
          numColumns={2}
          contentContainerStyle={styles.productGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
        />
      )}


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productGrid: {
    padding: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },

  // Product Card Styles
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  outOfStockCard: {
    opacity: 0.7,
  },
  outOfStockImage: {
    opacity: 0.5,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  tagContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    flexDirection: 'row',
  },
  tagText: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  discountTag: {
    backgroundColor: '#FF6B6B',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  productFlavor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  hurryContainer: {
    marginBottom: 8,
  },
  hurryText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  freshBadge: {
    backgroundColor: '#E8F5E9',
  },
  codBadge: {
    backgroundColor: '#FFF3E0',
  },
  badgeText: {
    fontSize: 10,
    color: '#333',
  },

});