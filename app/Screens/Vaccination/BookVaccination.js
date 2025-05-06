import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function BookVaccination() {
  const route = useRoute();
  const navigation = useNavigation();
  const { details } = route.params || {};

  const handleGoHome = () => {
    navigation.navigate('Home'); // Replace 'Home' with your actual home screen name
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Thank You for Booking!</Text>
      <Text style={styles.subtitle}>
        Your appointment has been successfully booked. Below are your booking details:
      </Text>

      {/* Booking Details */}
      <View style={styles.detailsCard}>
        <Text style={styles.detailItem}>
          <Text style={styles.label}>Pet Name: </Text>
          {details?.petName || 'N/A'}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.label}>Contact Number: </Text>
          {details?.contactNumber || 'N/A'}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.label}>Date: </Text>
          {new Date(details?.date).toDateString() || 'N/A'}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.label}>Service Title: </Text>
          {details?.ServiceTitle || 'N/A'}
        </Text>
        <Text style={styles.detailItem}>
          <Text style={styles.label}>Type of Booking: </Text>
          {details?.TypeOfBooking || 'N/A'}
        </Text>
        {details?.clinicName && (

        <Text style={styles.detailItem}>
          <Text style={styles.label}>Clinic Name: </Text>
          {details?.clinicName || 'N/A'}
        </Text>
        )}
        <Text style={styles.detailItem}>
          <Text style={styles.label}>Clinic Price: </Text>
          ₹{details?.ClinicPrice || '0'}
        </Text>
        {/* {details?.TypeOfBooking === 'Home'} */}
        {details?.TypeOfBooking === 'Home' && details.HomePriceOfPackageDiscount > 0 && (
          <Text style={styles.detailItem}>
            <Text style={styles.label}>Home Price (Discounted): </Text>
            ₹{details?.HomePriceOfPackageDiscount || '0'}
          </Text>
        )}
      </View>

      {/* Home Button */}
      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
        <Text style={styles.homeButtonText}>Go to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003873',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  detailItem: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    color: '#003873',
  },
  homeButton: {
    backgroundColor: '#003873',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
