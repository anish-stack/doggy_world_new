import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchCakeDesign, fetchFlavours, fetchQunatity, fetchClinics } from './utils';
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, addDays, isAfter, setHours, setMinutes } from 'date-fns';
import { getUser } from '../../../../hooks/getUserHook';
import useUserAddress from '../../../../hooks/useUserAddress';
import axios from 'axios';
import useCoupons from '../../../../hooks/useCoupons';
import useSettingsHook from '../../../../hooks/useSettingsHooks';
import RazorpayCheckout from 'react-native-razorpay';
import { API_END_POINT_URL_LOCAL } from '../../../../constant/constant';
import useNotificationPermission from '../../../../hooks/notification';
import { useToken } from '../../../../hooks/useToken';

const { width } = Dimensions.get('screen');

const DeliveryOption = ({ title, icon, isSelected, onSelect }) => {
  return (
    <TouchableOpacity
      style={[styles.deliveryOption, isSelected && styles.selectedDeliveryOption]}
      onPress={onSelect}
    >
      <View style={[styles.deliveryIconContainer, isSelected && styles.selectedDeliveryIconContainer]}>
        {icon}
      </View>
      <Text style={[styles.deliveryOptionText, isSelected && styles.selectedDeliveryOptionText]}>
        {title}
      </Text>
      <View style={[styles.radioButton, isSelected && styles.selectedRadioButton]}>
        {isSelected && <View style={styles.radioButtonInner} />}
      </View>
    </TouchableOpacity>
  );
};

export default function CakeDelivery() {
  const route = useRoute();
  const { flavourId, quantityId, designId } = route.params || {};
  const [flavour, setFlavour] = useState(null);
  const [design, setDesign] = useState(null);
  const [quantity, setQuantity] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn, token } = useToken();
  const { user, getUserFnc } = getUser();
  const navigation = useNavigation();
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' or 'pickup'
  const [currentStep, setCurrentStep] = useState(1);
  const [petName, setPetName] = useState('');
  const { address, loading: addressLoading, getAddress, createAddress } = useUserAddress();
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { coupons, loading: couponsLoading } = useCoupons('Cakes');
  const [showCoupons, setShowCoupons] = useState(false);
  const { settings, loading: settingsLoading } = useSettingsHook();

  const { fcmToken } = useNotificationPermission()
  const [processingPayment, setProcessingPayment] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(1))[0];
  const buttonScale = useState(new Animated.Value(1))[0];

  const [newAddressData, setNewAddressData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "IN",
  });

  const [touched, setTouched] = useState({
    petName: false,
    date: false,
    store: false
  });

  const [errors, setErrors] = useState({});

  const deliveryDateRange = useMemo(() => {
    const now = new Date();
    const indianTimeString = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);

    const [month, day, year, hour, minute, second] = indianTimeString.match(/\d+/g).map(Number);
    const indianTime = new Date(year, month - 1, day, hour, minute, second);

    const cutoffTime = new Date(indianTime);
    cutoffTime.setHours(15, 0, 0, 0); // 3:00 PM IST

    let minDate;
    if (indianTime.getTime() > cutoffTime.getTime()) {
      minDate = new Date(indianTime);
      minDate.setDate(minDate.getDate() + 1);
    } else {
      minDate = new Date(indianTime);
    }

    const maxDate = new Date(minDate);
    maxDate.setDate(maxDate.getDate() + 10);

    return { minDate, maxDate };
  }, []);

  // Calculate order summary with tax, delivery, and discounts
  const orderSummary = useMemo(() => {
    if (!quantity || !settings) return { subtotal: 0, tax: 0, delivery: 0, discount: 0, total: 0 };

    const subtotal = parseFloat(quantity.price) || 0;

    // Calculate delivery charge based on settings
    let delivery = 0;
    if (deliveryType === 'delivery') {
      // Check if free delivery is enabled for all products
      if (settings.isFreeDeliveryOnAppAllProducts) {
        delivery = 0;
      }
      // Check if order meets free delivery threshold
      else if (settings.freeThressHoldeDeliveryFee && subtotal >= settings.freeThressHoldeDeliveryFee) {
        delivery = 0;
      }
      // Apply base delivery fee
      else {
        delivery = settings.base_delivery_fee || 50;
      }
    }

    // Calculate tax if enabled
    let tax = 0;
    if (settings.isTaxCollect && settings.taxPercetange) {
      tax = (subtotal * settings.taxPercetange) / 100;
    }

    // Calculate discount if coupon applied
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'flat') {
        discount = Math.min(appliedCoupon.discountPercentage, subtotal);
      } else {
        discount = (subtotal * appliedCoupon.discountPercentage) / 100;
        // Apply max discount if specified
        if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
          discount = appliedCoupon.maxDiscount;
        }
      }
    }

    const total = subtotal + tax + delivery - discount;

    return {
      subtotal,
      tax,
      delivery,
      discount,
      total: Math.max(0, total) // Ensure total is not negative
    };
  }, [quantity, settings, deliveryType, appliedCoupon]);

  const validateForm = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!selectedDate) newErrors.date = 'Please select a delivery date';
      if (deliveryType === 'pickup' && !selectedStore) newErrors.store = 'Please select a store';
    } else if (currentStep === 2) {
      if (!petName.trim()) newErrors.petName = 'Please enter your pet\'s name for the cake';

      if (deliveryType === 'delivery') {
        if (isNewAddress) {
          if (!newAddressData.street) newErrors.street = 'Street address is required';
          if (!newAddressData.city) newErrors.city = 'City is required';
          if (!newAddressData.state) newErrors.state = 'State is required';
          if (!newAddressData.zipCode) newErrors.zipCode = 'Zip code is required';
        } else if (!address || address.length === 0) {
          newErrors.address = 'Please add a delivery address';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyCoupon = useCallback((coupon) => {
    setAppliedCoupon(coupon);
    setShowCoupons(false);
  }, []);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [flavourResponse, designResponse, quantityResponse, storesResponse] = await Promise.all([
        fetchFlavours(),
        fetchCakeDesign(),
        fetchQunatity(),
        fetchClinics()
      ]);

      if (flavourResponse && designResponse && quantityResponse && storesResponse) {
        const findFlavour = flavourResponse?.find((f) => f._id === flavourId);
        const findDesign = designResponse?.find((d) => d._id === designId);
        const findQuantity = quantityResponse?.find((q) => q._id === quantityId);
        setFlavour(findFlavour);
        const sortedStores = storesResponse.sort((a, b) => a.Position - b.Position);
        setDesign(findDesign);
        setQuantity(findQuantity);
        setStores(sortedStores);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      setError('Unable to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [flavourId, quantityId, designId]);

  useEffect(() => {
    fetchData();
    if (user) {
      getAddress();
    }


  }, [token]);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setTouched({ ...touched, store: true });
    // Mock distance calculation - in real app, use actual geolocation
    const mockDistance = Math.random() * 10;
    setDeliveryDistance(mockDistance);
  };

  const handleCallStore = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDateConfirm = (date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
    setTouched({ ...touched, date: true });
  };

  const handleAddressSelect = (selectedAddress) => {
    // In a real app, you would select this address from the address list
    setIsNewAddress(false);
  };

  const handleNewAddressChange = (field, value) => {
    setNewAddressData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateForm()) {
        // Animate transition
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          setCurrentStep(2);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }).start();
        });
      }
    } else {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    // Animate transition
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setCurrentStep(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    });
  };

  const processPayment = async (orderData) => {
    try {
      setProcessingPayment(true);

      // Create order on backend
      const response = await axios.post(
        `${API_END_POINT_URL_LOCAL}/api/v1/create-cake-order`,
        orderData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.success) {
        Alert.alert("Error", "Failed to place the order. Please try again.");
        setProcessingPayment(false);
        return;
      }

      const { razorpayKey, razorpayOrderId, amount, bookingId ,booking
        
      } = response.data.payment;

      const options = {
        description: "Pet Cake Order",
        image: "https://i.ibb.co/JjDVTCcG/877c8e22-4df0-4f07-a857-e544208dc0f2.jpg",
        currency: "INR",
        key: razorpayKey,
        amount: Number(amount),
        name: "Doggy World Care",
        order_id: razorpayOrderId,
        prefill: {
          contact: user?.petOwnertNumber || "",
          name: user?.petname || "",
        },
        theme: { color: "#ff4d4d" },
      };

      RazorpayCheckout.open(options)
        .then(async (paymentData) => {
          try {
            const verifyRes = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/booking-verify-payment`, {
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_order_id: paymentData.razorpay_order_id,
              razorpay_signature: paymentData.razorpay_signature,
              bookingId: bookingId,
              type: "cakes",
              fcm: fcmToken || null,
            });

            if (verifyRes.data.success) {
              Alert.alert("Order Confirmed!", "Your cake order has been placed successfully.", [
                {
                  text: "OK",
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: "CakeOrderThankyou", params: { booking: booking } }],
                    });
                  },
                },
              ]);
            } else {
              Alert.alert("Payment Verification Failed", "Please contact support with your payment ID.");
            }
          } catch (verifyError) {
            console.error("Verification Error:", verifyError);
            Alert.alert("Verification Issue", "Your payment was processed, but we could not verify it. Please contact support.");
          } finally {
            setProcessingPayment(false);
          }
        })
        .catch((error) => {
          console.log("Payment Error:", error);
          setProcessingPayment(false);

          if (error.code === "PAYMENT_CANCELLED") {
            Alert.alert("Order Cancelled", "You cancelled the payment process.");
          } else {
            Alert.alert("Payment Failed", "Unable to process payment. Please try again.");
          }
        });

    } catch (error) {
      console.error("Checkout Error:", error);
      Alert.alert("Error", error?.response?.data?.message || "Something went wrong during checkout.");
      setProcessingPayment(false);
    }
  };

  const handleSubmit = async () => {
    setTouched({
      ...touched,
      petName: true
    });
    if (!isLoggedIn) {
      Alert.alert('Please login to place an order');
    }

    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    if (!user) {
      Alert.alert('Please login to place an order');
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();

    let finalAddress = '';

    if (isNewAddress) {
      try {
        const newAddress = await createAddress(newAddressData);
        finalAddress = newAddress?._id;
      } catch (error) {
        Alert.alert('Error', 'Failed to create new address. Please try again.');
        return;
      }
    } else if (address && address.length > 0) {
      const selectedAddress = address[0]?._id; // Use the first address or let user select
      finalAddress = selectedAddress
    }

    const orderData = {
      name: user?.name || '',
      phone: user?.phone || '',
      address: finalAddress,
      petName: petName,
      storeId: selectedStore?._id,
      deliveryDate: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
      Same_Day_delivery: selectedDate
        ? selectedDate.toISOString().split('T')[0] === formattedToday
        : false,
      flavourId: flavourId,
      designId: designId,
      quantityId: quantityId,
      flavour: flavour?.name || "",
      pet_details: user?._id,
      design: design?.name || "",
      quantity: quantity ? `${quantity.weight}` : "",
      price: orderSummary.subtotal,
      deliveryType: deliveryType,
      deliveryCharge: orderSummary.delivery,
      tax: orderSummary.tax,
      discount: orderSummary.discount,
      totalAmount: orderSummary.total,
      couponId: appliedCoupon?._id || null,
      couponCode: appliedCoupon?.code || null,
      fcmToken: fcmToken
    };

    console.log("orderData", orderData)

    Alert.alert(
      'Confirm Order',
      `Delivery Date: ${format(selectedDate, 'PPP')}\nTotal Amount: ₹${orderSummary.total.toFixed(2)}\n${deliveryType === 'delivery' ? 'Delivery Charge: ₹' + orderSummary.delivery : 'Pickup from: ' + selectedStore?.clinicName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed to Payment',
          onPress: () => processPayment(orderData)
        }
      ]
    );
  };

  if (loading || settingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#B32113', '#FF6B6B']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Preparing your order details...</Text>
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
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" />
        <MaterialIcons name="error-outline" size={64} color="#B32113" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#B32113', '#FF6B6B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {currentStep === 2 && (
            <TouchableOpacity onPress={handlePrevStep} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {currentStep === 1 ? 'Delivery Options' : 'Complete Your Order'}
          </Text>
        </View>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.activeStepDot]}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, currentStep === 2 && styles.activeStepDot]}>
            <Text style={[styles.stepNumber, currentStep === 2 && styles.activeStepNumber]}>2</Text>
          </View>
        </View>
      </LinearGradient>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {currentStep === 1 ? (
            <>
              {/* Step 1: Delivery Options */}
              <View style={styles.section}>
                {/* Order Summary */}
                <Text style={styles.sectionTitle}>Your Cake</Text>
                <View style={styles.orderCard}>
                  <Image
                    source={{ uri: flavour?.image?.url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.orderDetails}>
                    <Text style={styles.productName}>{flavour?.name}</Text>
                    <Text style={styles.designName}>Design: {design?.name}</Text>
                    <Text style={styles.quantity}>
                      Size: {quantity?.weight}
                    </Text>
                    <Text style={styles.price}>₹{quantity?.price}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                {/* Delivery Type Selection */}
                <Text style={styles.sectionTitle}>How would you like to get your cake?</Text>
                <View style={styles.deliveryOptions}>
                  <DeliveryOption
                    title="Home Delivery"
                    icon={<MaterialIcons name="delivery-dining" size={24} color={deliveryType === 'delivery' ? "#FFFFFF" : "#B32113"} />}
                    isSelected={deliveryType === 'delivery'}
                    onSelect={() => setDeliveryType('delivery')}
                  />
                  <DeliveryOption
                    title="Store Pickup"
                    icon={<FontAwesome5 name="store" size={20} color={deliveryType === 'pickup' ? "#FFFFFF" : "#B32113"} />}
                    isSelected={deliveryType === 'pickup'}
                    onSelect={() => setDeliveryType('pickup')}
                  />
                </View>
              </View>

              <View style={styles.section}>
                {/* Delivery Date Selection */}
                <Text style={styles.sectionTitle}>When would you like your cake?</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    touched.date && !selectedDate && styles.inputError
                  ]}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <MaterialIcons name="event" size={24} color="#B32113" />
                  <Text style={styles.datePickerText}>
                    {selectedDate
                      ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                      : 'Select delivery date'}
                  </Text>
                </TouchableOpacity>
                {touched.date && !selectedDate && (
                  <Text style={styles.errorText}>Please select a delivery date</Text>
                )}
                <Text style={styles.note}>
                  Note: Orders placed after 3:00 PM will be delivered the next day.
                  Available delivery dates: Next 10 days
                </Text>
              </View>

              {deliveryType === 'pickup' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Select Store for Pickup</Text>
                  <Text style={styles.note}>
                    Choose a store convenient for you to pick up your cake
                  </Text>
                  {stores.map((store) => (
                    <TouchableOpacity
                      key={store._id}
                      style={[
                        styles.storeCard,
                        selectedStore?._id === store._id && styles.selectedStore
                      ]}
                      onPress={() => handleStoreSelect(store)}
                    >
                      <View style={styles.storeHeader}>
                        <Text style={styles.storeName}>{store.clinicName}</Text>
                        <View style={styles.ratingContainer}>
                          <MaterialIcons name="star" size={16} color="#FFD700" />
                          <Text style={styles.rating}>{store.rating}</Text>
                        </View>
                      </View>
                      <Text style={styles.storeAddress}>{store.address}</Text>
                      <Text style={styles.storeTime}>{store?.openTime} AM - {store?.closeTime} PM</Text>
                      <View style={styles.storeActions}>
                        <TouchableOpacity
                          style={styles.callButton}
                          onPress={() => handleCallStore(store.phone)}
                        >
                          <Ionicons name="call" size={20} color="#B32113" />
                          <Text style={styles.callButtonText}>Call Store</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.mapButton}
                          onPress={() => Linking.openURL(store.GMBPRofileLink)}
                        >
                          <MaterialIcons name="location-on" size={20} color="#4A90E2" />
                          <Text style={styles.mapButtonText}>View on Map</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {touched.store && !selectedStore && deliveryType === 'pickup' && (
                    <Text style={styles.errorText}>Please select a store</Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Step 2: Contact Information */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cake Personalization</Text>
                <View style={styles.petNameContainer}>
                  <Text style={styles.inputLabel}>What name should we write on the cake?</Text>
                  <TextInput
                    style={[
                      styles.input,
                      touched.petName && !petName.trim() && styles.inputError
                    ]}
                    placeholder="Enter your pet's name"
                    value={petName}
                    onChangeText={setPetName}
                    maxLength={20}
                  />
                  {touched.petName && !petName.trim() && (
                    <Text style={styles.errorText}>Please enter your pet's name</Text>
                  )}
                  <Text style={styles.petNameHint}>
                    This name will be written on your pet's cake
                  </Text>
                </View>
              </View>

              {deliveryType === 'delivery' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Delivery Address</Text>

                  {!addressLoading && address && address.length > 0 && !isNewAddress ? (
                    <>
                      <Text style={styles.subsectionTitle}>Your Address</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.addressesContainer}>
                        {address.map((addr, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[styles.addressCard, index === 0 && styles.selectedAddressCard]}
                            onPress={() => handleAddressSelect(addr)}
                          >
                            <MaterialIcons
                              name="location-on"
                              size={24}
                              color={index === 0 ? "#FFFFFF" : "#B32113"}
                            />
                            <Text style={[styles.addressCardTitle, index === 0 && styles.selectedAddressCardText]}>
                              {addr.street}
                            </Text>
                            <Text style={[styles.addressCardSubtitle, index === 0 && styles.selectedAddressCardText]}>
                              {addr.city}, {addr.state} {addr.zipCode}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <TouchableOpacity
                        style={styles.newAddressButton}
                        onPress={() => setIsNewAddress(true)}
                      >
                        <Feather name="plus" size={18} color="#B32113" />
                        <Text style={styles.newAddressButtonText}>Add New Address</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View style={styles.form}>
                      <Text style={styles.subsectionTitle}>
                        {isNewAddress ? "New Address" : "Add Delivery Address"}
                      </Text>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Street Address</Text>
                        <TextInput
                          style={[
                            styles.input,
                            touched.street && !newAddressData.street && styles.inputError
                          ]}
                          placeholder="Street address"
                          value={newAddressData.street}
                          onChangeText={(text) => handleNewAddressChange('street', text)}
                        />
                      </View>

                      <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                          <Text style={styles.inputLabel}>City</Text>
                          <TextInput
                            style={[
                              styles.input,
                              touched.city && !newAddressData.city && styles.inputError
                            ]}
                            placeholder="City"
                            value={newAddressData.city}
                            onChangeText={(text) => handleNewAddressChange('city', text)}
                          />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>State</Text>
                          <TextInput
                            style={[
                              styles.input,
                              touched.state && !newAddressData.state && styles.inputError
                            ]}
                            placeholder="State"
                            value={newAddressData.state}
                            onChangeText={(text) => handleNewAddressChange('state', text)}
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Zip Code</Text>
                        <TextInput
                          style={[
                            styles.input,
                            touched.zipCode && !newAddressData.zipCode && styles.inputError
                          ]}
                          placeholder="Zip code"
                          value={newAddressData.zipCode}
                          keyboardType="numeric"
                          onChangeText={(text) => handleNewAddressChange('zipCode', text)}
                        />
                      </View>

                      {address && address.length > 0 && (
                        <TouchableOpacity
                          style={styles.useExistingButton}
                          onPress={() => setIsNewAddress(false)}
                        >
                          <Text style={styles.useExistingButtonText}>Use Existing Address</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Coupons Section */}
              <View style={styles.couponsContainer}>
                <Text style={styles.sectionTitle}>Apply Coupon</Text>

                {appliedCoupon ? (
                  <View style={styles.appliedCouponContainer}>
                    <View style={styles.appliedCouponContent}>
                      <View style={styles.couponBadge}>
                        <MaterialIcons name="local-offer" size={18} color="#fff" />
                      </View>
                      <View style={styles.appliedCouponDetails}>
                        <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                        <Text style={styles.appliedCouponDescription}>
                          {appliedCoupon.discountType === 'flat'
                            ? `₹${appliedCoupon.discountPercentage} off`
                            : `${appliedCoupon.discountPercentage}% off`}
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

                {showCoupons && (!coupons || coupons.length === 0) && !couponsLoading && (
                  <View style={styles.noCouponsContainer}>
                    <MaterialIcons name="info-outline" size={24} color="#B32113" />
                    <Text style={styles.noCouponsText}>No coupons available at the moment</Text>
                  </View>
                )}
              </View>

              {/* Order Summary */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cake:</Text>
                    <Text style={styles.summaryValue}>{flavour?.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Design:</Text>
                    <Text style={styles.summaryValue}>{design?.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Size:</Text>
                    <Text style={styles.summaryValue}>{quantity?.weight}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date:</Text>
                    <Text style={styles.summaryValue}>{selectedDate ? format(selectedDate, 'PPP') : 'Not selected'}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Method:</Text>
                    <Text style={styles.summaryValue}>{deliveryType === 'delivery' ? 'Home Delivery' : 'Store Pickup'}</Text>
                  </View>
                  {deliveryType === 'pickup' && selectedStore && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Store:</Text>
                      <Text style={styles.summaryValue}>{selectedStore.clinicName}</Text>
                    </View>
                  )}
                  {petName && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Name on Cake:</Text>
                      <Text style={styles.summaryValue}>{petName}</Text>
                    </View>
                  )}
                  <View style={styles.divider} />

                  {/* Price breakdown */}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cake Price:</Text>
                    <Text style={styles.summaryValue}>₹{orderSummary.subtotal.toFixed(2)}</Text>
                  </View>

                  {orderSummary.tax > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tax ({settings.taxPercetange}%):</Text>
                      <Text style={styles.summaryValue}>₹{orderSummary.tax.toFixed(2)}</Text>
                    </View>
                  )}

                  {deliveryType === 'delivery' && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                      <Text style={styles.summaryValue}>
                        {orderSummary.delivery === 0 ? (
                          <Text style={styles.freeDeliveryText}>FREE</Text>
                        ) : (
                          `₹${orderSummary.delivery.toFixed(2)}`
                        )}
                      </Text>
                    </View>
                  )}

                  {orderSummary.discount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Discount:</Text>
                      <Text style={styles.discountValue}>-₹{orderSummary.discount.toFixed(2)}</Text>
                    </View>
                  )}

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, styles.totalLabel]}>Total:</Text>
                    <Text style={[styles.summaryValue, styles.totalValue]}>
                      ₹{orderSummary.total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
        minimumDate={deliveryDateRange.minDate}
        maximumDate={deliveryDateRange.maxDate}
      />


      {isLoggedIn ? (
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleNextStep}
            disabled={processingPayment}
          >
            <LinearGradient
              colors={['#B32113', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {processingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {currentStep === 1 ? 'Continue' : 'Proceed to Payment'}
                    {currentStep === 2 && ` • ₹${orderSummary.total.toFixed(2)}`}
                  </Text>
                  <MaterialIcons name={currentStep === 1 ? "arrow-forward" : "payment"} size={24} color="#FFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: buttonScale }] }]}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => navigation.navigate('login')}
            disabled={processingPayment}
          >
            <LinearGradient
              colors={['#B32113', '#FF6B6B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {processingPayment ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {currentStep === 1 ? 'Continue' : 'Login to Payment'}
                    {currentStep === 2 && ` • ₹${orderSummary.total.toFixed(2)}`}
                  </Text>
                  <MaterialIcons name={currentStep === 1 ? "arrow-forward" : "payment"} size={24} color="#FFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: '#FFFFFF',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeStepNumber: {
    color: '#B32113',
  },
  stepLine: {
    height: 2,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  section: {
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 10,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F8',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 15,
  },
  orderDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
  },
  designName: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#B32113',
    marginTop: 8,
  },
  deliveryOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deliveryOption: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE5E5',
  },
  selectedDeliveryOption: {
    borderColor: '#B32113',
    backgroundColor: '#B32113',
  },
  deliveryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedDeliveryIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  deliveryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 5,
  },
  selectedDeliveryOptionText: {
    color: '#FFFFFF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#B32113',
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: '#FFFFFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  datePickerButton: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  datePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2D3436',
  },
  note: {
    fontSize: 14,
    color: '#636E72',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 10,
  },
  storeCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  selectedStore: {
    borderWidth: 2,
    borderColor: '#B32113',
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    marginLeft: 4,
    color: '#FFB800',
    fontWeight: '600',
  },
  storeAddress: {
    fontSize: 14,
    color: '#636E72',
    marginBottom: 4,
  },
  storeTime: {
    fontSize: 14,
    color: '#B32113',
    marginBottom: 10,
  },
  storeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  callButtonText: {
    marginLeft: 8,
    color: '#B32113',
    fontWeight: '500',
  },
  mapButtonText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontWeight: '500',
  },
  petNameContainer: {
    marginBottom: 15,
  },
  petNameHint: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 5,
    fontStyle: 'italic',
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 5,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  addressesContainer: {
    width: "100%",
    marginBottom: 15,
  },
  addressCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 16,
    padding: 15,
    marginRight: 10,
    width: width * 0.8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  selectedAddressCard: {
    backgroundColor: '#B32113',
    borderColor: '#B32113',
  },
  addressCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 5,
    textAlign: 'center',
  },
  addressCardSubtitle: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 3,
    textAlign: 'center',
  },
  selectedAddressCardText: {
    color: '#FFFFFF',
  },
  newAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 16,
    marginBottom: 15,
  },
  newAddressButtonText: {
    color: '#B32113',
    fontWeight: '500',
    marginLeft: 8,
  },
  useExistingButton: {
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B32113',
    borderRadius: 16,
    marginTop: 5,
  },
  useExistingButtonText: {
    color: '#B32113',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#636E72',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFE5E5',
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B32113',
  },
  freeDeliveryText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
  },
  buttonContainer: {
    padding: 15,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
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
  couponsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 15,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  couponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: '#FFF8F8',
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
    borderColor: '#FFE5E5',
    borderRadius: 16,
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
    borderRadius: 12,
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
    borderRadius: 16,
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
  noCouponsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 10,
  },
  noCouponsText: {
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});