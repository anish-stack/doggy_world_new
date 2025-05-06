import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Linking,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchCakeDesign, fetchFlavours, fetchQunatity, fetchClinics } from './utils';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format, addDays, isAfter, setHours, setMinutes, } from 'date-fns';
import { getUser } from '../../../../hooks/getUserHook';
import axios from 'axios';

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
  const { user, getUserFnc } = getUser()
  const navigation = useNavigation()
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: '',
    houseNo: '',
    landmark: '',
    pincode: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
    pincode: false,
    date: false
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


  const validateForm = () => {
    const newErrors = {};
    if (!deliveryInfo.name) newErrors.name = 'Name is required';
    if (!deliveryInfo.phone) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\d{7,15}$/.test(deliveryInfo.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!deliveryInfo.address) newErrors.address = 'Address is required';
    if (!deliveryInfo.landmark) newErrors.landmark = 'Landmark is required';
    if (!deliveryInfo.houseNo) newErrors.houseNo = 'House No is required';

    if (!deliveryInfo.pincode) {
      newErrors.pincode = 'Pincode is required';
    }
    if (!selectedStore) newErrors.store = 'Please select a store';
    if (!selectedDate) newErrors.date = 'Please select a delivery date';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
        const findFlavour = flavourResponse?.find((f) => f.documentId === flavourId);
        const findDesign = designResponse?.find((d) => d.documentId === designId);
        const findQuantity = quantityResponse?.find((q) => q.documentId === quantityId);
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
  }, [fetchData]);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    // Mock distance calculation - in real app, use actual geolocation
    const mockDistance = Math.random() * 10;
    setDeliveryDistance(mockDistance);
    setDeliveryCharge(mockDistance <= 5 ? 0 : Math.round(mockDistance * 10));
  };

  const handleCallStore = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDateConfirm = (date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
    setTouched({ ...touched, date: true });
  };

  const handleSubmit = async () => {
    setTouched({
      name: true,
      phone: true,
      address: true,
      pincode: true,
      date: true,
      houseNo: true,
      landmark: true
    });

    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    if (!user) {
      Alert.alert('Please login to place an order');
      return;
    }

    const data_send = {
      name: deliveryInfo.name,
      phone: deliveryInfo.phone,
      address: deliveryInfo.address,
      houseNo: deliveryInfo.houseNo,
      landmark: deliveryInfo.landmark,
      pincode: deliveryInfo.pincode,
      storeId: selectedStore?.documentId,
      deliveryDate: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
      Same_Day_delivery: selectedDate
        ? selectedDate.toISOString().split('T')[0] === formattedToday
        : false,
      flavour: flavour?.name || "",
      pet_details: user,
      design: design?.name || "",
      quantity: quantity ? `${quantity.label}/${quantity.type_of_qunatity}` : "",
      price: quantity?.price || 0,
    };

    console.log('Sending Order Data:', data_send);

    if (validateForm()) {
      Alert.alert(
        'Confirm Order',
        `Delivery Date: ${format(selectedDate, 'PPP')}\nTotal Amount: ₹${parseInt(quantity?.price) + deliveryCharge}\nDelivery Charge: Confirmed By Store On Call After Order Placement`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Place Order',
            onPress: async () => {
              try {
                const API = `https://admindoggy.adsdigitalmedia.com/api/create_cake_order`;
                const response = await axios.post(API, data_send, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                console.log('Order Response:', response.data);

                if (response.status === 201 || response.status === 200) {
                  Alert.alert('Success', 'Your order has been placed successfully.');
                  navigation.navigate('Order_Confirmation', {
                    data: response.data.order
                  })
                } else {
                  Alert.alert('Error', 'Something went wrong. Please try again.');
                }
              } catch (error) {
                console.error('Order Submission Error:', error);
                Alert.alert('Error', 'Failed to place the order. Please check your network and try again.');
              }
            }
          }
        ]
      );
    }
  };

  const handleInputChange = (field, value) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B32113" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
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
      <LinearGradient
        colors={['#B32113', '#FF6B6B']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Complete Your Order 🎂</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
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
                Size: {quantity?.label}{quantity?.type_of_qunatity}
              </Text>
              <Text style={styles.price}>₹{quantity?.price}</Text>
            </View>
          </View>
        </View>

        {/* Delivery Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Delivery Date</Text>
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
                ? format(selectedDate, 'PPP')
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

        {/* Store Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Nearest Store</Text>
          <Text style={styles.note}>
            For urgent orders, you can call the store directly
          </Text>
          {stores.map((store) => (
            <TouchableOpacity
              key={store.documentId}
              style={[
                styles.storeCard,
                selectedStore?.documentId === store.documentId && styles.selectedStore
              ]}
              onPress={() => handleStoreSelect(store)}
            >
              <View style={styles.storeHeader}>
                <Text style={styles.storeName}>{store.clinic_name}</Text>
                <View style={styles.ratingContainer}>
                  <MaterialIcons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>{store.Rating}</Text>
                </View>
              </View>
              <Text style={styles.storeAddress}>{store.Address}</Text>
              <Text style={styles.storeTime}>9:00 AM - 6:00 PM</Text>
              <View style={styles.storeActions}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCallStore(store.contact_details)}
                >
                  <Ionicons name="call" size={20} color="#B32113" />
                  <Text style={styles.callButtonText}>Call Store</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => Linking.openURL(store.Map_Location)}
                >
                  <MaterialIcons name="location-on" size={20} color="#4A90E2" />
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
          {touched.store && !selectedStore && (
            <Text style={styles.errorText}>Please select a store</Text>
          )}
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          {selectedStore && (
            <View style={styles.deliveryInfo}>
              <Text style={styles.note}>
                Note: Free delivery within 5km. ₹10 per km charge applies beyond 5km.
              </Text>
            </View>
          )}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.input,
                  touched.name && !deliveryInfo.name && styles.inputError
                ]}
                placeholder="Full Name"
                value={deliveryInfo.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
              {touched.name && !deliveryInfo.name && (
                <Text style={styles.errorText}>Name is required</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.input,
                  touched.phone && errors.phone && styles.inputError
                ]}
                placeholder="Phone Number"
                value={deliveryInfo.phone}
                keyboardType="phone-pad"
                onChangeText={(text) => handleInputChange('phone', text)}
              />
              {touched.phone && errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[
                  styles.input,
                  touched.address && !deliveryInfo.address && styles.inputError
                ]}
                placeholder="Delivery Address"
                value={deliveryInfo.address}
                multiline
                onChangeText={(text) => handleInputChange('address', text)}
              />
              {touched.address && !deliveryInfo.address && (
                <Text style={styles.errorText}>Address is required</Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="House/Flat No."
                  value={deliveryInfo.houseNo}
                  onChangeText={(text) => handleInputChange('houseNo', text)}
                />
                {touched.houseNo && errors.houseNo && (
                  <Text style={styles.errorText}>{errors.houseNo}</Text>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <TextInput
                  style={[
                    styles.input,
                    touched.pincode && errors.pincode && styles.inputError
                  ]}
                  placeholder="Pincode"
                  value={deliveryInfo.pincode}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange('pincode', text)}
                />
                {touched.pincode && errors.pincode && (
                  <Text style={styles.errorText}>{errors.pincode}</Text>
                )}
              </View>
            </View>
            {touched.landmark && errors.landmark && (
              <Text style={styles.errorText}>{errors.landmark}</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="Landmark (Optional)"
              value={deliveryInfo.landmark}
              onChangeText={(text) => handleInputChange('landmark', text)}
            />

          </View>
        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
        minimumDate={deliveryDateRange.minDate}
        maximumDate={deliveryDateRange.maxDate}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>
          Place Order • ₹{(parseInt(quantity?.price) + deliveryCharge).toFixed(2)}
        </Text>
      </TouchableOpacity>
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
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 5,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
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
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  orderDetails: {
    flex: 1,
    marginLeft: 15,
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
  datePickerButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFE6E9',
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
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
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
  deliveryInfo: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  deliveryDistance: {
    fontSize: 16,
    color: '#2D3436',
    marginBottom: 5,
  },
  deliveryCharge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B32113',
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DFE6E9',
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
  submitButton: {
    backgroundColor: '#B32113',
    margin: 15,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'start',
    alignItems: 'start',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#B32113',
    textAlign: 'start',
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