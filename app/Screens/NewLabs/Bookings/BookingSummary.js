import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

const BookingSummary = ({ 
  service, 
  selectedDate, 
  selectedTime, 
  selectedLocation, 
  selectedAddress, 
  selectedClinic,
  appliedCoupon,
  totalAmount,
  discountAmount = 0
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Summary</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Service:</Text>
        <Text style={styles.value}>{service?.title || 'Lab Test'}</Text>
      </View>
      
      {selectedDate && (
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Text>
        </View>
      )}
      
      {selectedTime && (
        <View style={styles.row}>
          <Text style={styles.label}>Time:</Text>
          <Text style={styles.value}>{selectedTime}</Text>
        </View>
      )}
      
      <View style={styles.row}>
        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{selectedLocation === 'Home' ? 'Home Visit' : 'Clinic Visit'}</Text>
      </View>
      
      {selectedLocation === 'Home' && selectedAddress && (
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>
            {`${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.zipCode}`}
          </Text>
        </View>
      )}
      
      {selectedLocation === 'Clinic' && selectedClinic && (
        <View style={styles.row}>
          <Text style={styles.label}>Clinic:</Text>
          <Text style={styles.value}>{selectedClinic.clinicName}</Text>
        </View>
      )}
      
      <View style={styles.divider} />
      
      <View style={styles.row}>
        <Text style={styles.label}>Base Price:</Text>
        <Text style={styles.value}>₹{service?.price || 0}</Text>
      </View>
      
      {discountAmount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>Discount:</Text>
          <Text style={styles.discountValue}>-₹{discountAmount}</Text>
        </View>
      )}
      
      {appliedCoupon && (
        <View style={styles.row}>
          <Text style={styles.label}>Coupon ({appliedCoupon.code}):</Text>
          <Text style={styles.discountValue}>
            {appliedCoupon.discountType === 'Percentage'
              ? `-${appliedCoupon.discountPercentage}%`
              : `-₹${appliedCoupon.discountPercentage}`}
          </Text>
        </View>
      )}
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalValue}>₹{totalAmount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  discountValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4d4d',
  }
});

export default BookingSummary;
