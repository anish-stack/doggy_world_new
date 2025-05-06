"use client"

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Linking,
    Alert,
    ActivityIndicator,
} from "react-native"
import { useState } from "react"
import { useNavigation, useRoute } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export default function SingleCakeOrder() {
    const navigation = useNavigation()
    const route = useRoute()
    const { cakeOrder } = route.params
    const [loading, setLoading] = useState(false)

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "long", day: "numeric" }
        return new Date(dateString).toLocaleDateString(undefined, options)
    }

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "#D22B2B"
            case "completed":
                return "#10b981"
            case "cancelled":
                return "#ef4444"
            default:
                return "#6b7280"
        }
    }

    const handleCancelBooking = () => {
        Alert.alert("Cancel Booking", "Are you sure you want to cancel this cake order?", [
            {
                text: "No",
                style: "cancel",
            },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: () => {
                    setLoading(true)
                    // Simulate API call
                    setTimeout(() => {
                        setLoading(false)
                        Alert.alert("Order Cancelled", "Your cake order has been cancelled successfully.", [
                            {
                                text: "OK",
                                onPress: () => navigation.goBack(),
                            },
                        ])
                    }, 1500)
                },
            },
        ])
    }

    const handleSupport = () => {
        Linking.openURL(`tel:${cakeOrder.clinic.contact_details}`)
    }

    const handleViewClinic = () => {
        if (cakeOrder.clinic.Map_Location) {
            Linking.openURL(cakeOrder.clinic.Map_Location)
        }
    }

    const calculateTotal = () => {
        const cakePrice = Number.parseInt(cakeOrder.price) || 0
        const deliveryFee = cakeOrder.Delivery_Fee_Aplicable ? Number.parseInt(cakeOrder.Delivery_Fee) || 0 : 0
        return cakePrice + deliveryFee
    }

    return (
        <SafeAreaView style={styles.container}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Processing your request...</Text>
                </View>
            )}

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text numberOfLines={1} style={styles.headerTitle}>{cakeOrder?.Caketitle || "Order Details"}</Text>
                <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
                    <MaterialIcons name="support-agent" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Order Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: getStatusColor(cakeOrder.Order_Stauts) + "15" }]}>
                    <View style={styles.statusIconContainer}>
                        <MaterialCommunityIcons
                            name={
                                cakeOrder.Order_Stauts.toLowerCase() === "completed"
                                    ? "check-circle"
                                    : cakeOrder.Order_Stauts.toLowerCase() === "cancelled"
                                        ? "close-circle"
                                        : "clock-outline"
                            }
                            size={24}
                            color={getStatusColor(cakeOrder.Order_Stauts)}
                        />
                    </View>
                    <View style={styles.statusTextContainer}>
                        <Text style={[styles.statusTitle, { color: getStatusColor(cakeOrder.Order_Stauts) }]}>
                            {cakeOrder.Order_Stauts}
                        </Text>
                        <Text style={styles.statusDescription}>
                            {cakeOrder.Order_Stauts.toLowerCase() === "pending"
                                ? "Your order is being processed"
                                : cakeOrder.Order_Stauts.toLowerCase() === "completed"
                                    ? "Your order has been delivered"
                                    : "Your order has been cancelled"}
                        </Text>
                    </View>
                </View>

                {/* Cake Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Cake Details</Text>
                    <View style={styles.cakeDetailsCard}>
                        {/* <View style={styles.cakeImageContainer}>
              <Image source={require("../assets/cake-placeholder.png")} style={styles.cakeImage} />
            </View> */}
                        <View style={styles.cakeInfo}>
                            <Text style={styles.cakeTitle}>{cakeOrder.Caketitle}</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Flavor:</Text>
                                <Text style={styles.detailValue}>{cakeOrder.flavour}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Design:</Text>
                                <Text style={styles.detailValue}>{cakeOrder.Design}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Size:</Text>
                                <Text style={styles.detailValue}>{cakeOrder.size}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Price:</Text>
                                <Text style={styles.detailValue}>₹{cakeOrder.price}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Delivery Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Delivery Details</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <FontAwesome name="calendar" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Delivery Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(cakeOrder.Delivery_Date)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="delivery-dining" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Delivery Type:</Text>
                            <Text style={styles.detailValue}>
                                {cakeOrder.Same_Day_delivery ? "Same Day Delivery" : "Standard Delivery"}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <FontAwesome name="inr" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Delivery Fee:</Text>
                            <Text style={styles.detailValue}>
                                {cakeOrder.Delivery_Fee_Aplicable ? `₹${cakeOrder.Delivery_Fee}` : "Free"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Billing Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Billing Details</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <FontAwesome name="user" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Name:</Text>
                            <Text style={styles.detailValue}>{cakeOrder.Billing_details.fullName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <FontAwesome name="phone" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Phone:</Text>
                            <Text style={styles.detailValue}>{cakeOrder.Billing_details.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <FontAwesome name="map-marker" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Address:</Text>
                            <Text style={styles.detailValue}>
                                {`${cakeOrder.Billing_details.HouseNo}, ${cakeOrder.Billing_details.street}`}
                                {cakeOrder.Billing_details.landmark ? `, ${cakeOrder.Billing_details.landmark}` : ""}
                                {cakeOrder.Billing_details.zipCode ? ` - ${cakeOrder.Billing_details.zipCode}` : ""}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pet Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Pet Details</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="paw" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Pet Name:</Text>
                            <Text style={styles.detailValue}>{cakeOrder.pet_id.petName}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="dog" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Pet Type:</Text>
                            <Text style={styles.detailValue}>{cakeOrder.pet_id.PetType}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialCommunityIcons name="dog-side" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Breed:</Text>
                            <Text style={styles.detailValue}>{cakeOrder.pet_id.Breed}</Text>
                        </View>
                    </View>
                </View>

                {/* Pickup Location */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Pickup Location</Text>
                    <TouchableOpacity style={styles.clinicCard} onPress={handleViewClinic}>
                        <View style={styles.clinicDetails}>
                            <Text style={styles.clinicName}>{cakeOrder.clinic.clinic_name}</Text>
                            <Text style={styles.clinicAddress}>{cakeOrder.clinic.Address}</Text>
                            <Text style={styles.clinicHours}>{cakeOrder.clinic.time}</Text>
                            <View style={styles.ratingContainer}>
                                <FontAwesome name="star" size={14} color="#D22B2B" />
                                <Text style={styles.ratingText}>{cakeOrder.clinic.Rating}</Text>
                            </View>
                        </View>
                        <View style={styles.mapIconContainer}>
                            <MaterialIcons name="map" size={24} color="#D22B2B" />
                            <Text style={styles.viewMapText}>View Map</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Payment Summary */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Cake Price</Text>
                            <Text style={styles.paymentValue}>₹{cakeOrder.price}</Text>
                        </View>
                        {cakeOrder.Delivery_Fee_Aplicable && (
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Delivery Fee</Text>
                                <Text style={styles.paymentValue}>₹{cakeOrder.Delivery_Fee}</Text>
                            </View>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.paymentRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
                        </View>
                        <View style={styles.paymentStatusContainer}>
                            <MaterialIcons
                                name={cakeOrder.Is_Paid ? "check-circle" : "error"}
                                size={18}
                                color={cakeOrder.Is_Paid ? "#10b981" : "#D22B2B"}
                            />
                            <Text style={[styles.paymentStatusText, { color: cakeOrder.Is_Paid ? "#10b981" : "#D22B2B" }]}>
                                {cakeOrder.Is_Paid ? "Paid" : "Payment Pending"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Info */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Order Information</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <FontAwesome name="calendar" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Order Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(cakeOrder.createdAt)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="confirmation-number" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Order ID:</Text>
                            <Text style={styles.detailValue}>{cakeOrder.documentId}</Text>
                        </View>
                    </View>
                </View>

                {/* Cancel Order Button */}
                {cakeOrder.Order_Stauts.toLowerCase() === "pending" ? (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
                        <MaterialIcons name="cancel" size={20} color="#fff" />
                        <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.cancelNoteContainer}>
                        <MaterialIcons name="info" size={20} color="#666" />
                        <Text style={styles.cancelNoteText}>
                            {cakeOrder.Order_Stauts.toLowerCase() === "cancel"
                                ? "This order has been cancelled."
                                : cakeOrder.Order_Stauts.toLowerCase() === "rejected"
                                    ? "This order has been rejected."
                                    : cakeOrder.Order_Stauts.toLowerCase() === "cake preparing"
                                        ? "Your cake is being prepared. Cancellation is not allowed at this stage."
                                        : cakeOrder.Order_Stauts.toLowerCase() === "order accepted"
                                            ? "Your order has been accepted. Please wait for further updates."
                                            : cakeOrder.Order_Stauts.toLowerCase() === "dispatched"
                                                ? "Your order has been dispatched and is on its way!"
                                                : cakeOrder.Order_Stauts.toLowerCase() === "delivered"
                                                    ? "Your order has been delivered. Enjoy your cake!"
                                                    : "This order cannot be cancelled. Please contact support if you need assistance."
                            }
                        </Text>
                    </View>
                )}


                {/* Support Note */}
                <View style={styles.supportNoteContainer}>
                    <Text style={styles.supportNoteText}>
                        Need help with your order? Contact our support team at {cakeOrder.clinic.contact_details}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 15,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    supportButton: {
        backgroundColor: "#D22B2B",
        padding: 8,
        borderRadius: 20,
    },
    scrollView: {
        flex: 1,
    },
    statusBanner: {
        flexDirection: "row",
        padding: 15,
        marginHorizontal: 15,
        marginTop: 15,
        borderRadius: 10,
        alignItems: "center",
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
        marginTop: 20,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    cakeDetailsCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cakeImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 10,
        overflow: "hidden",
        marginRight: 15,
    },
    cakeImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    cakeInfo: {
        flex: 1,
    },
    cakeTitle: {
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
        width: 100,
        marginLeft: 10,
    },
    detailValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        flex: 1,
    },
    clinicCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        flexDirection: "row",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    clinicDetails: {
        flex: 1,
    },
    clinicName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 5,
    },
    clinicAddress: {
        fontSize: 14,
        color: "#666",
        marginBottom: 5,
    },
    clinicHours: {
        fontSize: 13,
        color: "#888",
        marginBottom: 5,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    ratingText: {
        fontSize: 14,
        color: "#333",
        marginLeft: 5,
    },
    mapIconContainer: {
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 15,
    },
    viewMapText: {
        fontSize: 12,
        color: "#D22B2B",
        marginTop: 5,
    },
    paymentCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    paymentLabel: {
        fontSize: 14,
        color: "#666",
    },
    paymentValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
    },
    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#D22B2B",
    },
    paymentStatusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    paymentStatusText: {
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 5,
    },
    cancelButton: {
        backgroundColor: "#ef4444",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 25,
    },
    cancelButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
    },
    cancelNoteContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f1f1",
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 25,
    },
    cancelNoteText: {
        color: "#666",
        fontSize: 14,
        marginLeft: 10,
        flex: 1,
    },
    supportNoteContainer: {
        padding: 15,
        marginHorizontal: 15,
        marginTop: 15,
        marginBottom: 30,
        alignItems: "center",
    },
    supportNoteText: {
        fontSize: 13,
        color: "#888",
        textAlign: "center",
    },
})

