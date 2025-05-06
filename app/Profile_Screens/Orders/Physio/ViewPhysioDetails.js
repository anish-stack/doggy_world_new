"use client"

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Linking,
} from "react-native"
import { useState } from "react"
import { useNavigation, useRoute } from "@react-navigation/native"
import TopHeadPart from "../../../layouts/TopHeadPart"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export default function ViewPhysioDetails() {
    const navigation = useNavigation()
    const route = useRoute()
    const { physioBooking } = route.params
    const [loading, setLoading] = useState(false)

    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "long", day: "numeric" }
        return new Date(dateString).toLocaleDateString(undefined, options)
    }

    const getStatus = (booking) => {
        if (booking.is_cancel) return "cancelled"
        if (booking.service_done) return "completed"
        return "pending"
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

    const handleCancelBooking = () => {
        Alert.alert("Cancel Booking", "Are you sure you want to cancel this physiotherapy session?", [
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
                        Alert.alert("Session Cancelled", "Your physiotherapy session has been cancelled successfully.", [
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

    const handleCall = () => {
        Linking.openURL(`tel:${physioBooking.contactNumber}`)
    }

    const status = getStatus(physioBooking)
    const statusColor = getStatusColor(status)

    return (
        <View style={styles.container}>
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Processing your request...</Text>
                </View>
            )}

            <TopHeadPart title="Physiotherapy Details" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: statusColor + "15" }]}>
                    <View style={styles.statusIconContainer}>
                        <MaterialCommunityIcons
                            name={status === "completed" ? "check-circle" : status === "cancelled" ? "close-circle" : "clock-outline"}
                            size={24}
                            color={statusColor}
                        />
                    </View>
                    <View style={styles.statusTextContainer}>
                        <Text style={[styles.statusTitle, { color: statusColor }]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                        <Text style={styles.statusDescription}>
                            {status === "pending"
                                ? "Your session is scheduled"
                                : status === "completed"
                                    ? "Your session has been completed"
                                    : "Your session has been cancelled"}
                        </Text>
                    </View>
                </View>

                {/* Booking Info */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Booking Information</Text>
                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="confirmation-number" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Booking ID:</Text>
                            <Text style={styles.detailValue}>{physioBooking.BookingID}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <FontAwesome name="calendar" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Date:</Text>
                            <Text style={styles.detailValue}>{formatDate(physioBooking.Date_of_appoinment)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="location-on" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{physioBooking.Clinic}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <MaterialIcons name="category" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Type:</Text>
                            <Text style={styles.detailValue}>{physioBooking.TypeOfBooking}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <FontAwesome name="calendar-check-o" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Booked On:</Text>
                            <Text style={styles.detailValue}>{formatDate(physioBooking.createdAt)}</Text>
                        </View>
                    </View>
                </View>

                {/* Pet Information */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Pet Information</Text>
                    <View style={styles.petCard}>
                        <View style={styles.petImageContainer}>
                            <Image source={require("../../../assets/placeholder.png")} style={styles.petImage} />
                        </View>
                        <View style={styles.petInfo}>
                            <Text style={styles.petName}>{physioBooking.PetID?.petName || physioBooking.Petname}</Text>

                            <View style={styles.petDetailRow}>
                                <MaterialCommunityIcons name="dog" size={16} color="#666" />
                                <Text style={styles.petDetailLabel}>Type:</Text>
                                <Text style={styles.petDetailValue}>{physioBooking.PetID?.PetType || "Dog"}</Text>
                            </View>

                            <View style={styles.petDetailRow}>
                                <MaterialCommunityIcons name="dog-side" size={16} color="#666" />
                                <Text style={styles.petDetailLabel}>Breed:</Text>
                                <Text style={styles.petDetailValue}>{physioBooking.PetID?.Breed || "Not specified"}</Text>
                            </View>

                            <View style={styles.petDetailRow}>
                                <MaterialIcons name="cake" size={16} color="#666" />
                                <Text style={styles.petDetailLabel}>Age:</Text>
                                <Text style={styles.petDetailValue}>{physioBooking.PetID?.Age || "Not specified"}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Service Details */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Service Details</Text>
                    <View style={styles.serviceCard}>
                        <Text style={styles.serviceTitle}>{physioBooking.physiotherapy?.title || "Physiotherapy Session"}</Text>

                        <View style={styles.servicePriceContainer}>
                            <Text style={styles.serviceOriginalPrice}>₹{physioBooking.physiotherapy?.price || "499"}</Text>
                            {physioBooking.physiotherapy?.discount_price && (
                                <Text style={styles.serviceDiscountPrice}>₹{physioBooking.physiotherapy.discount_price}</Text>
                            )}
                            <View style={styles.serviceDurationBadge}>
                                <MaterialIcons name="timer" size={12} color="#4F46E5" />
                                <Text style={styles.serviceDurationText}>{physioBooking.physiotherapy?.price_minute || "10 min"}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <Text style={styles.serviceDescription}>
                            {physioBooking.physiotherapy?.Description ||
                                "Physiotherapy helps improve your pet's mobility, reduce pain, and enhance overall quality of life. Our trained professionals use specialized techniques to address various conditions and promote healing."}
                        </Text>

                        {physioBooking.physiotherapy?.Popular && (
                            <View style={styles.popularBadge}>
                                <MaterialIcons name="star" size={14} color="#fff" />
                                <Text style={styles.popularText}>Popular Service</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Cancellation Information */}
                {physioBooking.is_cancel && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Cancellation Information</Text>
                        <View style={styles.cancellationCard}>
                            <MaterialIcons name="cancel" size={24} color="#ef4444" />
                            <Text style={styles.cancellationTitle}>Session Cancelled</Text>
                            {physioBooking.cancel_reason && (
                                <Text style={styles.cancellationReason}>Reason: {physioBooking.cancel_reason}</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Rating Section (if completed) */}
                {physioBooking.service_done && (
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>Your Rating</Text>
                        <View style={styles.ratingCard}>
                            {physioBooking.rate ? (
                                <View style={styles.ratingContainer}>
                                    <Text style={styles.ratingTitle}>You rated this session:</Text>
                                    <View style={styles.starsContainer}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <FontAwesome
                                                key={star}
                                                name={star <= physioBooking.rate ? "star" : "star-o"}
                                                size={24}
                                                color="#FFD700"
                                                style={styles.starIcon}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.noRatingContainer}>
                                    <Text style={styles.noRatingText}>You haven't rated this session yet</Text>
                                    <TouchableOpacity style={styles.rateNowButton}>
                                        <Text style={styles.rateNowButtonText}>Rate Now</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Contact Information */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.contactCard}>
                        <View style={styles.contactRow}>
                            <FontAwesome name="phone" size={16} color="#666" />
                            <Text style={styles.contactLabel}>Phone:</Text>
                            <Text style={styles.contactValue}>{physioBooking.contactNumber}</Text>
                            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                                <Text style={styles.callButtonText}>Call</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.contactRow}>
                            <MaterialIcons name="location-on" size={16} color="#666" />
                            <Text style={styles.contactLabel}>Clinic:</Text>
                            <Text style={styles.contactValue}>{physioBooking.Clinic}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                {status === "pending" ? (
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
                        <MaterialIcons name="cancel" size={20} color="#fff" />
                        <Text style={styles.cancelButtonText}>Cancel Session</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Text style={styles.backButtonText}>Back to Sessions</Text>
                        </TouchableOpacity>

                        {status === "completed" && !physioBooking.rate && (
                            <TouchableOpacity style={styles.rateButton}>
                                <Text style={styles.rateButtonText}>Rate Session</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Support Note */}
                <View style={styles.supportNoteContainer}>
                    <Text style={styles.supportNoteText}>
                        Need help with your session? Contact our support team at our helpline.
                    </Text>
                </View>
            </ScrollView>

            {/* Floating Support Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => Alert.alert("Support", "Our support team will contact you shortly.")}
            >
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
    petCard: {
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
    petImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: "hidden",
        marginRight: 15,
    },
    petImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    petInfo: {
        flex: 1,
    },
    petName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    petDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    petDetailLabel: {
        fontSize: 14,
        color: "#666",
        width: 50,
        marginLeft: 8,
    },
    petDetailValue: {
        fontSize: 14,
        color: "#333",
        flex: 1,
    },
    serviceCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        position: "relative",
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    servicePriceContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    serviceOriginalPrice: {
        fontSize: 16,
        color: "#999",
        textDecorationLine: "line-through",
        marginRight: 10,
    },
    serviceDiscountPrice: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4F46E5",
    },
    serviceDurationBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF2FF",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: "auto",
    },
    serviceDurationText: {
        fontSize: 12,
        color: "#4F46E5",
        marginLeft: 4,
    },
    divider: {
        height: 1,
        backgroundColor: "#eee",
        marginBottom: 15,
    },
    serviceDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    popularBadge: {
        position: "absolute",
        top: 15,
        right: 15,
        backgroundColor: "#4F46E5",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularText: {
        fontSize: 12,
        color: "#fff",
        marginLeft: 4,
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
    ratingCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    ratingContainer: {
        alignItems: "center",
    },
    ratingTitle: {
        fontSize: 16,
        color: "#333",
        marginBottom: 10,
    },
    starsContainer: {
        flexDirection: "row",
    },
    starIcon: {
        marginHorizontal: 5,
    },
    noRatingContainer: {
        alignItems: "center",
    },
    noRatingText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 10,
    },
    rateNowButton: {
        backgroundColor: "#4F46E5",
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    rateNowButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    contactCard: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    contactLabel: {
        fontSize: 14,
        color: "#666",
        width: 60,
        marginLeft: 10,
    },
    contactValue: {
        fontSize: 14,
        color: "#333",
        flex: 1,
    },
    callButton: {
        backgroundColor: "#4F46E5",
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    callButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    cancelButton: {
        backgroundColor: "#ef4444",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 20,
    },
    cancelButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 10,
    },
    actionButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: "#e9ecef",
        padding: 15,
        borderRadius: 10,
        flex: 1,
        alignItems: "center",
        marginRight: 10,
    },
    backButtonText: {
        color: "#495057",
        fontWeight: "600",
    },
    rateButton: {
        backgroundColor: "#4F46E5",
        padding: 15,
        borderRadius: 10,
        flex: 1,
        alignItems: "center",
        marginLeft: 10,
    },
    rateButtonText: {
        color: "#fff",
        fontWeight: "600",
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

