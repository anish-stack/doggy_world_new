import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_END_POINT_URL_LOCAL } from '../../../constant/constant';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ViewLabDetails({ navigation, route }) {
  const { booking } = route.params || {};
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bottom sheet states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  
  // Reschedule states
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Selected booking for actions
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Bottom sheet refs
  const cancelSheetRef = useRef(null);
  const rescheduleSheetRef = useRef(null);

  // Fetch lab booking details
  const fetchLabBookingDetails = useCallback(async () => {
    if (!booking?._id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_END_POINT_URL_LOCAL}/api/v1/lab-booking?id=${booking?._id}`
      );
      
      if (response.data.success) {
        setBookingDetails(response.data.data.booking);
        setSelectedBooking(response.data.data.booking);
      } else {
        setError("Failed to fetch booking details");
      }
    } catch (error) {
      console.log("Error fetching lab details:", error);
      setError(error.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [booking]);

  useEffect(() => {
    fetchLabBookingDetails();
  }, [fetchLabBookingDetails]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLabBookingDetails();
  }, [fetchLabBookingDetails]);

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBooking?._id) return;
    
    setIsSubmitting(true);
    try {
      const response = await axios.put(
        `${API_END_POINT_URL_LOCAL}/api/v1/lab-booking-cancel?id=${selectedBooking._id}&status=Cancelled`
      );
      
      if (response.data.success) {
        Alert.alert(
          "Booking Cancelled",
          "Lab test booking has been cancelled successfully"
        );
        setCancelConfirmOpen(false);
        fetchLabBookingDetails();
      } else {
        Alert.alert("Error", "Failed to cancel booking");
      }
    } catch (err) {
      Alert.alert("Error", err.response.data.message || "Failed to cancel booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reschedule
  const handleReschedule = async () => {
    if (!selectedBooking?._id) return;
    
    if (!rescheduleDate) {
      Alert.alert("Error", "Please select a date");
      return;
    }

    if (!rescheduleTime) {
      Alert.alert("Error", "Please select a time");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = format(rescheduleDate, 'yyyy-MM-dd');

      const payload = {
        rescheduledDate: formattedDate,
        rescheduledTime: rescheduleTime,
        status: "Rescheduled"
      };

      const response = await axios.put(
        `${API_END_POINT_URL_LOCAL}/api/v1/lab-tests-booking-reschedule?id=${selectedBooking._id}&type=reschedule`, 
        payload
      );

      if (response.data.success) {
        Alert.alert(
          "Booking Rescheduled",
          "Your lab test has been rescheduled successfully"
        );
        setRescheduleOpen(false);
        fetchLabBookingDetails();
      } else {
        Alert.alert("Error", "Failed to reschedule booking");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", err.response.data.message || "Failed to reschedule booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP');
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setRescheduleDate(selectedDate);
    }
  };

  // Handle time selection
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      setRescheduleTime(`${formattedHours}:${formattedMinutes}`);
    }
  };

  // Toggle bottom sheets
  const toggleCancelSheet = () => {
    setCancelConfirmOpen(!cancelConfirmOpen);
  };

  const toggleRescheduleSheet = () => {
    setRescheduleOpen(!rescheduleOpen);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLabBookingDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Test Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            bookingDetails?.status === 'Confirmed' ? styles.confirmedStatus : 
            bookingDetails?.status === 'Cancelled' ? styles.cancelledStatus : 
            bookingDetails?.status === 'Rescheduled' ? styles.rescheduledStatus : 
            styles.defaultStatus
          ]}>
            <Text style={styles.statusText}>{bookingDetails?.status || 'Processing'}</Text>
          </View>
          <Text style={styles.bookingRef}>Ref: {bookingDetails?.bookingRef}</Text>
        </View>

        {/* Lab Test Card */}
        {bookingDetails?.labTests?.map((test, index) => (
          <View key={index} style={styles.testCard}>
            {test.mainImage?.url && (
              <Image 
                source={{ uri: test.mainImage.url }} 
                style={styles.testImage} 
                resizeMode="cover"
              />
            )}
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>{test.title}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.discountPrice}>
                  {formatPrice(bookingDetails.bookingType === 'Home' 
                    ? test.home_price_of_package_discount 
                    : test.discount_price)}
                </Text>
                <Text style={styles.originalPrice}>
                  {formatPrice(bookingDetails.bookingType === 'Home' 
                    ? test.home_price_of_package 
                    : test.price)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Appointment Date</Text>
              <Text style={styles.detailValue}>
                {bookingDetails?.rescheduledDate 
                  ? formatDate(bookingDetails.rescheduledDate) 
                  : formatDate(bookingDetails?.selectedDate)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={20} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Appointment Time</Text>
              <Text style={styles.detailValue}>
                {bookingDetails?.rescheduledTime || bookingDetails?.selectedTime || 'N/A'} 
                ({bookingDetails?.bookingPart || 'N/A'})
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="dog" size={20} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Pet</Text>
              <Text style={styles.detailValue}>{bookingDetails?.pet?.petname || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="call" size={20} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Contact</Text>
              <Text style={styles.detailValue}>{bookingDetails?.pet?.petOwnertNumber || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="clinic-medical" size={18} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Booking Type</Text>
              <Text style={styles.detailValue}>{bookingDetails?.bookingType || 'N/A'}</Text>
            </View>
          </View>
          
          {bookingDetails?.bookingType === 'Clinic' && bookingDetails?.clinic && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location" size={20} color="#6366f1" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Clinic</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.clinic.clinicName}
                </Text>
                <Text style={styles.detailSubValue}>
                  {bookingDetails.clinic.address}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="card" size={20} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <View style={[
                styles.paymentStatusBadge, 
                bookingDetails?.payment?.payment_status === 'paid' ? styles.paidStatus : styles.unpaidStatus
              ]}>
                <Text style={styles.paymentStatusText}>
                  {bookingDetails?.payment?.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="receipt" size={18} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Payment ID</Text>
              <Text style={styles.detailValue}>
                {bookingDetails?.payment?.razorpay_payment_id || 'N/A'}
              </Text>
            </View>
          </View>
          
          {bookingDetails?.couponCode && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="pricetag" size={20} color="#6366f1" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Coupon Applied</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.couponCode} (₹{bookingDetails.couponDiscount} off)
                </Text>
              </View>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="money-bill-wave" size={18} color="#6366f1" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(bookingDetails?.totalPayableAmount || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {bookingDetails?.status !== 'Cancelled' && bookingDetails?.status !== 'Rescheduled' && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rescheduleButton]} 
              onPress={toggleRescheduleSheet}
            >
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reschedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={toggleCancelSheet}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Cancel Confirmation Bottom Sheet */}
      {cancelConfirmOpen && (
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Cancel Booking</Text>
              <TouchableOpacity onPress={toggleCancelSheet}>
                <AntDesign name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.bottomSheetMessage}>
              Are you sure you want to cancel this lab test booking? This action cannot be undone.
            </Text>
            
            <View style={styles.bottomSheetButtons}>
              <TouchableOpacity 
                style={[styles.bottomSheetButton, styles.bottomSheetCancelButton]} 
                onPress={toggleCancelSheet}
                disabled={isSubmitting}
              >
                <Text style={styles.bottomSheetCancelButtonText}>No, Keep It</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.bottomSheetButton, styles.bottomSheetConfirmButton]} 
                onPress={handleCancelBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.bottomSheetConfirmButtonText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Reschedule Bottom Sheet */}
      {rescheduleOpen && (
        <View style={styles.bottomSheetContainer}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Reschedule Booking</Text>
              <TouchableOpacity onPress={toggleRescheduleSheet}>
                <AntDesign name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.bottomSheetMessage}>
              Please select a new date and time for your lab test.
            </Text>
            
            <View style={styles.rescheduleForm}>
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={20} color="#6366f1" />
                <Text style={styles.datePickerButtonText}>
                  {rescheduleDate ? format(rescheduleDate, 'PPP') : 'Select Date'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#6366f1" />
                <Text style={styles.datePickerButtonText}>
                  {rescheduleTime ? rescheduleTime : 'Select Time'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={rescheduleDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}
            
            <View style={styles.bottomSheetButtons}>
              <TouchableOpacity 
                style={[styles.bottomSheetButton, styles.bottomSheetCancelButton]} 
                onPress={toggleRescheduleSheet}
                disabled={isSubmitting}
              >
                <Text style={styles.bottomSheetCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.bottomSheetButton, styles.bottomSheetConfirmButton]} 
                onPress={handleReschedule}
                disabled={isSubmitting || !rescheduleDate || !rescheduleTime}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.bottomSheetConfirmButtonText}>Reschedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6366f1',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confirmedStatus: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cancelledStatus: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rescheduledStatus: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  defaultStatus: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  statusText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#10b981',
  },
  bookingRef: {
    fontSize: 14,
    color: '#6b7280',
  },
  testCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testImage: {
    width: 100,
    height: 100,
  },
  testInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  paidStatus: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  unpaidStatus: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rescheduleButton: {
    backgroundColor: '#6366f1',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100,
  },
  bottomSheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  bottomSheetMessage: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
  },
  bottomSheetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomSheetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  bottomSheetCancelButton: {
    backgroundColor: '#f3f4f6',
  },
  bottomSheetConfirmButton: {
    backgroundColor: '#6366f1',
  },
  bottomSheetCancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 16,
  },
  bottomSheetConfirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  rescheduleForm: {
    marginBottom: 24,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginBottom: 12,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
});
