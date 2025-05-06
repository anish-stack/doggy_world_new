

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
} from "react-native"
import { useEffect, useState, useCallback } from "react"
import { useNavigation } from "@react-navigation/native"

import { SafeAreaView } from "react-native-safe-area-context"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import { getUser } from "../../hooks/getUserHook"
import CancelModal from "./CancelModal"

export default function Cakes_order() {
    const navigation = useNavigation()
    const { orderData, getUserFnc, loading, error } = getUser()
    const [cakes, setCakes] = useState([])
    const [refreshing, setRefreshing] = useState(false)
    const [filterType, setFilterType] = useState("all")

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCake, setSelectedCake] = useState(null)
    useEffect(() => {
        if (orderData) {
            setCakes(orderData?.cakeBookings || [])
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

    const handleCakePress = (cake) => {
        setSelectedCake(cake)
        setModalVisible(true)
    }


    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "pending":
                return "#D22B2B";
            case "cake preparing":
                return "#f59e0b";
            case "order accepted":
                return "#90B474";
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

    const handleCancelBooking = (item) => {
        Alert.alert("Cancel Booking", "Are you sure you want to cancel this cake order?", [
            {
                text: "No",
                style: "cancel",
            },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: () => {
                    handleCakePress(item)
                    Alert.alert("Reason", "Write Cancel Reason Why Are You Cancel This Order .")
                },
            },
        ])
    }

    const handleSupport = () => {
        Linking.openURL("tel:+919988556699")
    }

    const handleViewDetails = (item) => {
        navigation.navigate("SingleCakeOrder", { cakeOrder: item })
    }

    const filteredCakes = useCallback(() => {
        if (filterType === "all") return cakes
        return cakes.filter((cake) => cake.Order_Stauts.toLowerCase() === filterType.toLowerCase())
    }, [cakes, filterType])

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
            <Image source={require("../../assets/empty.png")} style={styles.emptyImage} />

            <Text style={styles.emptyTitle}>No Cake Orders Found</Text>
            <Text style={styles.emptyText}>You haven't placed any cake orders yet. When you do, they will appear here.</Text>
            <TouchableOpacity style={styles.orderNowButton} onPress={() => navigation.navigate("CakeShop")}>
                <Text style={styles.orderNowButtonText}>Order a Cake Now</Text>
            </TouchableOpacity>
        </View>
    )

    const renderCakeItem = ({ item }) => (
        <TouchableOpacity style={styles.cakeCard} onPress={() => handleViewDetails(item)} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                    <Text style={styles.cakeTitle} numberOfLines={1}>
                        {item.Caketitle}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.Order_Stauts) + "20" }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.Order_Stauts) }]}>{item.Order_Stauts}</Text>
                    </View>
                </View>
                <Text style={styles.orderDate}>Ordered on {formatDate(item.createdAt)}</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <FontAwesome name="birthday-cake" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Flavor:</Text>
                    <Text style={styles.detailValue}>{item.flavour}</Text>
                </View>

                <View style={styles.detailRow}>
                    <MaterialIcons name="cake" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Size:</Text>
                    <Text style={styles.detailValue}>{item.size}</Text>
                </View>

                <View style={styles.detailRow}>
                    <FontAwesome name="calendar" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Delivery:</Text>
                    <Text style={styles.detailValue}>{formatDate(item.Delivery_Date)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <FontAwesome name="inr" size={16} color="#666" />
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>
                        ₹{Number.parseInt(item.price) + (item.Delivery_Fee_Aplicable ? Number.parseInt(item.Delivery_Fee) : 0)}
                    </Text>
                </View>
            </View>

            {item.Order_Stauts === 'Delivered' && (
                <TouchableOpacity style={styles.Thankyou}>
                    <Text style={styles.thankyouText}>Thank you for your order from Doggy World!</Text>
                </TouchableOpacity>
            )}


            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.viewDetailsButton} onPress={() => handleViewDetails(item)}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                </TouchableOpacity>

                {item.Order_Stauts.toLowerCase() === "pending" ? (
                    <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelBooking(item)}>
                        <Text style={styles.cancelButtonText}>Cancel Order</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.disabledCancelButton}>
                        <Text style={styles.disabledCancelText}>
                            {item.Order_Stauts.toLowerCase() === "cancelled" ? "Cancelled" : "Cannot Cancel"}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    )

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D22B2B" />
                <Text style={styles.loadingText}>Loading your cake orders...</Text>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={60} color="#ef4444" />
                <Text style={styles.errorTitle}>Oops!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={getUserFnc}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cake Orders</Text>
                <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
                    <MaterialIcons name="support-agent" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                {renderFilterButton("All", "all")}
                {renderFilterButton("Dispatched", "dispatched")}
                {renderFilterButton("Preparing", "cake preparing")}
                {renderFilterButton("Cancelled", "cancelled")}
                {renderFilterButton("Delivered", "Delivered")}
            </View>

            <FlatList
                data={filteredCakes()}
                renderItem={renderCakeItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D22B2B"]} tintColor="#D22B2B" />
                }
                ListEmptyComponent={renderEmptyState()}
            />


            <CancelModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                orderId={selectedCake}
                onSuccess={() => console.log("Order Cancelled Successfully")}

            />

        </SafeAreaView>
    )
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
    Thankyou: {
        backgroundColor: '#10b981', // Green color
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 5,
        marginBottom: 10,
    },
    thankyouText: {
        color: '#ffffff', // White text
        fontSize: 12,
        fontWeight: 'bold',
    },
})

