import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  RefreshControl, 
  ActivityIndicator,
  Alert
} from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getUser } from '../../../hooks/getUserHook';
import TopHeadPart from '../../../layouts/TopHeadPart';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Lab() {
  const navigation = useNavigation();
  const { orderData, getUserFnc, loading, error } = getUser();
  const [labData, setLabData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (orderData) {
      setLabData(orderData?.labVaccinations || []);
    }
  }, [orderData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      getUserFnc();
      setRefreshing(false);
    }, 1500);
  }, [getUserFnc]);

  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  const getStatus = useCallback((booking) => {
    if (booking.isBookingCancel) return "cancelled";
    if (booking.is_order_complete) return "completed";
    return "pending";
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#f59e0b";
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }, []);

  const handleCancelBooking = useCallback((item) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this lab test/vaccination?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            // Add your cancel booking API call here
            Alert.alert("Success", "Your lab test/vaccination has been cancelled successfully.");
          }
        }
      ]
    );
  }, []);

  const handleViewDetails = useCallback((item) => {
    navigation.navigate('ViewLabDetails', { labBooking: item });
  }, [navigation]);

  const handleSupport = useCallback(() => {
    Alert.alert(
      "Contact Support",
      "Would you like to contact our support team?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes, Contact Support",
          onPress: () => {
            // Add your support contact logic here
            Alert.alert("Support", "Our support team will contact you shortly.");
          }
        }
      ]
    );
  }, []);

  const filteredLabData = useMemo(() => {
    if (filterType === "all") return labData;
    
    return labData.filter(booking => {
      const status = getStatus(booking);
      return status === filterType;
    });
  }, [labData, filterType, getStatus]);

  const renderFilterButton = useCallback((title, type) => (
    <TouchableOpacity 
      style={[
        styles.filterButton, 
        filterType === type && styles.activeFilterButton
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.activeFilterButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  ), [filterType]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../../../assets/empty.png')} 
        style={styles.emptyImage}
      />
      <Text style={styles.emptyTitle}>No Lab Tests or Vaccinations</Text>
      <Text style={styles.emptyText}>
        You haven't booked any lab tests or vaccinations yet. When you do, they will appear here.
      </Text>
      <TouchableOpacity 
        style={styles.bookNowButton}
        onPress={() => navigation.navigate('LabServices')}
      >
        <Text style={styles.bookNowButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  ), [navigation]);

  const renderLabItem = useCallback(({ item }) => {
    const status = getStatus(item);
    const statusColor = getStatusColor(status);
    
    // Get the first test name for display
    const firstTestName = item.Test && item.Test.length > 0 ? item.Test[0].Test_Name : "Lab Test";
    const additionalTestsCount = item.Test ? item.Test.length - 1 : 0;
    
    return (
      <TouchableOpacity 
        style={styles.labCard}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.labTitle} numberOfLines={1}>
              {firstTestName}
              {additionalTestsCount > 0 && ` +${additionalTestsCount} more`}
            </Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: statusColor + '20' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: statusColor }
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.bookingId}>Booking ID: {item.documentId.substring(0, 10)}...</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="paw" size={16} color="#666" />
            <Text style={styles.detailLabel}>Pet:</Text>
            <Text style={styles.detailValue}>{item.auth?.petName || "Pet"}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="medical-services" size={16} color="#666" />
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {item.Test && item.Test.length > 0 && item.Test[0].Type_Of_Test ? 
                item.Test[0].Type_Of_Test : "Lab Test/Vaccination"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <FontAwesome name="calendar" size={16} color="#666" />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(item.Booking_Date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#666" />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{item.Time_Of_Test}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.detailLabel}>Clinic:</Text>
            <Text style={styles.detailValue}>{item.clinic?.clinic_name}</Text>
          </View>

          <View style={styles.priceContainer}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Total:</Text>
              <Text style={styles.originalPrice}>₹{item.Total_Price}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Discount:</Text>
              <Text style={styles.discountPrice}>-₹{item.Total_Discount}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Payable:</Text>
              <Text style={styles.finalPrice}>₹{item.Payable_Amount}</Text>
            </View>
          </View>

          {item.isBookingCancel && item.cancel_reason && (
            <View style={styles.reasonContainer}>
              <MaterialIcons name="info-outline" size={16} color="#ef4444" />
              <Text style={styles.reasonText}>
                Cancellation reason: {item.cancel_reason}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>

          {status === "pending" ? (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelBooking(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledCancelButton}>
              <Text style={styles.disabledCancelText}>
                {status === "cancelled" ? "Cancelled" : "Completed"}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [formatDate, getStatus, getStatusColor, handleCancelBooking, handleViewDetails]);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TopHeadPart title='Lab Tests & Vaccinations' />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TopHeadPart title='Lab Tests & Vaccinations' />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#ef4444" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={getUserFnc}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopHeadPart title='Lab Tests & Vaccinations' />

      <View style={styles.filterContainer}>
        {renderFilterButton("All", "all")}
        {renderFilterButton("Pending", "pending")}
        {renderFilterButton("Completed", "completed")}
        {renderFilterButton("Cancelled", "cancelled")}
      </View>

      <FlatList
        data={filteredLabData}
        renderItem={renderLabItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity 
        style={styles.supportButton}
        onPress={handleSupport}
      >
        <MaterialIcons name="support-agent" size={24} color="#fff" />
        <Text style={styles.supportButtonText}>Contact Support</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f1f1f1',
  },
  activeFilterButton: {
    backgroundColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80,
  },
  labCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  labTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingId: {
    fontSize: 12,
    color: '#888',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#888',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 14,
    color: '#10b981',
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  reasonText: {
    fontSize: 13,
    color: '#B91C1C',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  viewDetailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f1f1f1',
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  disabledCancelText: {
    color: '#999',
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  bookNowButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  supportButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  supportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
