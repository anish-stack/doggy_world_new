"use client"

import React, { useState, useEffect, useCallback } from "react"
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
  Dimensions,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import axios from "axios"
import { API_END_POINT_URL_LOCAL } from "../../../constant/constant"
import { useToken } from "../../../hooks/useToken"
import { format } from "date-fns"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export default function Physio() {
  const navigation = useNavigation()
  const { token } = useToken()

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filterType, setFilterType] = useState("all")

  // Fetch physiotherapy bookings
  const fetchBookings = useCallback(async () => {
    if (!token) return

    setError(null)
    if (!refreshing) {
      setLoading(true)
    }

    try {
      const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-my-order-physio`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        setBookings(response.data.data)
      } else {
        setError("Failed to fetch physiotherapy bookings")
      }
    } catch (err) {
      console.log("Error fetching bookings:", err)
      setError(err.response?.data?.message || "Network error. Please try again later.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchBookings()
  }, [fetchBookings])

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "MMM d, yyyy")
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "#10b981"
      case "completed":
        return "#10b981"
      case "cancelled":
        return "#ef4444"
      case "rescheduled":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  // Filter bookings based on selected filter
  const filteredBookings = useCallback(() => {
    if (filterType === "all") return bookings

    return bookings.filter((booking) => booking.status.toLowerCase() === filterType.toLowerCase())
  }, [bookings, filterType])

  // Render filter button
  const renderFilterButton = (title, type) => (
    <TouchableOpacity
      style={[styles.filterButton, filterType === type && styles.activeFilterButton]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[styles.filterButtonText, filterType === type && styles.activeFilterButtonText]}>{title}</Text>
    </TouchableOpacity>
  )

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="medical-bag" size={80} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Physiotherapy Sessions</Text>
      <Text style={styles.emptyText}>
        You haven't booked any physiotherapy sessions yet. When you do, they will appear here.
      </Text>
      <TouchableOpacity style={styles.bookNowButton} onPress={() => navigation.navigate("PhysioServices")}>
        <Text style={styles.bookNowButtonText}>Book a Session Now</Text>
      </TouchableOpacity>
    </View>
  )

  // Render booking item
  const renderBookingItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => navigation.navigate("ViewPhysioDetails", { bookingId: item._id })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {item.physio?.title || "Physiotherapy Session"}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.bookingRef}>Ref: {item.bookingRef}</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <MaterialCommunityIcons name="dog" size={16} color="#8b5cf6" />
            </View>
            <Text style={styles.detailLabel}>Pet:</Text>
            <Text style={styles.detailValue}>{item.pet?.petname || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="calendar-alt" size={14} color="#8b5cf6" />
            </View>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>
              {item.rescheduledDate ? formatDate(item.rescheduledDate) : formatDate(item.date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time-outline" size={16} color="#8b5cf6" />
            </View>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{item.rescheduledTime || item.time || "N/A"}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="money-bill-wave" size={14} color="#8b5cf6" />
            </View>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>
              ₹{item.physio?.discountPrice || item.paymentDetails?.amount / 100 || "N/A"}
            </Text>
          </View>

          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= parseInt(item.rating) ? "star" : "star-outline"}
                    size={16}
                    color="#f59e0b"
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={() => navigation.navigate("ViewPhysioDetails", { bookingId: item._id })}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
            <AntDesign name="arrowright" size={16} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Physiotherapy</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading your physiotherapy sessions...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Physiotherapy</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#ef4444" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Physiotherapy</Text>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton("All", "all")}
        {renderFilterButton("Confirmed", "confirmed")}
        {renderFilterButton("Completed", "completed")}
        {renderFilterButton("Rescheduled", "rescheduled")}
        {renderFilterButton("Cancelled", "cancelled")}
      </View>

      <FlatList
        data={filteredBookings()}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8b5cf6"]} />}
        ListEmptyComponent={renderEmptyState()}
      />

      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => Alert.alert("Support", "Our support team will contact you shortly.")}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    overflow: "scroll",
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f3f4f6",
  },
  activeFilterButton: {
    backgroundColor: "#8b5cf6",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bookingRef: {
    fontSize: 12,
    color: "#6b7280",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    width: 50,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: "row",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  viewDetailsText: {
    color: "#8b5cf6",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  supportButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
})
