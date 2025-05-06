import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Animated } from 'react-native';
import React, { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';

export default function BookingConfirmation({ route, navigation }) {
  const [pan] = useState(new Animated.ValueXY());
  const [dataBooked, setDataBooked] = useState({});
  const [loading, setLoading] = useState(false);
  const { data } = route.params || {};

  useEffect(() => {
    setLoading(true);
    if (data) {
      const parsedData = JSON.parse(data);
      setDataBooked(parsedData);
      setLoading(false);
    }
  }, [data]);

  const handleOpenMap = () => {
    if (dataBooked?.clinic?.Map_Location) {
      Linking.openURL(dataBooked.clinic.Map_Location);
    }
  };

  const handleCall = () => {
    if (dataBooked?.clinic?.contact_details) {
      Linking.openURL(`tel:${dataBooked.clinic.contact_details}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={60} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Booking Confirmed!</Text>
          <Text style={styles.headerSubtitle}>
            {moment(dataBooked?.booking_date).format('DD MMM YYYY, hh:mm A')}
          </Text>
        </View>

        {/* Clinic Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinic Details</Text>
          <View style={styles.clinicCard}>
            <Text style={styles.clinicName}>{dataBooked?.clinic?.clinic_name}</Text>
            <Text style={styles.clinicAddress}>{dataBooked?.clinic?.Address}</Text>
            <Text style={styles.clinicTime}>{dataBooked?.clinic?.time}</Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.mapButton} onPress={handleOpenMap}>
                <MaterialIcons name="location-on" size={24} color="#fff" />
                <Text style={styles.buttonText}>View Map</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <MaterialIcons name="phone" size={24} color="#fff" />
                <Text style={styles.buttonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Tests Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booked Tests</Text>
          {dataBooked?.test?.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <View style={styles.testHeader}>
                <Text style={styles.testName}>{test.test_name}</Text>
                {test.isUltraSound && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Imaging</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.discountPrice}>₹{test.discountPrice}</Text>
                <Text style={styles.originalPrice}>₹{test.test_price}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Price</Text>
              <Text style={styles.summaryValue}>₹{dataBooked?.totalPrice}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.discountText}>-₹{dataBooked?.totalDiscount}</Text>
            </View>
            {dataBooked?.offer && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Offer ({dataBooked.offer.Code})</Text>
                <Text style={styles.discountText}>-₹{dataBooked.offer.upto_off}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Final Amount</Text>
              <Text style={styles.totalValue}>₹{dataBooked?.payableAmount}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#B21D1D',
    padding: 30,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#E8F5E9',
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  clinicCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  clinicAddress: {
    fontSize: 15,
    color: '#424242',
    marginBottom: 8,
    lineHeight: 22,
  },
  clinicTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B21D1D',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  testCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  testName: {
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '500',
    flex: 1,
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#424242',
    fontWeight: '500',
  },
  discountText: {
    fontSize: 15,
    color: '#B21D1D',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B21D1D',
  },
  homeButton: {
    backgroundColor: '#B21D1D',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});