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
  Alert,
  Vibration,
  ToastAndroid,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopHeadPart from '../../../../layouts/TopHeadPart';
import { API_END_POINT_URL_LOCAL } from '../../../../constant/constant';
import { useDispatch, useSelector } from 'react-redux';
import { AddingFailure, AddingStart, AddingSuccess  } from '../../../../redux/slice/cartSlice';

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

const { width } = Dimensions.get('window');
const MAX_QUANTITY = 99; // Maximum 2-digit quantity

// Toast message function that works on both Android and iOS
const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message, [{ text: 'OK' }], { cancelable: true });
  }
};

// Product Card Component
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

// Single Product Screen Component
const SingleProductScreen = ({ product, onClose }) => {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const isOutOfStock = selectedVariant 
    ? selectedVariant.stock === 0 || !selectedVariant.inStock
    : !product.isProductAvailable;

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  const handleQuantityChange = (value) => {
    const newQuantity = quantity + value;
    if (newQuantity >= 1 && newQuantity <= MAX_QUANTITY) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) {
      showToast("Sorry, this product is out of stock!");
      return;
    }
    console.log("selectedVariant",selectedVariant)
    const price = {};
    const isVarientTrue = product.variants.length > 0 ? true : false;

    if (isVarientTrue && selectedVariant.stock !== 0) {
      price.price = selectedVariant.price;
      price.disc_price = selectedVariant.discountPrice;
      price.off_dis_percentage = selectedVariant.offPercentage;
    } else {
      price.price = product.price;
      price.disc_price = product.discountPrice;
      price.off_dis_percentage = product.offPercentage;
    }

    // Prepare new item to be added to cart
    const newItem = {
      ProductId: product._id,
      title: product.name,
      isPetShopProduct: false,
      freeDelivery: product?.freeDelivery,
      isCod: product?.isCod,
      isReturn: product?.isReturn,
      quantity: quantity,
      varientSize: selectedVariant?.size,
      varientId: selectedVariant?._id,
      Pricing: price,
      image: product.imageUrl[0]?.url,
      isVarientTrue: isVarientTrue,
    };

    try {
      dispatch(AddingStart());
      dispatch(AddingSuccess({
        Cart: [newItem],
      }));

      Vibration.vibrate(150);
      showToast("Product added to cart!");
      
      // Navigate to cart after a short delay
      setTimeout(() => {
        navigation.navigate('cart');
      }, 500);
    } catch (error) {
      dispatch(AddingFailure(error.message));
      showToast("Failed to add product to cart. Please try again.");
    }
  }, [selectedVariant, quantity, product, dispatch, navigation, isOutOfStock]);

  return (
    <View style={styles.singleProductContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>{ICONS.CLOSE}</Text>
      </TouchableOpacity>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          <Image 
            source={{ uri: product.imageUrl[currentImageIndex].url }} 
            style={styles.mainProductImage} 
            resizeMode="cover"
          />
          
          {isOutOfStock && (
            <View style={styles.singleOutOfStockOverlay}>
              <Text style={styles.singleOutOfStockText}>{ICONS.OUT_OF_STOCK} Out of Stock</Text>
            </View>
          )}
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.thumbnailContainer}
          >
            {product.imageUrl.map((image, index) => (
              <TouchableOpacity 
                key={image._id} 
                onPress={() => setCurrentImageIndex(index)}
                style={[
                  styles.thumbnail, 
                  currentImageIndex === index && styles.selectedThumbnail
                ]}
              >
                <Image 
                  source={{ uri: image.url }} 
                  style={styles.thumbnailImage} 
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Product Details */}
        <View style={styles.productDetails}>
          <View style={styles.productHeader}>
            <Text style={styles.singleProductName}>{product.name}</Text>
            {product.tag && <Text style={styles.singleProductTag}>{product.tag}</Text>}
          </View>
          
          <Text style={styles.singleProductFlavor}>{product.flavour}</Text>
          <Text style={styles.singleProductDescription}>{product.description}</Text>
          
          <View style={styles.singlePriceContainer}>
            <Text style={styles.singleDiscountPrice}>
              ₹{selectedVariant ? selectedVariant.discountPrice.toFixed(0) : product.discountPrice.toFixed(0)}
            </Text>
            {(selectedVariant ? selectedVariant.offPercentage > 0 : product.offPercentage > 0) && (
              <Text style={styles.singleOriginalPrice}>
                ₹{selectedVariant ? selectedVariant.price : product.price}
              </Text>
            )}
            {(selectedVariant ? selectedVariant.offPercentage > 0 : product.offPercentage > 0) && (
              <Text style={styles.singleDiscountPercentage}>
                {selectedVariant ? selectedVariant.offPercentage : product.offPercentage}% OFF
              </Text>
            )}
          </View>
          
          {(selectedVariant ? selectedVariant.offPercentage > 0 : product.offPercentage > 0) && (
            <View style={styles.singleHurryContainer}>
              <Text style={styles.singleHurryText}>
                {ICONS.HURRY} Hurry! Limited time offer - Get it before the price goes up!
              </Text>
            </View>
          )}
          
          {/* Variants */}
          {product.variants.length > 0 && (
            <>
              <Text style={styles.variantTitle}>Available Sizes:</Text>
              <View style={styles.variantsContainer}>
                {product.variants.map((variant) => (
                  <TouchableOpacity 
                    key={variant._id} 
                    style={[
                      styles.variantButton,
                      selectedVariant._id === variant._id && styles.selectedVariant,
                      variant.stock === 0 || !variant.inStock ? styles.disabledVariant : null
                    ]}
                    onPress={() => handleVariantSelect(variant)}
                    disabled={variant.stock === 0 || !variant.inStock}
                  >
                    <Text style={[
                      styles.variantText,
                      selectedVariant._id === variant._id && styles.selectedVariantText,
                      variant.stock === 0 || !variant.inStock ? styles.disabledVariantText : null
                    ]}>
                      {variant.size}
                      {variant.stock === 0 || !variant.inStock ? " (Out of Stock)" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          
          {/* Quantity */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityTitle}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => handleQuantityChange(-1)}
                disabled={isOutOfStock}
              >
                <Text style={styles.quantityButtonText}>{ICONS.MINUS}</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => handleQuantityChange(1)}
                disabled={isOutOfStock}
              >
                <Text style={styles.quantityButtonText}>{ICONS.PLUS}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Features */}
          <View style={styles.featuresContainer}>
            {product.isCod && (
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>{ICONS.COD} COD Available</Text>
              </View>
            )}
            {product.isReturn && (
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>{ICONS.RETURN} Returnable</Text>
              </View>
            )}
            {product.freshStock && (
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>{ICONS.FRESH} Fresh Stock</Text>
              </View>
            )}
            {product.freeDelivery && (
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>{ICONS.FREE_DELIVERY} Free Delivery</Text>
              </View>
            )}
          </View>
          
          {/* Add to Cart Button */}
          <TouchableOpacity 
            style={[styles.addToCartButton, isOutOfStock && styles.disabledButton]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Text style={styles.addToCartButtonText}>
              {isOutOfStock ? "Out of Stock" : `${ICONS.CART} Add to Cart - ₹${(selectedVariant ? selectedVariant.discountPrice * quantity : product.discountPrice * quantity).toFixed(0)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default function Dynamic_screen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { title, id } = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    setSelectedProduct(product);
  };

  const handleCloseProductView = () => {
    setSelectedProduct(null);
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
      
      {selectedProduct && (
        <SingleProductScreen 
          product={selectedProduct} 
          onClose={handleCloseProductView}
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
  
  // Single Product Screen Styles
  singleProductContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageCarousel: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    position: 'relative',
  },
  mainProductImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  singleOutOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 70, // Leave space for thumbnails
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleOutOfStockText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  thumbnailContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  selectedThumbnail: {
    borderColor: '#FF6B6B',
    borderWidth: 2,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  singleProductName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  singleProductTag: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  singleProductFlavor: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  singleProductDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 16,
  },
  singlePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  singleDiscountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  singleOriginalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  singleDiscountPercentage: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  singleHurryContainer: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  singleHurryText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  variantButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedVariant: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF0F0',
  },
  disabledVariant: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  variantText: {
    fontSize: 14,
    color: '#555',
  },
  selectedVariantText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  disabledVariantText: {
    color: '#999',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  quantityValue: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  featureItem: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#555',
  },
  addToCartButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});