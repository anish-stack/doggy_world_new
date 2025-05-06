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

export default function PetShopOrders() {
  const navigation = useNavigation();
  const { orderData, getUserFnc, loading, error } = getUser();
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    if (orderData) {
      setOrders(orderData?.petShopOrders || []);
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

  const getStatusColor = useCallback((status) => {
    switch (status.toLowerCase()) {
      case "order placed":
        return "#f59e0b";
      case "shipped":
        return "#3b82f6";
      case "delivered":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }, []);

  const handleCancelOrder = useCallback((item) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            // Add your cancel order API call here
            Alert.alert("Success", "Your order has been cancelled successfully.");
          }
        }
      ]
    );
  }, []);

  const handleViewDetails = useCallback((item) => {
    navigation.navigate('ViewPetShopOrder', { order: item });
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

  const filteredOrders = useMemo(() => {
    if (filterType === "all") return orders;

    return orders.filter(order => {
      if (filterType === "cancelled") {
        return order.isCancelbyUser || order.isCancelbyAdmin;
      }
      return order.Order_Status.toLowerCase().includes(filterType.toLowerCase());
    });
  }, [orders, filterType]);

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
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptyText}>
        You haven't placed any orders yet. When you do, they will appear here.
      </Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => navigation.navigate('PetShop')}
      >
        <Text style={styles.shopNowButtonText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  ), [navigation]);

  const getItemCount = useCallback((items) => {
    if (!items || !items.length) return 0;
    return items.reduce((total, item) => total + item.quantity, 0);
  }, []);

  const renderOrderItem = useCallback(({ item }) => {
    const status = item.isCancelbyUser || item.isCancelbyAdmin ? "Cancelled" : item.Order_Status;
    const statusColor = getStatusColor(status);
    const itemCount = getItemCount(item.Shop_bakery_cart_items);
    const firstItem = item.Shop_bakery_cart_items && item.Shop_bakery_cart_items.length > 0
      ? item.Shop_bakery_cart_items[0]
      : null;
    const additionalItemsCount = item.Shop_bakery_cart_items ? item.Shop_bakery_cart_items.length - 1 : 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.orderId}>Order #{item.documentId.substring(0, 8)}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: statusColor }
              ]}>
                {status}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>Ordered on {formatDate(item.createdAt)}</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.itemsContainer}>
          {firstItem ? (
            <View style={styles.itemRow}>
              <View style={styles.itemTypeIconContainer}>
                <MaterialCommunityIcons
                  name={firstItem.isPetShopProduct ? "dog" : "food-croissant"}
                  size={20}
                  color="#4F46E5"
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{firstItem.title}</Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemQuantity}>Qty: {firstItem.quantity}</Text>
                  {firstItem.isVarientTrue && firstItem.varientSize && (
                    <Text style={styles.itemVariant}>Size: {firstItem.varientSize}</Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.noItemsText}>No items in this order</Text>
          )}

          {additionalItemsCount > 0 && (
            <Text style={styles.additionalItemsText}>+{additionalItemsCount} more items</Text>
          )}
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.orderSummary}>
          <View style={styles.summaryItem}>
            <MaterialIcons name="shopping-bag" size={16} color="#666" />
            <Text style={styles.summaryText}>{itemCount} items</Text>
          </View>

          <View style={styles.summaryItem}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.summaryText} numberOfLines={1}>
              {item.Billing_Details?.city || "N/A"}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.summaryText} numberOfLines={1}>
              {item.Billing_Details?.fullName || "N/A"}
            </Text>
          </View>
        </View>

        {(item.isCancelbyUser || item.isCancelbyAdmin) && (
          <View style={styles.cancellationInfo}>
            <MaterialIcons name="info-outline" size={16} color="#ef4444" />
            <Text style={styles.cancellationText}>
              {item.isCancelbyUser
                ? `Cancelled by you: ${item.Cancel_user_reason || "No reason provided"}`
                : `Cancelled by admin: ${item.admin_cancel_reason || "No reason provided"}`}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>

          {!item.isCancelbyUser && !item.isCancelbyAdmin && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelOrder(item)}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [formatDate, getStatusColor, handleCancelOrder, handleViewDetails, getItemCount]);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <TopHeadPart title='My Orders' />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TopHeadPart title='My Orders' />
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
      <TopHeadPart title='My Orders' />

      <View style={styles.filterContainer}>
        {renderFilterButton("All", "all")}
        {renderFilterButton("Placed", "order placed")}
        {renderFilterButton("Shipped", "shipped")}
        {renderFilterButton("Delivered", "delivered")}
        {renderFilterButton("Cancelled", "cancelled")}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
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
  orderCard: {
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
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  orderDate: {
    fontSize: 12,
    color: '#888',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  itemsContainer: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTypeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  itemVariant: {
    fontSize: 12,
    color: '#666',
  },
  noItemsText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  additionalItemsText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
    marginTop: 5,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cancellationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancellationText: {
    fontSize: 12,
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
  shopNowButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  shopNowButtonText: {
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
