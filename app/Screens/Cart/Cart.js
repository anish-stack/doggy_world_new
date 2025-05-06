import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { UpdateCartItem } from '../../redux/slice/cartSlice';
import PaymentInfos from './PaymentInfos';
import { useNavigation, useRoute } from '@react-navigation/native';
import CartHeader from '../../components/CartHeader/CartHeader';

const { width, height } = Dimensions.get('window');

// Create memoized selector
const selectCartItems = state => state.cart.CartItems;

export default function Cart() {
  const navigation = useNavigation();
  const route = useRoute();
  const { offerClick } = route.params || {};
  
  // Use the simple selector to avoid creating new objects
  const cartItems = useSelector(selectCartItems);
  
  const dispatch = useDispatch();
  const [loadingItems, setLoadingItems] = useState({});

  // Memoize the calculation of payable price
  const payablePrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.Pricing.disc_price * item.quantity, 0);
  }, [cartItems]);

  const handleQuantityChange = useCallback(async (pastQuantity, ProductId, action) => {
    setLoadingItems(prev => ({ ...prev, [ProductId]: true }));

    try {
      const newQuantity = action === 'increase' ? pastQuantity + 1 : pastQuantity - 1;
      if (newQuantity >= 1) {
        await dispatch(UpdateCartItem({ ProductId, quantity: newQuantity }));
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setTimeout(() => {
        setLoadingItems(prev => ({ ...prev, [ProductId]: false }));
      }, 300);
    }
  }, [dispatch]);

  const navigateToHome = useCallback(() => navigation.navigate('Home'), [navigation]);
  const navigateToPetShop = useCallback(() => navigation.navigate('Pet_Shop'), [navigation]);
  const navigateToOffers = useCallback(() => {
    navigation.navigate('Available_Offer', { payAmount: payablePrice });
  }, [navigation, payablePrice]);

  const renderEmptyCart = useCallback(() => (
    <View style={styles.emptyCartContainer}>
      <Image
        source={require('./rb_27558.png')}
        style={styles.emptyCartImage}
      />
      <Text style={styles.emptyCartText}>
        Your cart is empty
      </Text>
      <TouchableOpacity
        style={styles.startShoppingButton}
        onPress={navigateToHome}
      >
        <Text style={styles.startShoppingText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  ), [navigateToHome]);

  const renderOfferBanner = useCallback(() => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={navigateToOffers}
      style={styles.offerBanner}
    >
      <View style={styles.offerContent}>
        <MaterialIcons name="local-offer" size={24} color="#FF3B30" />
        <Text style={styles.offerText}>
          10 New Coupons Available!
        </Text>
      </View>
      <Feather name="chevron-right" size={24} color="#000" />
    </TouchableOpacity>
  ), [navigateToOffers]);

  const renderCartItem = useCallback((item) => (
    <View key={item.ProductId} style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productDetails}>
        <Text numberOfLines={2} style={styles.productTitle}>
          {item.title}
        </Text>
        {item.varientSize && (
          <Text style={styles.variantSize}>Size: {item.varientSize}</Text>
        )}
        <View style={styles.priceRow}>
          <Text style={styles.discountPrice}>
            <FontAwesome name="rupee" size={16} /> {item.Pricing.disc_price * item.quantity}
          </Text>
          <Text style={styles.originalPrice}>
            <FontAwesome name="rupee" size={14} /> {item.Pricing.price}
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={() => handleQuantityChange(item.quantity, item.ProductId, 'decrease')}
            disabled={item.quantity <= 1 || loadingItems[item.ProductId]}
          >
            <Feather name="minus" size={18} color={"#FF3B30"} />
          </TouchableOpacity>

          <View style={styles.quantityWrapper}>
            {loadingItems[item.ProductId] ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Text style={styles.quantityText}>{item.quantity}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.quantity, item.ProductId, 'increase')}
            disabled={loadingItems[item.ProductId]}
          >
            <Feather name="plus" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [handleQuantityChange, loadingItems]);

  const cartContent = useMemo(() => {
    if (!cartItems || cartItems.length === 0) {
      return renderEmptyCart();
    }

    return (
      <>
        {cartItems.map(renderCartItem)}
        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={navigateToPetShop}
        >
          <Text style={styles.addMoreText}>Add More Items</Text>
          <Feather name="plus-circle" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </>
    );
  }, [cartItems, renderCartItem, renderEmptyCart, navigateToPetShop]);

  return (
    <SafeAreaView style={styles.container}>
      <CartHeader />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {renderOfferBanner()}

        <View style={styles.cartContainer}>
          {cartContent}
        </View>

        {cartItems && cartItems.length > 0 && (
          <PaymentInfos offer={offerClick} cartItems={cartItems} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  offerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  cartContainer: {
    padding: 12
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between'
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4
  },
  variantSize: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30'
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through'
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    alignSelf: 'flex-start'
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6
  },
  quantityButtonDisabled: {
    opacity: 0.5
  },
  quantityWrapper: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#FF3B30',
    gap: 8
  },
  addMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30'
  },
  emptyCartContainer: {
    alignItems: 'center',
    padding: 24
  },
  emptyCartImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 24
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16
  },
  startShoppingButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  startShoppingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  totalSection: {
    flex: 1
  },
  totalText: {
    fontSize: 14,
    color: '#666'
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000'
  },
  checkoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  checkoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  }
});