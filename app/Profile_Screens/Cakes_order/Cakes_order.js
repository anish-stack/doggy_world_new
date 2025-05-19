import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    RefreshControl,
    ActivityIndicator,
    Linking,
    Alert,
    Dimensions,
    ScrollView,
    TextInput,
    Modal
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import axios from "axios";
import { useToken } from "../../hooks/useToken";
import LottieView from 'lottie-react-native';

const BASE_URL = "http://192.168.1.22:8000/api/v1";
const { width } = Dimensions.get('window');

export default function Cakes_order() {
    const navigation = useNavigation();
    const { token, isTokenLoading } = useToken();
    const [cakes, setCakes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const [error, setError] = useState(null);
    const [expandedCakeId, setExpandedCakeId] = useState(null);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [selectedCake, setSelectedCake] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [reviewText, setReviewText] = useState("");
    const [rating, setRating] = useState(0);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Get cake orders data
    const fetchCakeOrders = async () => {
        try {
            setError(null);
            if (!token) return;

            const response = await axios.get(`${BASE_URL}/cake-booking`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setCakes(response.data.data || []);
            } else {
                setError(response.data.message || "Failed to fetch cake orders");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Network error. Please try again.");
            console.error("Error fetching cake orders:", err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Cancel cake order
    const cancelCakeOrder = async (id, reason) => {
        try {
            setIsCancelling(true);
            const response = await axios.post(
                `${BASE_URL}/chanage-booking-status`,
                { id, status: "Cancelled", reason },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: { id },
                }
            );

            if (response.data.success) {
                // Update the local state
                const updatedCakes = cakes.map((cake) => {
                    if (cake._id === id) {
                        return { ...cake, bookingStatus: "Cancelled" };
                    }
                    return cake;
                });
                setCakes(updatedCakes);

                Alert.alert("Success", "Your cake order has been cancelled successfully.");
                setCancelModalVisible(false);
            } else {
                Alert.alert("Error", response.data.message || "Failed to cancel your order.");
            }
        } catch (err) {
            Alert.alert(
                "Error",
                err.response?.data?.message || "Something went wrong. Please try again."
            );
            console.error("Error cancelling cake order:", err);
        } finally {
            setIsCancelling(false);
        }
    };

    // Submit review
    const submitReview = async () => {
        if (!rating) {
            Alert.alert("Error", "Please select a rating");
            return;
        }

        try {
            setIsSubmittingReview(true);
            // Implement your review submission API call here
            const response = await axios.post(
                `${BASE_URL}/cake-review`,
                {
                    cakeOrderId: selectedCake._id,
                    rating,
                    review: reviewText
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (response.data.success) {
                Alert.alert("Success", "Thank you for your review!");

                // Update local state to show review was submitted
                const updatedCakes = cakes.map((cake) => {
                    if (cake._id === selectedCake._id) {
                        return { ...cake, hasReviewed: true };
                    }
                    return cake;
                });
                setCakes(updatedCakes);

                setReviewModalVisible(false);
                setRating(0);
                setReviewText("");
            } else {
                Alert.alert("Error", response.data.message || "Failed to submit review");
            }
        } catch (err) {
            Alert.alert(
                "Error",
                err.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        if (token) {
            fetchCakeOrders();
        }
    }, [token]);

    // Pull to refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchCakeOrders();
    }, []);

    // Format date
    const formatDate = (dateString) => {
        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Handle cake details toggle
    const toggleCakeDetails = (cakeId) => {
        setExpandedCakeId(expandedCakeId === cakeId ? null : cakeId);
    };

    // Handle open cancel modal
    const handleCancelBooking = (cake) => {
        setSelectedCake(cake);
        setCancelReason("");
        setCancelModalVisible(true);
    };

    // Handle open review modal
    const handleReview = (cake) => {
        setSelectedCake(cake);
        setRating(0);
        setReviewText("");
        setReviewModalVisible(true);
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "confirmed":
            case "order accepted":
                return "#90B474";
            case "pending":
                return "#D22B2B";
            case "preparing":
            case "cake preparing":
                return "#f59e0b";
            case "cancelled":
                return "#ef4444";
            case "delivered":
                return "#263166";
            case "rejected":
                return "#6b7280";
            case "dispatched":
                return "#10b981";
            default:
                return "#6b7280";
        }
    };

    // Support call
    const handleSupport = () => {
        Linking.openURL("tel:+919988556699");
    };

    // Filter cakes based on selection
    const filteredCakes = useCallback(() => {
        if (filterType === "all") return cakes;
        return cakes.filter((cake) =>
            cake.bookingStatus?.toLowerCase() === filterType.toLowerCase()
        );
    }, [cakes, filterType]);

    // Filter button component
    const renderFilterButton = (title, type) => (
        <TouchableOpacity
            style={[styles.filterButton, filterType === type && styles.activeFilterButton]}
            onPress={() => setFilterType(type)}
        >
            <Text style={[styles.filterButtonText, filterType === type && styles.activeFilterButtonText]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    // Star rating component
    const StarRating = ({ rating, onRatingPress }) => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => onRatingPress(star)}
                        style={styles.starButton}
                    >
                        <FontAwesome
                            name={rating >= star ? "star" : "star-o"}
                            size={24}
                            color={rating >= star ? "#FFD700" : "#ccc"}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    // Empty state component
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Image
                source={require("../../assets/empty.png")}
                style={styles.emptyImage}
                resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No Cake Orders Found</Text>
            <Text style={styles.emptyText}>
                You haven't placed any cake orders yet. When you do, they will appear here.
            </Text>
            <TouchableOpacity
                style={styles.orderNowButton}
                onPress={() => navigation.navigate("CakeShop")}
            >
                <Text style={styles.orderNowButtonText}>Order a Cake Now</Text>
            </TouchableOpacity>
        </View>
    );

    // Cake item component
    const renderCakeItem = ({ item }) => (
        <View style={styles.cakeCard}>
            <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleCakeDetails(item._id)}
            >
                <View style={styles.titleContainer}>
                    <Text style={styles.cakeTitle} numberOfLines={1}>
                        {item.cakeDesign?.name || "Custom Cake"}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.bookingStatus) + "20" }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.bookingStatus) }]}>
                            {item.bookingStatus}
                        </Text>
                    </View>
                </View>
                <Text style={styles.orderDate}>Ordered on {formatDate(item.createdAt)}</Text>
                <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>

                <View style={styles.expandIconContainer}>
                    <MaterialIcons
                        name={expandedCakeId === item._id ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={24}
                        color="#666"
                    />
                </View>
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            {/* Basic details always visible */}
            <View style={styles.basicDetailsContainer}>
                {item.cakeDesign?.image?.url && (
                    <Image
                        source={{ uri: item.cakeDesign.image.url }}
                        style={styles.cakeImage}
                        resizeMode="cover"
                    />
                )}

                <View style={styles.detailRow}>
                    <FontAwesome name="birthday-cake" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Flavor:</Text>
                    <Text style={styles.detailValue}>{item.cakeFlavor?.name || "Custom"}</Text>
                </View>

                <View style={styles.detailRow}>
                    <MaterialIcons name="cake" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Size:</Text>
                    <Text style={styles.detailValue}>{item.size?.weight || "Standard"}</Text>
                </View>
            </View>

            {/* Expanded details */}
            {expandedCakeId === item._id && (
                <View style={styles.expandedDetails}>
                    <View style={styles.detailSection}>
                        <Text style={styles.detailSectionTitle}>Order Details</Text>


                        {item.type === 'Pickup At Store' ? (
                            <View style={styles.detailRow}>
                                <FontAwesome name="calendar" size={16} color="#666" />
                                <Text style={styles.detailLabel}>Pickup:</Text>
                                <Text style={styles.detailValue}>{formatDate(item.pickupDate)}</Text>
                            </View>
                        ) : (
                            <View style={styles.detailRow}>
                                <FontAwesome name="calendar" size={16} color="#666" />
                                <Text style={styles.detailLabel}>Delivered At Your Door Step:</Text>
                                <Text style={styles.detailValue}>{formatDate(item.deliveredDate)}</Text>
                            </View>
                        )}


                        <View style={styles.detailRow}>
                            <FontAwesome name="inr" size={16} color="#666" />
                            <Text style={styles.detailLabel}>Price:</Text>
                            <Text style={styles.detailValue}>₹{item.totalAmount?.toFixed(2) || item.size?.price || "0"}</Text>
                        </View>


                        {item.message && (
                            <View style={styles.detailRow}>
                                <MaterialIcons name="message" size={16} color="#666" />
                                <Text style={styles.detailLabel}>Message:</Text>
                                <Text style={styles.detailValue}>{item.message}</Text>
                            </View>
                        )}

                        {item.specialInstructions && (
                            <View style={styles.detailRow}>
                                <MaterialIcons name="note" size={16} color="#666" />
                                <Text style={styles.detailLabel}>Instructions:</Text>
                                <Text style={styles.detailValue}>{item.specialInstructions}</Text>
                            </View>
                        )}
                    </View>
                    {item.type === 'Pickup At Store' ? (
                        <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Pickup Address</Text>
                            <Text style={styles.addressText}>Store name -: {item.clinic.clinicName}</Text>
                            <Text style={styles.addressText}>Store address :- {item.clinic.address}</Text>
                            <Text style={styles.addressText}>Store Contact :- {item.clinic.phone}</Text>
                            <Text style={styles.addressText}>Store timings :- {item.clinic.openTime}AM - {item.clinic.closeTime}PM</Text>
                        </View>
                    ) : (
                        <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Delivery Address</Text>
                            <Text style={styles.addressText}>{item.deliveryInfo.street},{item.deliveryInfo.city},{item.deliveryInfo.zipCode}</Text>
                        </View>
                    )}




                    {item.review && (
                        <View style={styles.detailSection}>
                            <Text style={styles.detailSectionTitle}>Your Review</Text>
                            <View style={styles.reviewContainer}>
                                <View style={styles.starRatingDisplay}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <FontAwesome
                                            key={star}
                                            name={item.review.rating >= star ? "star" : "star-o"}
                                            size={16}
                                            color="#FFD700"
                                            style={styles.starIcon}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.reviewText}>{item.review.text}</Text>
                                <Text style={styles.reviewDate}>
                                    Reviewed on {formatDate(item.review.createdAt)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {item.bookingStatus?.toLowerCase() === "delivered" && (
                <TouchableOpacity style={styles.thankyou}>
                    <Text style={styles.thankyouText}>Thank you for your order from Doggy World!</Text>
                </TouchableOpacity>
            )}

            <View style={styles.cardFooter}>
                {(item.bookingStatus?.toLowerCase() === "confirmed" ||
                    item.bookingStatus?.toLowerCase() === "pending") && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelBooking(item)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel Order</Text>
                        </TouchableOpacity>
                    )}

                {item.bookingStatus?.toLowerCase() === "delivered" && !item.hasReviewed && (
                    <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() => handleReview(item)}
                    >
                        <Text style={styles.reviewButtonText}>Leave Review</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    // Token loading state
    if (isTokenLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                {/* <LottieView
          source={require('../../assets/loading-animation.json')}
          autoPlay
          loop
          style={styles.lottieAnimation}
        /> */}
                <Text style={styles.loadingText}>Authenticating...</Text>
            </SafeAreaView>
        );
    }

    // Loading state
    if (isLoading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D22B2B" />
                <Text style={styles.loadingText}>Loading your cake orders...</Text>
            </SafeAreaView>
        );
    }

    // Error state
    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={60} color="#ef4444" />
                <Text style={styles.errorTitle}>Oops!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCakeOrders}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cake Orders</Text>
                <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
                    <MaterialIcons name="support-agent" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filter Bar */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
                    {renderFilterButton("All", "all")}
                    {renderFilterButton("Confirmed", "confirmed")}
                    {renderFilterButton("Preparing", "preparing")}
                    {renderFilterButton("Dispatched", "dispatched")}
                    {renderFilterButton("Delivered", "delivered")}
                    {renderFilterButton("Cancelled", "cancelled")}
                </ScrollView>
            </View>

            {/* Orders List */}
            <FlatList
                data={filteredCakes()}
                renderItem={renderCakeItem}
                keyExtractor={(item) => item._id?.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#D22B2B"]}
                        tintColor="#D22B2B"
                    />
                }
                ListEmptyComponent={renderEmptyState()}
            />

            {/* Cancel Order Modal */}
            <Modal
                visible={cancelModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setCancelModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Cancel Order</Text>
                        <Text style={styles.modalSubtitle}>
                            Please provide a reason for cancelling this order
                        </Text>

                        <View style={styles.reasonContainer}>
                            {["Changed my mind", "Ordered by mistake", "Found better option", "Other"].map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[
                                        styles.reasonButton,
                                        cancelReason === reason && styles.selectedReasonButton
                                    ]}
                                    onPress={() => setCancelReason(reason)}
                                >
                                    <Text style={[
                                        styles.reasonButtonText,
                                        cancelReason === reason && styles.selectedReasonButtonText
                                    ]}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelConfirmButton}
                                onPress={() => {
                                    if (cancelReason) {
                                        cancelCakeOrder(selectedCake?._id, cancelReason);
                                    } else {
                                        Alert.alert("Required", "Please select a reason for cancellation");
                                    }
                                }}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.cancelConfirmButtonText}>Confirm Cancellation</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dismissButton}
                                onPress={() => setCancelModalVisible(false)}
                            >
                                <Text style={styles.dismissButtonText}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Review Modal */}
            <Modal
                visible={reviewModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Leave a Review</Text>
                        <Text style={styles.modalSubtitle}>
                            How was your cake from Doggy World?
                        </Text>

                        <StarRating
                            rating={rating}
                            onRatingPress={(value) => setRating(value)}
                        />

                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your experience (optional)"
                            multiline={true}
                            numberOfLines={4}
                            value={reviewText}
                            onChangeText={setReviewText}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.submitReviewButton}
                                onPress={submitReview}
                                disabled={isSubmittingReview}
                            >
                                {isSubmittingReview ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitReviewButtonText}>Submit Review</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.dismissButton}
                                onPress={() => setReviewModalVisible(false)}
                            >
                                <Text style={styles.dismissButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
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
        elevation: 2,
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
    filterContainer: {
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingVertical: 10,
    },
    filterScrollContent: {
        paddingHorizontal: 15,
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: "#f1f1f1",
    },
    activeFilterButton: {
        backgroundColor: "#D22B2B",
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
        paddingBottom: 30,
    },
    cakeCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 15,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 10,
        position: "relative",
    },
    expandIconContainer: {
        position: "absolute",
        right: 0,
        top: 0,
    },
    titleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
        paddingRight: 24, // Make room for expand icon
    },
    cakeTitle: {
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
    orderDate: {
        fontSize: 12,
        color: "#888",
    },
    orderNumber: {
        fontSize: 11,
        color: "#666",
        fontWeight: "500",
        marginTop: 2,
    },
    cardDivider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 10,
    },
    basicDetailsContainer: {
        marginBottom: 10,
    },
    expandedDetails: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
    },
    detailSection: {
        marginBottom: 15,
    },
    detailSectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    cakeImage: {
        height: 120,
        borderRadius: 8,
        marginBottom: 10,
        width: "100%",
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
    addressText: {
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "center",
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: "#fee2e2",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 150,
    },
    cancelButtonText: {
        color: "#ef4444",
        fontWeight: "600",
        fontSize: 14,
    },
    reviewButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: "#e6f7ff",
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 150,
    },
    reviewButtonText: {
        color: "#0077cc",
        fontWeight: "600",
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
    },
    lottieAnimation: {
        width: 150,
        height: 150,
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
        backgroundColor: "#D22B2B",
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
        marginTop: 20,
    },
    emptyImage: {
        width: 180,
        height: 180,
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
    orderNowButton: {
        backgroundColor: "#D22B2B",
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    orderNowButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    thankyou: {
        backgroundColor: '#10b981',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    thankyouText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    reasonContainer: {
        marginVertical: 15,
    },
    reasonButton: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#f1f1f1',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#f1f1f1',
    },
    selectedReasonButton: {
        borderColor: '#D22B2B',
        backgroundColor: '#fee2e2',
    },
    reasonButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    selectedReasonButtonText: {
        color: '#D22B2B',
        fontWeight: '600',
    },
    modalButtons: {
        marginTop: 20,
    },
    cancelConfirmButton: {
        backgroundColor: '#D22B2B',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    cancelConfirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dismissButton: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#f1f1f1',
    },
    dismissButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    // Review styles
    reviewContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 10,
    },
    starRatingDisplay: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    starIcon: {
        marginRight: 2,
    },
    reviewText: {
        fontSize: 14,
        color: '#333',
        marginVertical: 5,
    },
    reviewDate: {
        fontSize: 12,
        color: '#888',
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 15,
    },
    starButton: {
        padding: 5,
    },
    reviewInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        height: 100,
        textAlignVertical: 'top',
        marginTop: 10,
    },
    submitReviewButton: {
        backgroundColor: '#0077cc',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    submitReviewButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});