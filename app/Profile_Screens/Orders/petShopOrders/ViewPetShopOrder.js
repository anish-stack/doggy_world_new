"use client"

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { useState, useMemo, useCallback } from "react"
import { useNavigation, useRoute } from "@react-navigation/native"
import TopHeadPart from "../../../layouts/TopHeadPart"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export default function ViewPetShopOrder() {
  const navigation = useNavigation()
  const route = useRoute()
  const { order } = route.params
  const [loading, setLoading] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }, [])

  const getStatus = useMemo(() => {
    if (order.isCancelbyUser || order.isCancelbyAdmin) return "Cancelled"
    return order.Order_Status
  }, [order])

  const getStatusColor = useMemo(() => {
    switch (getStatus.toLowerCase()) {
      case "order placed":
        return "#f59e0b"
      case "shipped":
        return "#3b82f6"
      case "delivered":
        return "#10b981"
      case "cancelled":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }, [getStatus])

  const handleCancelOrder = useCallback(() => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => {
          // Show reason input dialog
          Alert.prompt(
            "Cancellation Reason",
            "Please provide a reason for cancellation:",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Submit",
                onPress: (reason) => {
                  if (reason && reason.trim()) {
                    setCancelReason(reason.trim())
                    setLoading(true)
                    // Simulate API call
                    setTimeout(() => {
                      setLoading(false)
                      Alert.alert("Order Cancelled", "Your order has been cancelled successfully.", [
                        {
                          text: "OK",
                          onPress: () => navigation.goBack(),
                        },
                      ])
                    }, 1500)
                  } else {
                    Alert.alert("Error", "Please provide a reason for cancellation.")
                  }
                },
              },
            ],
            "plain-text",
          )
        },
      },
    ])
  }, [navigation])

  const handleSupport = useCallback(() => {
    Alert.alert("Contact Support", "Would you like to contact our support team?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes, Contact Support",
        onPress: () => {
          // Add your support contact logic here
          Alert.alert("Support", "Our support team will contact you shortly.")
        },
      },
    ])
  }, [])

  const calculateTotalItems = useMemo(() => {
    if (!order.Shop_bakery_cart_items || !order.Shop_bakery_cart_items.length) return 0
    return order.Shop_bakery_cart_items.reduce((total, item) => total + item.quantity, 0)
  }, [order])

  const calculateTotalPrice = useMemo(() => {
    // This is a placeholder since the API doesn't provide price information
    // In a real app, you would calculate this based on actual prices
    return "N/A"
  }, [])

  const renderItemType = useCallback((item) => {
    if (item.isPetShopProduct) {
      return (
        <View style={styles.itemTypeBadge}>
          <MaterialCommunityIcons name="dog" size={12} color="#4F46E5" />
          <Text style={styles.itemTypeText}>Pet Shop</Text>
        </View>
      )
    } else if (item.isBakeryProduct) {
      return (
        <View style={[styles.itemTypeBadge, styles.bakeryBadge]}>
          <MaterialCommunityIcons name="food-croissant" size={12} color="#f59e0b" />
          <Text style={[styles.itemTypeText, styles.bakeryText]}>Bakery</Text>
        </View>
      )
    }
    return null
  }, [])

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Processing your request...</Text>
        </View>
      )}

      <TopHeadPart title="Order Details" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor + "15" }]}>
          <View style={styles.statusIconContainer}>
            <MaterialCommunityIcons
              name={
                getStatus.toLowerCase() === "delivered"
                  ? "check-circle"
                  : getStatus.toLowerCase() === "cancelled"
                    ? "close-circle"
                    : getStatus.toLowerCase() === "shipped"
                      ? "truck-delivery"
                      : "package-variant"
              }
              size={24}
              color={getStatusColor}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: getStatusColor }]}>{getStatus}</Text>
            <Text style={styles.statusDescription}>
              {getStatus.toLowerCase() === "order placed"
                ? "Your order has been placed successfully"
                : getStatus.toLowerCase() === "shipped"
                  ? "Your order is on the way"
                  : getStatus.toLowerCase() === "delivered"
                    ? "Your order has been delivered"
                    : "Your order has been cancelled"}
            </Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <MaterialIcons name="confirmation-number" size={16} color="#666" />
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValue}>{order.documentId}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome name="calendar" size={16} color="#666" />
              <Text style={styles.detailLabel}>Order Date:</Text>
              <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="shopping-bag" size={16} color="#666" />
              <Text style={styles.detailLabel}>Total Items:</Text>
              <Text style={styles.detailValue}>{calculateTotalItems}</Text>
            </View>
            {/* <View style={styles.detailRow}>
              <FontAwesome name="money" size={16} color="#666" />
              <Text style={styles.detailLabel}>Total Price:</Text>
              <Text style={styles.detailValue}>{calculateTotalPrice}</Text>
            </View> */}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.Shop_bakery_cart_items && order.Shop_bakery_cart_items.length > 0 ? (
            order.Shop_bakery_cart_items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTypeIconContainer}>
                    <MaterialCommunityIcons
                      name={item.isPetShopProduct ? "dog" : "food-croissant"}
                      size={24}
                      color={item.isPetShopProduct ? "#4F46E5" : "#f59e0b"}
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.title}</Text>
                    {renderItemType(item)}
                  </View>
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Quantity:</Text>
                    <Text style={styles.itemDetailValue}>{item.quantity}</Text>
                  </View>

                  {item.isVarientTrue && item.varientSize && (
                    <View style={styles.itemDetailRow}>
                      <Text style={styles.itemDetailLabel}>Size:</Text>
                      <Text style={styles.itemDetailValue}>{item.varientSize}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noItemsContainer}>
              <MaterialIcons name="error-outline" size={24} color="#666" />
              <Text style={styles.noItemsText}>No items found in this order</Text>
            </View>
          )}
        </View>

        {/* Billing Details */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Billing Details</Text>
          <View style={styles.billingCard}>
            <View style={styles.billingHeader}>
              <MaterialIcons name="person" size={20} color="#4F46E5" />
              <Text style={styles.billingName}>{order.Billing_Details?.fullName || "N/A"}</Text>
            </View>

            <View style={styles.billingDetails}>
              <View style={styles.billingRow}>
                <MaterialIcons name="phone" size={16} color="#666" />
                <Text style={styles.billingLabel}>Phone:</Text>
                <Text style={styles.billingValue}>{order.Billing_Details?.phone || "N/A"}</Text>
              </View>

              <View style={styles.billingRow}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <Text style={styles.billingLabel}>Address:</Text>
                <Text style={styles.billingValue}>
                  {`${order.Billing_Details?.HouseNo || ""}, ${order.Billing_Details?.street || ""}, ${order.Billing_Details?.city || ""}`}
                  {order.Billing_Details?.landmark ? `, ${order.Billing_Details?.landmark}` : ""}
                  {order.Billing_Details?.zipCode ? ` - ${order.Billing_Details?.zipCode}` : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Cancellation Information */}
        {(order.isCancelbyUser || order.isCancelbyAdmin) && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Cancellation Information</Text>
            <View style={styles.cancellationCard}>
              <MaterialIcons name="cancel" size={24} color="#ef4444" />
              <Text style={styles.cancellationTitle}>
                Order Cancelled {order.isCancelbyUser ? "by You" : "by Admin"}
              </Text>
              {(order.Cancel_user_reason || order.admin_cancel_reason) && (
                <Text style={styles.cancellationReason}>
                  Reason: {order.isCancelbyUser ? order.Cancel_user_reason : order.admin_cancel_reason}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {!order.isCancelbyUser && !order.isCancelbyAdmin && order.Order_Status.toLowerCase() === "order placed" && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
            <MaterialIcons name="cancel" size={20} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Orders</Text>
        </TouchableOpacity>

        {/* Support Note */}
        <View style={styles.supportNoteContainer}>
          <Text style={styles.supportNoteText}>Need help with your order? Contact our support team.</Text>
        </View>
      </ScrollView>

      {/* Floating Support Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleSupport}>
        <MaterialIcons name="support-agent" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  statusBanner: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  statusIconContainer: {
    marginRight: 15,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  statusDescription: {
    fontSize: 14,
    color: "#666",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    width: 80,
    marginLeft: 10,
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  itemTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  itemTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  bakeryBadge: {
    backgroundColor: "#FEF3C7",
  },
  itemTypeText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
    marginLeft: 4,
  },
  bakeryText: {
    color: "#f59e0b",
  },
  itemDetails: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 10,
  },
  itemDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  itemDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  itemDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  noItemsContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  noItemsText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  billingCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  billingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  billingName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  billingDetails: {},
  billingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  billingLabel: {
    fontSize: 14,
    color: "#666",
    width: 60,
    marginLeft: 10,
  },
  billingValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  cancellationCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  cancellationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 10,
    marginBottom: 5,
  },
  cancellationReason: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  backButton: {
    backgroundColor: "#4F46E5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  supportNoteContainer: {
    padding: 15,
    marginBottom: 30,
    alignItems: "center",
  },
  supportNoteText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4F46E5",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
})

