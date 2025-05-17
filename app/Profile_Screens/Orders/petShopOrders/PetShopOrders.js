import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import TopHeadPart from '../../../layouts/TopHeadPart';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { useToken } from '../../../hooks/useToken';

const BASE_URL = "http://192.168.1.24:8000/api/v1";

export default function PetShopOrders() {
  const navigation = useNavigation();
  const { token } = useToken();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [error, setError] = useState(null);

  // For order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [imageError, setImageError] = useState(false)
  // For tracking modal
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

  // Fetch orders from API
  const fetchOrders = async () => {
    let timeoutId;
    try {
      setError(null);

      // Start showing loading after a delay (e.g. 300ms, not 3s)
      timeoutId = setTimeout(() => {
        setLoading(true);
      }, 3000);

      const response = await axios.get(`${BASE_URL}/petshop-my-bakery-get`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        setError("Failed to fetch orders. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.message || "Network error. Please try again.");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setRefreshing(false); // if using pull-to-refresh
    }
  };


  // Fetch single order details
  const fetchOrderDetails = async (orderId) => {
    try {
      setOrderDetailsLoading(true);

      const response = await axios.get(`${BASE_URL}/petshop-my-bakery-get/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setOrderDetailsVisible(true);
      } else {
        Alert.alert("Error", "Failed to fetch order details. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      Alert.alert("Error", err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    try {
      setCancellingOrder(true);

      const response = await axios.post(`${BASE_URL}/petshop-bakery-cancel/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        Alert.alert("Success", "Your order has been cancelled successfully.");

        // Update local state
        const updatedOrders = orders.map(order => {
          if (order._id === orderId) {
            return {
              ...order,
              status: "Cancelled",
              statusHistory: [
                ...order.statusHistory,
                {
                  status: "Cancelled",
                  timestamp: new Date().toISOString(),
                  note: "Cancelled by user"
                }
              ]
            };
          }
          return order;
        });

        setOrders(updatedOrders);

        // If we're viewing the details of the cancelled order, update it
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: "Cancelled",
            statusHistory: [
              ...selectedOrder.statusHistory,
              {
                status: "Cancelled",
                timestamp: new Date().toISOString(),
                note: "Cancelled by user"
              }
            ]
          });
        }
      } else {
        Alert.alert("Error", response.data.message || "Failed to cancel order. Please try again.");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      Alert.alert("Error", err.response?.data?.message || "Network error. Please try again.");
    } finally {
      setCancellingOrder(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  // Format date
  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);

  // Format time
  const formatTime = useCallback((dateString) => {
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  }, []);

  // Get status color
  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "order placed":
      case "pending":
        return "#f59e0b";
      case "confirmed":
        return "#3b82f6";
      case "shipped":
        return "#8b5cf6";
      case "delivered":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }, []);

  // Handle cancel order
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
          onPress: () => cancelOrder(item._id)
        }
      ]
    );
  }, []);

  // Handle view details
  const handleViewDetails = useCallback((item) => {
    fetchOrderDetails(item._id);
  }, []);

  // Handle track order
  const handleTrackOrder = useCallback((item) => {
    setSelectedOrder(item);
    setTrackingModalVisible(true);
  }, []);

  // Handle support
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

  // Filter orders based on selection
  const filteredOrders = useMemo(() => {
    if (filterType === "all") return orders;

    return orders.filter(order => {
      if (filterType === "cancelled") {
        return order.status?.toLowerCase() === "cancelled";
      }
      return order.status?.toLowerCase().includes(filterType.toLowerCase());
    });
  }, [orders, filterType]);

  // Filter button component
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

  // Empty state component
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

  // Get item count
  const getItemCount = useCallback((items) => {
    if (!items || !items.length) return 0;
    return items.reduce((total, item) => total + item.quantity, 0);
  }, []);

  // Get unique status history (no duplicates)
  const getUniqueStatusHistory = useCallback((statusHistory) => {
    if (!statusHistory || !statusHistory.length) return [];

    const uniqueStatuses = [];
    const statusSet = new Set();

    statusHistory.forEach(status => {
      if (!statusSet.has(status.status)) {
        statusSet.add(status.status);
        uniqueStatuses.push(status);
      }
    });

    return uniqueStatuses.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, []);

  // Render order item
  const renderOrderItem = useCallback(({ item }) => {
    const status = item.status || "Pending";
    const statusColor = getStatusColor(status);
    const itemCount = getItemCount(item.items);
    const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const additionalItemsCount = item.items ? item.items.length - 1 : 0;

    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.orderId}>Order #{item.orderNumber || item._id.substring(0, 8)}</Text>
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
                  name={firstItem.itemModel === "petBakeryProduct" ? "food-croissant" : "dog"}
                  size={20}
                  color="#4F46E5"
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {firstItem.itemId?.name || "Product"}
                </Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemQuantity}>Qty: {firstItem.quantity}</Text>
                  {firstItem.hasVariant && firstItem.variantName && (
                    <Text style={styles.itemVariant}>Size: {firstItem.variantName}</Text>
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
            <FontAwesome name="inr" size={16} color="#666" />
            <Text style={styles.summaryText}>
              ₹{item.totalAmount?.toFixed(2) || "0.00"}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <MaterialIcons name="payment" size={16} color="#666" />
            <Text style={styles.summaryText}>
              {item.paymentMethod === "online" ? "Paid Online" : "COD"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewDetails(item)}
          >
            <MaterialIcons name="visibility" size={16} color="#4F46E5" />
            <Text style={styles.actionButtonText}>View Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleTrackOrder(item)}
          >
            <MaterialIcons name="local-shipping" size={16} color="#4F46E5" />
            <Text style={styles.actionButtonText}>Track</Text>
          </TouchableOpacity>

          {status.toLowerCase() !== "cancelled" &&
            status.toLowerCase() !== "delivered" && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelActionButton]}
                onPress={() => handleCancelOrder(item)}
              >
                <MaterialIcons name="cancel" size={16} color="#ef4444" />
                <Text style={[styles.actionButtonText, styles.cancelActionText]}>Cancel</Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    );
  }, [formatDate, getStatusColor, handleCancelOrder, handleViewDetails, handleTrackOrder, getItemCount]);

  // Order Details Modal
  const renderOrderDetailsModal = () => {
    return (
      (
        <Modal
          visible={orderDetailsVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setOrderDetailsVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setOrderDetailsVisible(false)}
                >
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              {orderDetailsLoading ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.modalLoadingText}>Loading order details...</Text>
                </View>
              ) : selectedOrder ? (
                <ScrollView style={styles.modalScrollContent}>
                  {/* Order Info */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Order Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Order Number:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.orderNumber || selectedOrder._id.substring(0, 8)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedOrder.createdAt)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <View style={[
                        styles.statusBadgeSmall,
                        { backgroundColor: getStatusColor(selectedOrder.status) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusTextSmall,
                          { color: getStatusColor(selectedOrder.status) }
                        ]}>
                          {selectedOrder.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment:</Text>
                      <Text style={styles.detailValue}>
                        {selectedOrder.paymentMethod === "online" ? "Paid Online" : "Cash on Delivery"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expected Delivery:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedOrder.deliveryDate)}</Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Items</Text>
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <View key={index} style={styles.orderItem}>
                        <View style={styles.orderItemHeader}>
                          <View style={styles.itemTypeIconContainer}>
                            {item?.itemId?.mainImage && !imageError ? (
                              <Image
                                source={{ uri: item.itemId.mainImage?.url || 'https://i.ibb.co/9m7kdpp0/images-1.png' }}
                                style={{ width: 40, height: 40 }}
                                onError={() => setImageError(true)}
                              />
                            ) : (
                              <Image
                                source={{ uri: 'https://i.ibb.co/9m7kdpp0/images-1.png' }} 
                                style={{ width: 40, height: 40 }}
                              />
                            )}
                          </View>
                          <View style={styles.orderItemDetails}>
                            <Text style={styles.orderItemName}>{item.itemId?.name || "Product"}</Text>
                            <View style={styles.orderItemMeta}>
                              <Text style={styles.orderItemQuantity}>Qty: {item.quantity}</Text>
                              <Text style={styles.orderItemPrice}>₹{item.unitPrice?.toFixed(2) || "0.00"}</Text>
                            </View>
                          </View>
                        </View>

                        {item.hasVariant && item.variantName && (
                          <View style={styles.variantContainer}>
                            <Text style={styles.variantLabel}>Variant:</Text>
                            <Text style={styles.variantValue}>{item.variantName}</Text>
                          </View>
                        )}

                        <View style={styles.subtotalContainer}>
                          <Text style={styles.subtotalLabel}>Subtotal:</Text>
                          <Text style={styles.subtotalValue}>₹{item.subtotal?.toFixed(2) || "0.00"}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Payment Summary */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Payment Summary</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Subtotal:</Text>
                      <Text style={styles.detailValue}>₹{selectedOrder.subtotal?.toFixed(2) || "0.00"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tax:</Text>
                      <Text style={styles.detailValue}>₹{selectedOrder.taxAmount?.toFixed(2) || "0.00"}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Shipping:</Text>
                      <Text style={styles.detailValue}>₹{selectedOrder.shippingFee?.toFixed(2) || "0.00"}</Text>
                    </View>
                    {selectedOrder.couponApplied && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Discount:</Text>
                        <Text style={styles.detailValue}>-₹{selectedOrder.discountAmount?.toFixed(2) || "0.00"}</Text>
                      </View>
                    )}
                    <View style={styles.detailRowTotal}>
                      <Text style={styles.detailLabelTotal}>Total:</Text>
                      <Text style={styles.detailValueTotal}>₹{selectedOrder.totalAmount?.toFixed(2) || "0.00"}</Text>
                    </View>
                  </View>

                  {/* Delivery Address */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Delivery Address</Text>
                    <View style={styles.addressContainer}>
                      <Text style={styles.addressText}>
                        {selectedOrder.deliveryInfo?.street}, {selectedOrder.deliveryInfo?.city}, {selectedOrder.deliveryInfo?.state} {selectedOrder.deliveryInfo?.zipCode}, {selectedOrder.deliveryInfo?.country}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.trackButton}
                      onPress={() => {
                        setOrderDetailsVisible(false);
                        setTrackingModalVisible(true);
                      }}
                    >
                      <MaterialIcons name="local-shipping" size={18} color="#fff" />
                      <Text style={styles.trackButtonText}>Track Order</Text>
                    </TouchableOpacity>

                    {selectedOrder.status.toLowerCase() !== "cancelled" &&
                      selectedOrder.status.toLowerCase() !== "delivered" && (
                        <TouchableOpacity
                          style={styles.cancelDetailButton}
                          onPress={() => {
                            setOrderDetailsVisible(false);
                            handleCancelOrder(selectedOrder);
                          }}
                        >
                          <MaterialIcons name="cancel" size={18} color="#fff" />
                          <Text style={styles.cancelDetailButtonText}>Cancel Order</Text>
                        </TouchableOpacity>
                      )}
                  </View>
                </ScrollView>
              ) : (
                <View style={styles.modalErrorContainer}>
                  <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                  <Text style={styles.modalErrorText}>Failed to load order details</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )
    )
  };

  // Tracking Modal
  const renderTrackingModal = () => {
    const uniqueStatusHistory = selectedOrder ? getUniqueStatusHistory(selectedOrder.statusHistory) : [];

    return (
      <Modal
        visible={trackingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Track Order</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setTrackingModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedOrder ? (
              <ScrollView style={styles.modalScrollContent}>
                <View style={styles.orderBasicInfo}>
                  <Text style={styles.orderNumberTrack}>
                    Order #{selectedOrder.orderNumber || selectedOrder._id.substring(0, 8)}
                  </Text>
                  <Text style={styles.orderDateTrack}>
                    Placed on {formatDate(selectedOrder.createdAt)}
                  </Text>
                  <View style={styles.estimatedDelivery}>
                    <MaterialIcons name="schedule" size={16} color="#4F46E5" />
                    <Text style={styles.estimatedDeliveryText}>
                      Estimated Delivery: {formatDate(selectedOrder.deliveryDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.trackingTimeline}>
                  {uniqueStatusHistory.length > 0 ? (
                    uniqueStatusHistory.map((statusItem, index) => (
                      <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineIconContainer}>
                          <View style={[
                            styles.timelineIcon,
                            { backgroundColor: getStatusColor(statusItem.status) }
                          ]}>
                            {statusItem.status.toLowerCase() === "order placed" ||
                              statusItem.status.toLowerCase() === "pending" ? (
                              <MaterialIcons name="shopping-cart" size={16} color="#fff" />
                            ) : statusItem.status.toLowerCase() === "confirmed" ? (
                              <MaterialIcons name="check-circle" size={16} color="#fff" />
                            ) : statusItem.status.toLowerCase() === "shipped" ? (
                              <MaterialIcons name="local-shipping" size={16} color="#fff" />
                            ) : statusItem.status.toLowerCase() === "delivered" ? (
                              <MaterialIcons name="done-all" size={16} color="#fff" />
                            ) : statusItem.status.toLowerCase() === "cancelled" ? (
                              <MaterialIcons name="cancel" size={16} color="#fff" />
                            ) : (
                              <MaterialIcons name="circle" size={16} color="#fff" />
                            )}
                          </View>
                          {index < uniqueStatusHistory.length - 1 && (
                            <View style={styles.timelineConnector} />
                          )}
                        </View>

                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineStatus}>{statusItem.status}</Text>
                          <Text style={styles.timelineDate}>
                            {formatDate(statusItem.timestamp)} at {formatTime(statusItem.timestamp)}
                          </Text>
                          {statusItem.note && (
                            <Text style={styles.timelineNote}>{statusItem.note}</Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.noTrackingContainer}>
                      <MaterialIcons name="info-outline" size={24} color="#666" />
                      <Text style={styles.noTrackingText}>No tracking information available</Text>
                    </View>
                  )}
                </View>

                {selectedOrder.status.toLowerCase() !== "cancelled" &&
                selectedOrder.status.toLowerCase() !== "packed" &&
                  selectedOrder.status.toLowerCase() !== "delivered" && (
                    <TouchableOpacity
                      style={styles.cancelTrackButton}
                      onPress={() => {
                        setTrackingModalVisible(false);
                        handleCancelOrder(selectedOrder);
                      }}
                      disabled={cancellingOrder}
                    >
                      {cancellingOrder ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialIcons name="cancel" size={18} color="#fff" />
                          <Text style={styles.cancelTrackButtonText}>Cancel Order</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
              </ScrollView>
            ) : (
              <View style={styles.modalErrorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                <Text style={styles.modalErrorText}>Failed to load tracking information</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

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
            onPress={fetchOrders}
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
        {renderFilterButton("Confirmed", "confirmed")}
        {renderFilterButton("Shipped", "shipped")}
        {renderFilterButton("Delivered", "delivered")}
        {renderFilterButton("Cancelled", "cancelled")}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id.toString()}
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

      {/* Modals */}
      {renderOrderDetailsModal()}
      {renderTrackingModal()}
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
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 5,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  cancelActionButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelActionText: {
    color: '#ef4444',
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

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '95%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalScrollContent: {
    padding: 15,
  },
  modalLoadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  modalErrorContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalErrorText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // Order details styles
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  detailValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    flex: 1,
    textAlign: 'right',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  orderItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  orderItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  orderItemPrice: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  variantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 46,
  },
  variantLabel: {
    fontSize: 12,
    color: '#666',
    width: 60,
  },
  variantValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#666',
  },
  subtotalValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  addressContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  trackButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  cancelDetailButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  cancelDetailButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },

  // Tracking modal styles
  orderBasicInfo: {
    marginBottom: 20,
  },
  orderNumberTrack: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  orderDateTrack: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  estimatedDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  estimatedDeliveryText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
    marginLeft: 8,
  },
  trackingTimeline: {
    marginTop: 20,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIconContainer: {
    alignItems: 'center',
    width: 30,
  },
  timelineIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#ddd',
    marginVertical: 5,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 15,
    paddingBottom: 15,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  timelineDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timelineNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  noTrackingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noTrackingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  cancelTrackButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancelTrackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
});