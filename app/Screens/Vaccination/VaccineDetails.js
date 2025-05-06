import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView,
  Modal,
  RefreshControl,

  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import styles from './VStyles';
import { useDispatch } from 'react-redux';
import { AddingStart, AddingSuccess } from '../../redux/slice/labTestCart';



export default function VaccineDetails() {
  const dispatch = useDispatch();
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInCart, setIsInCart] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, []);

  const fetchData = async () => {
    if (!id) {
      setError('No vaccination ID provided.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://admindoggy.adsdigitalmedia.com/api/vaccinations?filters[documentId][$eq]=${id}&populate=*`
      );
      setData(response.data.data[0] || null);
      setError('');
    } catch (err) {
      setError('Failed to fetch vaccination details. Pull down to refresh.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleAddToCart = async () => {
    if (data?.isPackage) {
      setShowModal(true);
      return;
    }

    try {
      setAddingToCart(true);
      const cartItem = {
        documentId: data.documentId,
        test_name: data.title,
        isUltraSound: false,
        serviceType: 'Clinic',
        imageUrl: data.image?.url,
        discountPrice: data.discount_price,
        test_price: data.price,
      };

      dispatch(AddingStart());
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      dispatch(AddingSuccess([cartItem]));
      setIsInCart(true);
      showNotification('Successfully added to cart!', 'success');
    } catch (err) {
      showNotification('Failed to add to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const confirmAddToCart = async () => {
    if (!selectedOption) {
      showNotification('Please select a service type', 'error');
      return;
    }

    try {
      setAddingToCart(true);
      const cartItem = {
        documentId: data.documentId,
        test_name: data.title,
        isUltraSound: false,
        serviceType: selectedOption,
        imageUrl: data.image?.url,
        discountPrice:
          selectedOption === "Clinic"
            ? data.discount_price
            : data.HomePriceOfPackageDiscount,
        test_price:
          selectedOption === "Clinic" ? data.price : data.HomePriceOfPackage,
      };

      dispatch(AddingStart());
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      dispatch(AddingSuccess([cartItem]));
      setIsInCart(true);
      setShowModal(false);
      showNotification('Successfully added to cart!', 'success');
    } catch (err) {
      showNotification('Failed to add to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    Animated.sequence([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [250, 100],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [100, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#FFF" />
      </TouchableOpacity>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.Image
          source={{
            uri: data?.image?.url || 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800'
          }}
          style={[styles.headerImage, { opacity: imageOpacity }]}
        />
        <Animated.Text
          style={[styles.headerTitle, { opacity: headerTitleOpacity }]}
          numberOfLines={1}
        >
          {data?.title}
        </Animated.Text>

      </Animated.View>

      {error ? (
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-circle" size={50} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6C63FF"
              colors={['#6C63FF']}
            />
          }
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{data?.title}</Text>
            <Text style={styles.forage}>Recommended for age: {data?.forage}</Text>

            <View style={styles.priceContainer}>
              <View style={styles.priceWrapper}>
                <Text style={styles.price}>₹{data?.discount_price}</Text>
                <Text style={styles.strikePrice}>₹{data?.price}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {Math.round((1 - data?.discount_price / data?.price) * 100)}% OFF
                </Text>
              </View>
            </View>

            <View style={styles.vaccineListContainer}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="syringe" size={18} color="#6C63FF" /> Vaccinations Included
              </Text>
              {data?.name?.map((item, index) => (
                <View key={index} style={styles.vaccineItem}>
                  <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                  <Text style={styles.vaccineName}>{item.vaccine_name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="info" size={18} color="#6C63FF" /> Information
              </Text>
              <Text style={styles.description}>{data?.small_dsec}</Text>
            </View>
          </View>
        </Animated.ScrollView>
      )}

      {!error && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.addToCartButton,
              isInCart && styles.addedToCartButton,
              addingToCart && styles.loadingButton
            ]}
            onPress={handleAddToCart}
            disabled={isInCart || addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.addToCartText}>
                  {isInCart ? 'Added to Cart' : 'Add to Cart'}
                </Text>
                <MaterialIcons
                  name={isInCart ? "check-circle" : "shopping-cart"}
                  size={24}
                  color="white"
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        transparent
        visible={showModal}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Type</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === "Clinic" && styles.selectedOption
              ]}
              onPress={() => setSelectedOption("Clinic")}
            >
              <MaterialIcons name="local-hospital" size={24} color={selectedOption === "Clinic" ? "#FFF" : "#666"} />
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionTitle,
                  selectedOption === "Clinic" && styles.selectedOptionText
                ]}>
                  Clinic Visit
                </Text>
                <Text style={[
                  styles.optionPrice,
                  selectedOption === "Clinic" && styles.selectedOptionText
                ]}>
                  ₹{data?.discount_price}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === "Home Vaccination" && styles.selectedOption
              ]}
              onPress={() => setSelectedOption("Home Vaccination")}
            >
              <MaterialIcons name="home" size={24} color={selectedOption === "Home Vaccination" ? "#FFF" : "#666"} />
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionTitle,
                  selectedOption === "Home Vaccination" && styles.selectedOptionText
                ]}>
                  Home Vaccination
                </Text>
                <Text style={[
                  styles.optionPrice,
                  selectedOption === "Home Vaccination" && styles.selectedOptionText
                ]}>
                  ₹{data?.HomePriceOfPackageDiscount}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedOption && styles.disabledButton
              ]}
              onPress={confirmAddToCart}
              disabled={!selectedOption || addingToCart}
            >
              {addingToCart ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.confirmText}>Confirm Selection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Animated.View
        style={[
          styles.notification,
          { opacity: notificationOpacity }
        ]}
      >
        <MaterialIcons name="check-circle" size={24} color="#FFF" />
        <Text style={styles.notificationText}>Added to cart successfully!</Text>
      </Animated.View>
    </SafeAreaView>
  );
}