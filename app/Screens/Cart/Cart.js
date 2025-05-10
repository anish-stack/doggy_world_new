
import { useState, useCallback, useMemo, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from "react-native"
import { MaterialCommunityIcons, MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons"
import { useSelector, useDispatch } from "react-redux"
import { useNavigation } from "@react-navigation/native"
import axios from 'axios'

import { UpdateCartItem, RemoveCartItem } from '../../redux/slice/cartSlice';
import useUserAddress from "../../hooks/useUserAddress"
import { useToken } from "../../hooks/useToken"
import CartHeader from "../../components/CartHeader/CartHeader"
import AddressCard from "./AddressCard"
import EmptyCart from "./EmptyCart"
import useCoupons from "../../hooks/useCoupons"
import { API_END_POINT_URL_LOCAL } from "../../constant/constant"

const CartScreen = () => {
  // Sample cart items from the provided data
  const cartItems = useSelector((state) => state.cart.CartItems) || [
    {
      Pricing: {
        disc_price: 883.32,
        off_dis_percentage: 32,
        price: 1299,
      },
      ProductId: "681f1a65167f725d4729857e",
      freeDelivery: false,
      image: "https://res.cloudinary.com/do34gd7bu/image/upload/v1746868800/uploads/mksablm1sarmeuzbxwhm.avif",
      isCod: true,
      isPetShopProduct: true,
      isReturn: false,
      isVarientTrue: false,
      quantity: 1,
      title: "Henlo Chicken & Vegetable Baked Dry Dog Food|Adult Dog Food |High Protein | Human Grade | Pet food",
      varientSize: undefined,
    },
  ]

  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { token } = useToken()
  const { address, loading, getAddress, createAddress } = useUserAddress()
  const { coupons } = useCoupons('Pet Shop');
  // States
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("online")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [newAddressData, setNewAddressData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN",
  })
  const [loadingItems, setLoadingItems] = useState({})


  const addresses = address?.length
    ? address
    : [

    ]

  // Set login status based on token
  useEffect(() => {
    setIsLoggedIn(!!token)
    if (token) {
      getAddress()
    }
  }, [token])

  // Set default selected address
  useEffect(() => {
    if (addresses?.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0])
    }
  }, [addresses])

  // Check if COD is available for all items
  const isCodAvailable = useMemo(() => {
    return cartItems.every((item) => item.isCod)
  }, [cartItems])

  // Check if any item has free delivery
  const hasFreeDeliveryItems = useMemo(() => {
    return cartItems.some((item) => item.freeDelivery)
  }, [cartItems])

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return {
      subtotal: 0,
      discount: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
      hasNonFreeDeliveryItems: false
    };


    let subtotal = 0;
    let hasNonFreeDeliveryItems = false;

    cartItems.forEach(item => {
      subtotal += item.Pricing.disc_price * item.quantity;

      // Check if any product doesn't have free delivery
      if (item.freeDelivery === false) {
        hasNonFreeDeliveryItems = true;
      }
    });

    // Calculate coupon discount
    let discount = 0;
    if (selectedCoupon) {
      if (selectedCoupon.discountType === 'flat') {
        discount = selectedCoupon.discountPercentage;
      } else {
        discount = (subtotal * selectedCoupon.discountPercentage) / 100;
      }
    }

    // Calculate tax (18%)
    const tax = (subtotal - discount) * 0.18;

    // Delivery fee (₹49 if there are non-free delivery items)
    const deliveryFee = hasNonFreeDeliveryItems ? 49 : 0;


    const total = subtotal - discount + tax + deliveryFee;

    return {
      subtotal,
      discount,
      tax,
      deliveryFee,
      total,
      hasNonFreeDeliveryItems
    };
  }, [cartItems, selectedCoupon, hasFreeDeliveryItems]);

  // Handle quantity change
  const handleQuantityChange = useCallback(
    (pastQuantity, ProductId, action) => {
      setLoadingItems((prev) => ({ ...prev, [ProductId]: true }))
      try {
        const newQuantity = action === "increase" ? pastQuantity + 1 : pastQuantity - 1
        if (newQuantity >= 1) {
          dispatch(UpdateCartItem({ ProductId, quantity: newQuantity }))
        }
      } finally {
        setLoadingItems((prev) => ({ ...prev, [ProductId]: false }))
      }
    },
    [dispatch],
  )

  const handleApplyCoupon = useCallback((coupon) => {
    setSelectedCoupon(coupon);
    setShowCoupons(false);
  }, []);

  const handleRemoveCoupon = useCallback(() => {
    setSelectedCoupon(null);
  }, []);

  // Handle remove item
  const handleRemoveItem = useCallback(
    (ProductId, title) => {
      Alert.alert("Remove Item", `Remove "${title}" from cart?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: () => dispatch(RemoveCartItem({ ProductId })),
          style: "destructive",
        },
      ])
    },
    [dispatch],
  )

  // Handle add new address
  const handleAddAddress = async () => {
    if (!newAddressData.street || !newAddressData.city || !newAddressData.state || !newAddressData.zipCode) {
      Alert.alert("Error", "Please fill all address fields")
      return
    }

    try {
      const newAddress = await createAddress(newAddressData)
      if (newAddress) {
        setSelectedAddress(newAddress)
        setShowAddressModal(false)
        getAddress() // Refresh address list
      }
    } catch (err) {
      Alert.alert("Error", "Failed to create address")
    }
  }

  const handleCheckout = useCallback(() => {
    if (!isLoggedIn) {
      navigation.navigate("Login", { redirectTo: "Cart" });
      return;
    }

    if (selectedPaymentMethod === "cod") {
      if (!isCodAvailable) {
        Alert.alert("Error", "COD not available for some items");
        return;
      }

      if (!selectedAddress) {
        Alert.alert("Error", "Please select or add a delivery address");
        return;
      }
    }

    const dataForCart = {
      items: cartItems,
      paymentDetails: {
        subtotal: cartTotals?.subtotal,
        discount: cartTotals?.discount,
        tax: cartTotals?.tax,
        deliveryFee: cartTotals?.deliveryFee,
        total: cartTotals?.total,
        hasNonFreeDeliveryItems: cartTotals?.hasNonFreeDeliveryItems
      },
      couponCode: selectedCoupon || null,
      paymentMethod: selectedPaymentMethod,
      addressId: selectedAddress?._id,
      cartTotal: cartTotals?.total
    };

    const makeBooking = async () => {
      try {
        const response = await axios.post(
          `${API_END_POINT_URL_LOCAL}/api/v1/booking-for-shop`,
          dataForCart,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data?.success) {
          Alert.alert("Success", "Your order has been placed successfully!");
          // navigation.navigate("Orders"); // or redirect to thank you page
        } else {
          Alert.alert("Error", "Failed to place the order. Please try again.");
        }
      } catch (error) {
        console.error("Checkout Error:", error);
        Alert.alert("Error", "Something went wrong during checkout.");
      }
    };

    makeBooking();

  }, [
    isLoggedIn,
    selectedPaymentMethod,
    isCodAvailable,
    selectedAddress,
    navigation,
    cartItems,
    cartTotals,
    selectedCoupon,
    token
  ]);

  // Render empty cart
  if (!cartItems?.length) {
    return (
      <SafeAreaView style={styles.container}>
        <CartHeader />
        <EmptyCart onContinueShopping={() => navigation.navigate("Shop")} />
      </SafeAreaView>
    )
  }

  return (
    <>



      <CartHeader />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Cart Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cart Items ({cartItems.length})</Text>
          {cartItems.map((item) => (
            <View key={item.ProductId} style={styles.cartItem}>
              <Image
                source={{ uri: item.image?.replace(".avif", ".jpg") }}
                style={styles.productImage}
              // defaultSource={require("../assets/placeholder.png")}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.productTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.priceContainer}>
                  <Text style={styles.price}>₹{item.Pricing.disc_price.toFixed(2)}</Text>
                  {item.Pricing.off_dis_percentage > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{item.Pricing.off_dis_percentage}% OFF</Text>
                    </View>
                  )}
                </View>

                <View style={styles.badgeContainer}>
                  {!item.isCod && (
                    <View style={[styles.badge, styles.codBadge]}>
                      <Text style={styles.badgeText}>COD not available</Text>
                    </View>
                  )}
                  {item.freeDelivery && (
                    <View style={[styles.badge, styles.deliveryBadge]}>
                      <Text style={styles.badgeText}>Free Delivery</Text>
                    </View>
                  )}
                  {!item.isReturn && (
                    <View style={[styles.badge, styles.returnBadge]}>
                      <Text style={styles.badgeText}>Non-returnable</Text>
                    </View>
                  )}
                </View>

                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
                    onPress={() => handleQuantityChange(item.quantity, item.ProductId, "decrease")}
                    disabled={item.quantity <= 1 || loadingItems[item.ProductId]}
                  >
                    <AntDesign name="minus" size={16} color={item.quantity <= 1 ? "#ccc" : "#666"} />
                  </TouchableOpacity>

                  <Text style={styles.quantity}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(item.quantity, item.ProductId, "increase")}
                    disabled={loadingItems[item.ProductId]}
                  >
                    <AntDesign name="plus" size={16} color="#666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveItem(item.ProductId, item.title)}
                  >
                    <MaterialIcons name="delete-outline" size={24} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Coupons Section */}
        <View style={styles.couponsContainer}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>

          {selectedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponContent}>
                <View style={styles.couponBadge}>
                  <MaterialIcons name="local-offer" size={18} color="#fff" />
                </View>
                <View style={styles.appliedCouponDetails}>
                  <Text style={styles.appliedCouponCode}>{selectedCoupon.code}</Text>
                  <Text style={styles.appliedCouponDescription}>
                    {selectedCoupon.discountType === 'flat'
                      ? `₹${selectedCoupon.discountPercentage} off`
                      : `${selectedCoupon.discountPercentage}% off`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.removeCouponButton} onPress={handleRemoveCoupon}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.couponButton}
              onPress={() => setShowCoupons(!showCoupons)}
            >
              <MaterialIcons name="local-offer" size={20} color="#FF6B6B" />
              <Text style={styles.couponButtonText}>Apply Coupon</Text>
              <Ionicons
                name={showCoupons ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          )}

          {showCoupons && coupons && coupons.length > 0 && (
            <View style={styles.couponsList}>
              {coupons.map(coupon => (
                <TouchableOpacity
                  key={coupon._id}
                  style={styles.couponItem}
                  onPress={() => handleApplyCoupon(coupon)}
                >
                  <View style={styles.couponItemLeft}>
                    <View style={styles.couponIconContainer}>
                      <MaterialIcons name="local-offer" size={18} color="#fff" />
                    </View>
                    <View style={styles.couponDetails}>
                      <Text style={styles.couponCode}>{coupon.code}</Text>
                      <Text style={styles.couponDescription}>{coupon.description}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.applyCouponButton}
                    onPress={() => handleApplyCoupon(coupon)}
                  >
                    <Text style={styles.applyCouponText}>Apply</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Payment Method Selection */}


        {/* Address Section - Only show if COD is selected */}
        {selectedPaymentMethod === "cod" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddressModal(true)}>
                <Text style={styles.addButtonText}>+ Add New</Text>
              </TouchableOpacity>
            </View>

            {addresses?.length > 0 ? (
              <View style={styles.addressList}>
                {addresses.map((addr) => (
                  <AddressCard
                    key={addr._id}
                    address={addr}
                    selected={selectedAddress?._id === addr._id}
                    onSelect={() => setSelectedAddress(addr)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noAddressContainer}>
                <Text style={styles.noAddressText}>No addresses found</Text>
                <TouchableOpacity style={styles.addAddressButton} onPress={() => setShowAddressModal(true)}>
                  <Text style={styles.addAddressButtonText}>Add New Address</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Price Details */}
        <View style={[styles.section]}>
          <Text style={styles.sectionTitle}>Price Details</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{cartTotals.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (18%)</Text>
            <Text style={styles.priceValue}>₹{cartTotals.tax.toFixed(2)}</Text>
          </View>
          {cartTotals.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount</Text>
              <Text style={[styles.priceValue, styles.discountValue]}>-₹{cartTotals.discount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Delivery Fee</Text>
            {cartTotals.deliveryFee === 0 ? (
              <Text style={styles.freeText}>FREE</Text>
            ) : (
              <Text style={styles.priceValue}>₹{cartTotals.deliveryFee.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{cartTotals.total.toFixed(2)}</Text>
          </View>
        </View>


        <View style={[styles.section, { marginBottom: 90 }]}>
          <Text style={styles.sectionTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[styles.paymentOption, selectedPaymentMethod === "online" && styles.selectedPayment]}
            onPress={() => setSelectedPaymentMethod("online")}
          >
            <MaterialCommunityIcons
              name="credit-card"
              size={24}
              color={selectedPaymentMethod === "online" ? "#4CAF50" : "#666"}
            />
            <Text style={styles.paymentText}>Online Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPaymentMethod === "cod" && styles.selectedPayment,
              !isCodAvailable && styles.disabledPayment,
            ]}
            onPress={() => isCodAvailable && setSelectedPaymentMethod("cod")}
            disabled={!isCodAvailable}
          >
            <MaterialCommunityIcons
              name="cash"
              size={24}
              color={!isCodAvailable ? "#ccc" : selectedPaymentMethod === "cod" ? "#4CAF50" : "#666"}
            />
            <Text style={[styles.paymentText, !isCodAvailable && styles.disabledText]}>Cash on Delivery</Text>
          </TouchableOpacity>
          {!isCodAvailable && <Text style={styles.notAvailableText}>Not available for some items</Text>}
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.finalTotal}>₹{cartTotals.total.toFixed(2)}</Text>
          <Text style={styles.totalCaption}>Total Amount</Text>
        </View>

        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>{isLoggedIn ? "Proceed to Checkout" : "Login to Checkout"}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>


      {/* Add Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Street Address</Text>
                <TextInput
                  style={styles.input}
                  value={newAddressData.street}
                  onChangeText={(text) => setNewAddressData({ ...newAddressData, street: text })}
                  placeholder="Enter your street address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={newAddressData.city}
                  onChangeText={(text) => setNewAddressData({ ...newAddressData, city: text })}
                  placeholder="Enter your city"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  value={newAddressData.state}
                  onChangeText={(text) => setNewAddressData({ ...newAddressData, state: text })}
                  placeholder="Enter your state"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Zip Code</Text>
                <TextInput
                  style={styles.input}
                  value={newAddressData.zipCode}
                  onChangeText={(text) => setNewAddressData({ ...newAddressData, zipCode: text })}
                  placeholder="Enter your zip code"
                  keyboardType="number-pad"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddressModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress}>
                <Text style={styles.saveButtonText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  section: {
    backgroundColor: "#fff",

    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  addButton: {
    padding: 8,
  },
  addButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  cartItem: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 16,
    marginBottom: 16,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  discountBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  codBadge: {
    backgroundColor: "#FFE0E0",
  },
  deliveryBadge: {
    backgroundColor: "#E8F5E9",
  },
  returnBadge: {
    backgroundColor: "#FFF3E0",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#f0f0f0",
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  removeButton: {
    marginLeft: "auto",
    padding: 4,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPayment: {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  disabledPayment: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  paymentText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },
  disabledText: {
    color: "#999",
  },
  notAvailableText: {
    fontSize: 12,
    color: "#ff4444",
    marginLeft: "auto",
  },
  addressList: {
    gap: 12,
  },
  noAddressContainer: {
    alignItems: "center",
    padding: 20,
  },
  noAddressText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  addAddressButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addAddressButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: "#666",
  },
  priceValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  freeText: {
    fontSize: 15,
    color: "#4CAF50",
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  checkoutContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  totalContainer: {
    flex: 1,
  },
  finalTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  totalCaption: {
    fontSize: 12,
    color: "#666",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginLeft: 16,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  couponsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
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
  couponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  couponButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  couponsList: {
    marginTop: 16,
  },
  couponItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFDFD',
  },
  couponItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponDetails: {
    marginLeft: 12,
    flex: 1,
  },
  couponCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  couponDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  applyCouponButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 6,
  },
  applyCouponText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 14,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#FFF0F0',
  },
  appliedCouponContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedCouponDetails: {
    marginLeft: 12,
  },
  appliedCouponCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  appliedCouponDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  removeCouponButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeCouponText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  discountValue: {
    color: '#4CAF50',
  },

})

export default CartScreen
