import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,

} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import UpperLayout from '../../layouts/UpperLayout';
import { AllLabTestsRemove, RemoveLabTest } from '../../redux/slice/labTestCart';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './Styls';
import ClinicCard from './ClinicCard';
import PriceSummary from './PriceSummary';
import TimingSelection from './TimingSelection';
import CartItem from './CartItem';
import EmpetyCart from './EmpetyCart';
import Checkbox from 'expo-checkbox';
import { getUser } from '../../hooks/getUserHook';
import CartHeader from '../../components/CartHeader/CartHeader';

export default function SuperficialCart() {
  const { labTests } = useSelector((state) => state.labCart) || [];
  const dispatch = useDispatch();
  const [isChecked, setChecked] = useState(false);
  const { user, getUserFnc } = getUser()
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOffers();
    fetchClinics();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data } = await axios.get('https://admindoggy.adsdigitalmedia.com/api/offers?populate=*');
      if (data?.data?.length) {
        setOffers(data.data);
      }
    } catch (err) {
      setError('Error loading offers');
    }
  };

  const fetchClinics = async () => {
    try {
      const { data } = await axios.get('https://admindoggy.adsdigitalmedia.com/api/clinics?populate=images');
      setClinics(data.data);
    } catch (err) {
      setError('Error loading clinics');
    }
  };

  const handleRemove = (id) => {
    dispatch(RemoveLabTest({ testIdToRemove: id }));
  };

  const totalPrice = labTests.reduce((total, item) => total + parseFloat(item.test_price), 0);
  const totalDiscount = labTests.reduce(
    (total, item) => total + (parseFloat(item.test_price) - parseFloat(item.discountPrice)),
    0
  );
  const payableAmount = totalPrice - totalDiscount - (selectedOffer?.upto_off || 0);

  const handleSelectClinic = (clinic) => {
    setSelectedClinic(clinic);
  };
  // console.log(user)
  const handleConfirmBooking = async () => {
    if (!selectedClinic) {
      Alert.alert('Error', 'Please select a clinic');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }
    setLoading(true)
    const Booking_data = {
      clinic: selectedClinic,
      time: selectedTime,
      test: labTests,
      isChecked,
      offer: selectedOffer,
      totalPrice,
      totalDiscount,
      payableAmount,
      user_id: user || getUserFnc(),
      booking_date: new Date(),

    }

    try {
      const { data } = await axios.post('https://admindoggy.adsdigitalmedia.com/api/make-order-lab-vacination', Booking_data)
      Alert.alert("Booking Complete", "Thankyou For Booking From Doggy World ...")
      setLoading(false)
    } catch (error) {
      console.log(error.response.data)
      Alert.alert("Booking failed", error.response.data.message)
      setLoading(false)
    }


    dispatch(AllLabTestsRemove())
    navigation.reset({
      index: 1,
      routes: [
        {
          name: 'Booking_Test_Confirm',
          params: { data: JSON.stringify(Booking_data) },
        },
      ],
    });
    Alert.alert('Success', 'Booking confirmed for ' + selectedTime);
  };

  if (!labTests?.length) {
    return <EmpetyCart />
  }
  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#D92D20" />
    </View>
  }

  const isAnyTestUltrasound = labTests.some(test => test.isUltraSound);

  return (
    <SafeAreaView style={styles.container}>
      <CartHeader />
      {/* <UpperLayout title="Lab Cart" /> */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        <View style={styles.sectionContainer}>
          <FlatList
            data={labTests}
            keyExtractor={(item) => item.documentId}
            renderItem={({ item }) => (
              <CartItem item={item} onRemove={handleRemove} />
            )}
            scrollEnabled={false}
          />
        </View>


        {offers.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Available Offers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {offers.map((offer) => (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <Text style={styles.offerCode}>{offer.Code}</Text>
                    <TouchableOpacity
                      style={[
                        styles.applyButton,
                        selectedOffer?.id === offer.id && styles.appliedButton
                      ]}
                      onPress={() => setSelectedOffer(offer)}
                    >
                      <Text style={[
                        styles.applyButtonText,
                        selectedOffer?.id === offer.id && styles.appliedButtonText
                      ]}>
                        {selectedOffer?.id === offer.id ? 'Applied' : 'Apply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.offerDetails}>
                    Min Order: ₹{offer.minimum_amount} | Upto ₹{offer.upto_off} off
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Home Collection Banner */}
        {!isAnyTestUltrasound && (
          <View>

            <View style={styles.homeCollectionBanner}>
              <Image
                source={require("./blood-test (1).png")}
                style={styles.homeCollectionIcon}
              />
              <View style={styles.homeCollectionTextContainer}>
                <Text style={styles.homeCollectionTitle}>
                  Home Collection Available
                </Text>
                <Text style={styles.homeCollectionSubtitle}>
                  Get your tests done from the comfort of your home
                </Text>
              </View>
            </View>
            <View style={styles.containers}>
              <View style={styles.section}>
                <Checkbox
                  style={styles.checkbox}
                  value={isChecked}
                  onValueChange={setChecked}
                  color={isChecked ? '#4630EB' : undefined}
                />
                <Text style={styles.text}>
                  Are You Want Home Collection For Those Vaccination and Test
                </Text>
              </View>
            </View>
          </View>
        )}



        {/* Clinics Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isChecked ? 'Choose a Nearby Clinic for Your Convenience' : 'Select a Clinic'}
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={clinics}
            keyExtractor={(item) => item.documentId}
            renderItem={({ item }) => (
              <ClinicCard
                test={labTests}
                clinic={item}
                selected={selectedClinic?.id === item.id}
                onSelect={handleSelectClinic}
              />
            )}
          />
        </View>

        {/* Timing Selection */}
        {selectedClinic && (
          <TimingSelection
            test={labTests}
            selectedClinic={selectedClinic}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
          />
        )}


        <PriceSummary
          totalPrice={totalPrice}
          totalDiscount={totalDiscount}
          selectedOffer={selectedOffer}
          payableAmount={payableAmount}
        />
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedClinic || !selectedTime) && styles.disabledButton
          ]}
          disabled={!selectedClinic || !selectedTime}
          onPress={handleConfirmBooking}
        >
          <Text style={styles.confirmButtonText}>
            {!selectedClinic
              ? 'Select a Clinic to Continue'
              : !selectedTime
                ? 'Select Time Slot'
                : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

