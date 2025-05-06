"use client"

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
} from "react-native"
import { useEffect, useState, useCallback } from "react"
import { useNavigation } from "@react-navigation/native"
import { getUser } from "../../../hooks/getUserHook"
import TopHeadPart from "../../../layouts/TopHeadPart"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export default function Physio() {
    const navigation = useNavigation()
    const { orderData, getUserFnc, loading, error } = getUser()
    const [physio, setPhysio] = useState([])
    const [refreshing, setRefreshing] = useState(false)
    const [filterType, setFilterType] = useState("all")

    useEffect(() => {
        if (orderData) {
            setPhysio(orderData?.physioBookings || [])
        }
    }, [orderData])

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        setTimeout(() => {
            getUserFnc()
            setRefreshing(false)
        }, 1500)
    }, [getUserFnc])

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "short", day: "numeric" }
        return new Date(dateString).toLocaleDateString(undefined, options)
    }

    const formatTime = (timeString) => {
        if (!timeString) return ""
        return timeString
    }

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "#f59e0b"
            case "completed":
                return "#10b981"
            case "cancelled":
                return "#ef4444"
            default:
                return "#6b7280"
        }
    }

    const getStatus = (booking) => {
        if (booking.is_cancel) return "cancelled"
        if (booking.service_done) return "completed"
        return "pending"
    }

    const handleCancelBooking = (item) => {
        Alert.alert("Cancel Booking", "Are you sure you want to cancel this physiotherapy session?", [
            {
                text: "No",
                style: "cancel",
            },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: () => {
                    // Add your cancel booking API call here
                    Alert.alert("Success", "Your physiotherapy session has been cancelled successfully.")
                },
            },
        ])
    }

    const handleViewDetails = (item) => {
        navigation.navigate("ViewPhysioDetails", { physioBooking: item })
    }

    const filteredPhysio = useCallback(() => {
        if (filterType === "all") return physio

        return physio.filter((booking) => {
            const status = getStatus(booking)
            return status === filterType
        })
    }, [physio, filterType])

    const renderFilterButton = (title, type) => (
        <TouchableOpacity
            style={[styles.filterButton, filterType === type && styles.activeFilterButton]}
            onPress={() => setFilterType(type)}
        >
            <Text style={[styles.filterButtonText, filterType === type && styles.activeFilterButtonText]}>{title}</Text>
        </TouchableOpacity>
    )

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Image source={require("../../../assets/empty.png")} style={styles.emptyImage} />
            <Text style={styles.emptyTitle}>No Physiotherapy Sessions</Text>
            <Text style={styles.emptyText}>
                You haven't booked any physiotherapy sessions yet. When you do, they will appear here.
            </Text>
            <TouchableOpacity style={styles.bookNowButton} onPress={() => navigation.navigate("PhysioServices")}>
                <Text style={styles.bookNowButtonText}>Book a Session Now</Text>
            </TouchableOpacity>
        </View>
    )

    const renderPhysioItem = ({ item }) => {
        const status = getStatus(item)

        return (
            <TouchableOpacity style={styles.physioCard} onPress={() => handleViewDetails(item)} activeOpacity={0.9}>
                <View style={styles.cardHeader}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.physioTitle} numberOfLines={1}>
                            {item.physiotherapy?.title || "Physiotherapy Session"}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + "20" }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.bookingId}>Booking ID: {item.BookingID}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="paw" size={16} color="#666" />
                        <Text style={styles.detailLabel}>Pet:</Text>
                        <Text style={styles.detailValue}>{item.PetID?.petName || item.Petname}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <MaterialIcons name="medical-services" size={16} color="#666" />
                        <Text style={styles.detailLabel}>Service:</Text>
                        <Text style={styles.detailValue}>{item.physiotherapy?.title || "Physiotherapy"}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome name="calendar" size={16} color="#666" />
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(item.Date_of_appoinment)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <MaterialIcons name="location-on" size={16} color="#666" />
                        <Text style={styles.detailLabel}>Location:</Text>
                        <Text style={styles.detailValue}>{item.Clinic}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <FontAwesome name="phone" size={16} color="#666" />
                        <Text style={styles.detailLabel}>Contact:</Text>
                        <Text style={styles.detailValue}>{item.contactNumber}</Text>
                    </View>

                    {item.is_cancel && item.cancel_reason && (
                        <View style={styles.reasonContainer}>
                            <MaterialIcons name="info-outline" size={16} color="#ef4444" />
                            <Text style={styles.reasonText}>Cancellation reason: {item.cancel_reason}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardFooter}>
                    <TouchableOpacity style={styles.viewDetailsButton} onPress={() => handleViewDetails(item)}>
                        <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>

                    {status === "pending" ? (
                        <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelBooking(item)}>
                            <Text style={styles.cancelButtonText}>Cancel Session</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.disabledCancelButton}>
                            <Text style={styles.disabledCancelText}>{status === "cancelled" ? "Cancelled" : "Completed"}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        )
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <TopHeadPart title="Pet Physio Sessions" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading your physiotherapy sessions...</Text>
                </View>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.container}>
                <TopHeadPart title="Pet Physio Sessions" />
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={60} color="#ef4444" />
                    <Text style={styles.errorTitle}>Oops!</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={getUserFnc}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <TopHeadPart title="Pet Physio Sessions" />

            <View style={styles.filterContainer}>
                {renderFilterButton("All", "all")}
                {renderFilterButton("Pending", "pending")}
                {renderFilterButton("Completed", "completed")}
                {renderFilterButton("Cancelled", "cancelled")}
            </View>

            <FlatList
                data={filteredPhysio()}
                renderItem={renderPhysioItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} tintColor="#4F46E5" />
                }
                ListEmptyComponent={renderEmptyState()}
            />

            <TouchableOpacity
                style={styles.supportButton}
                onPress={() => Alert.alert("Support", "Our support team will contact you shortly.")}
            >
                <MaterialIcons name="support-agent" size={24} color="#fff" />
                <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    filterContainer: {
        flexDirection: "row",
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: "#f1f1f1",
    },
    activeFilterButton: {
        backgroundColor: "#4F46E5",
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#666",
    },
    activeFilterButtonText: {
        color: "#fff",
    },
    listContainer: {
        padding: 15,
        paddingBottom: 80,
    },
    physioCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: {
        marginBottom: 10,
    },
    titleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
    },
    physioTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    bookingId: {
        fontSize: 12,
        color: "#888",
    },
    cardDivider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 10,
    },
    detailsContainer: {
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: "#666",
        width: 70,
        marginLeft: 8,
    },
    detailValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        flex: 1,
    },
    reasonContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEE2E2",
        padding: 10,
        borderRadius: 8,
        marginTop: 5,
    },
    reasonText: {
        fontSize: 13,
        color: "#B91C1C",
        marginLeft: 8,
        flex: 1,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    viewDetailsButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: "#e9ecef",
        borderRadius: 6,
        flex: 1,
        marginRight: 8,
        alignItems: "center",
    },
    viewDetailsText: {
        color: "#495057",
        fontWeight: "600",
        fontSize: 14,
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: "#fee2e2",
        borderRadius: 6,
        flex: 1,
        marginLeft: 8,
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#ef4444",
        fontWeight: "600",
        fontSize: 14,
    },
    disabledCancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: "#f1f1f1",
        borderRadius: 6,
        flex: 1,
        marginLeft: 8,
        alignItems: "center",
    },
    disabledCancelText: {
        color: "#999",
        fontWeight: "500",
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        padding: 20,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#333",
        marginTop: 15,
        marginBottom: 10,
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: "#4F46E5",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
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
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },
    bookNowButton: {
        backgroundColor: "#4F46E5",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    bookNowButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    supportButton: {
        position: "absolute",
        bottom: 20,
        right: 20,
        backgroundColor: "#4F46E5",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    supportButtonText: {
        color: "#fff",
        fontWeight: "bold",
        marginLeft: 8,
    },
})

