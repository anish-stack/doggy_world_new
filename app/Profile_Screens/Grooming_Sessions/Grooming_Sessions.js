
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from "react-native"
import { useCallback, useState, useEffect } from "react"
import { useNavigation } from "@react-navigation/native"
import { getUser } from "../../hooks/getUserHook"
import { Calendar, Clock, MapPin, Filter, Package, Scissors, Plus, Star } from "lucide-react-native"

import GroomReview from "./GroomReview"
import CancelModal from "./CancelModal"
import TopHeadPart from "../../layouts/TopHeadPart"

export default function Grooming_Sessions() {
    const navigation = useNavigation()
    const { orderData, getUserFnc, loading, error } = getUser()
    const [groomings, setGroomings] = useState([])
    const [refreshing, setRefreshing] = useState(false)
    const [openRateModel, setOpenRateModel] = useState(false)
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedGrooming, setSelectedGrooming] = useState(null)
    const [filterType, setFilterType] = useState("all")

    useEffect(() => {
        if (orderData) {
            setGroomings(orderData?.groomingPackages || [])
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

    const getFilteredGroomings = () => {
        if (filterType === "all") return groomings
        return groomings.filter((grooming) => grooming?.booking_status === filterType)
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "#f59e0b" // Amber
            case "completed":
                return "#10b981" // Green
            case "cancelled":
                return "#ef4444" // Red
            default:
                return "#6b7280" // Gray
        }
    }

    const renderServiceDetails = (grooming) => {
        if (grooming.Type === "General Booking") {
            return (
                <View style={styles.serviceDetails}>
                    <View style={styles.serviceType}>
                        <Scissors size={16} color="#6b7280" />
                        <Text style={styles.serviceTypeText}>General Booking</Text>
                    </View>
                    <Text style={styles.serviceName}>{grooming.grooming_service?.type || "Hair Cutting"}</Text>
                    <Text style={styles.servicePrice}>
                        ₹{grooming.grooming_service?.startPrice || "650"} - ₹{grooming.grooming_service?.endPrice || "1000"}
                    </Text>
                    {grooming.grooming_service?.anyOffer && (
                        <View style={styles.offerTag}>
                            <Text style={styles.offerText}>{grooming.grooming_service?.offer}</Text>
                        </View>
                    )}
                </View>
            )
        } else if (grooming.Type === "Package") {
            return (
                <View style={styles.serviceDetails}>
                    <View style={styles.serviceType}>
                        <Package size={16} color="#6b7280" />
                        <Text style={styles.serviceTypeText}>Package</Text>
                    </View>
                    <Text style={styles.serviceName}>{grooming.Package?.name || "Grooming Package"}</Text>
                    <Text style={styles.servicePrice}>₹{grooming.Package?.price || "1500"}</Text>
                </View>
            )
        } else if (grooming.Type === "Customize Booking") {
            return (
                <View style={styles.serviceDetails}>
                    <View style={styles.serviceType}>
                        <Plus size={16} color="#6b7280" />
                        <Text style={styles.serviceTypeText}>Customize Booking</Text>
                    </View>
                    {grooming.Customize.map((service, index) => (
                        <View key={index} style={styles.customService}>
                            <Text style={styles.customServiceName}>{service.ServiceName}</Text>
                            <Text style={styles.customServiceType}>{service.ServiceType}</Text>
                            <Text style={styles.customServicePrice}>{service.Price}</Text>
                            {service.Details && <Text style={styles.customServiceDetails}>{service.Details}</Text>}
                        </View>
                    ))}
                </View>
            )
        }
        return null
    }

    return (
        <>

            <TopHeadPart title="My Grooming Sessions" fnc={() => console.log("I am ")} />

            <View style={styles.container}>


                <View style={styles.filterTabs}>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === "all" && styles.activeFilterTab]}
                        onPress={() => setFilterType("all")}
                    >
                        <Text style={[styles.filterTabText, filterType === "all" && styles.activeFilterTabText]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === "pending" && styles.activeFilterTab]}
                        onPress={() => setFilterType("pending")}
                    >
                        <Text style={[styles.filterTabText, filterType === "pending" && styles.activeFilterTabText]}>Pending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterTab, filterType === "completed" && styles.activeFilterTab]}
                        onPress={() => setFilterType("completed")}
                    >
                        <Text style={[styles.filterTabText, filterType === "completed" && styles.activeFilterTabText]}>
                            Completed
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={styles.sessionsList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {getFilteredGroomings().length > 0 ? (
                        getFilteredGroomings().map((grooming, index) => (
                            <View key={index} style={styles.sessionCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.petInfo}>
                                        <Text style={styles.petName}>{grooming.pet?.petName || "Your Pet"}</Text>
                                        <Text style={styles.petBreed}>{grooming.pet?.Breed || "Dog"}</Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor: getStatusColor(grooming?.booking_status) + "20",
                                                borderColor: getStatusColor(grooming?.booking_status),
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.statusText, { color: getStatusColor(grooming?.booking_status) }]}>
                                            {grooming?.booking_status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardBody}>
                                    {renderServiceDetails(grooming)}

                                    <View style={styles.appointmentDetails}>
                                        <View style={styles.detailRow}>
                                            <Calendar size={16} color="#6b7280" />
                                            <Text style={styles.detailText}>{formatDate(grooming.Date_of_Service)}</Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Clock size={16} color="#6b7280" />
                                            <Text style={styles.detailText}>{formatTime(grooming.Time)}</Text>
                                        </View>
                                        {grooming.clinic?.clinic_name && (
                                            <View style={styles.detailRow}>
                                                <MapPin size={16} color="#6b7280" />
                                                <Text style={styles.detailText}>{grooming.clinic.clinic_name}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.cardFooter}>
                                    {grooming?.booking_status === "pending" && (
                                        <TouchableOpacity onPress={() => { setModalVisible(true), setSelectedGrooming(grooming) }} style={styles.cancelButton}>
                                            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                                        </TouchableOpacity>
                                    )}


                                    {grooming?.service_complete && grooming?.is_rate && (
                                        <View style={styles.ratingContainer}>
                                            <View style={styles.infoRow}>

                                                <Text style={styles.ratingText}>
                                                    Thank you for rating our service {grooming?.rate} stars!
                                                </Text>
                                            </View>
                                            <Text style={styles.feedbackText}>Your feedback means the world to us. 🌟</Text>
                                        </View>
                                    )}


                                    {grooming?.booking_status === "completed" && !grooming?.is_rate && !openRateModel && (
                                        <TouchableOpacity
                                            style={styles.rateButton}
                                            onPress={() => {
                                                setSelectedGrooming(grooming)
                                                setOpenRateModel(true)
                                            }}
                                        >
                                            <Text style={styles.rateButtonText}>Rate Service</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No grooming sessions found</Text>
                            <Text style={styles.emptyStateSubText}>Pull down to refresh or book a new session</Text>
                        </View>
                    )}
                </ScrollView>
                <GroomReview
                    open={openRateModel}
                    close={() => setOpenRateModel(false)}
                    appointment={selectedGrooming}
                    isGrooming={true}
                />
                <CancelModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    appointmentId={selectedGrooming?.id}

                    onSuccess={() => console.log("selectedGrooming cancelled successfully!")}
                />
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        padding: 8,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
    },
    filterButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#f3f4f6",
    },
    filterTabs: {
        flexDirection: "row",
        marginBottom: 16,
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 4,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 6,
    },
    activeFilterTab: {
        backgroundColor: "#f3f4f6",
    },
    filterTabText: {
        fontSize: 14,
        color: "#6b7280",
    },
    activeFilterTabText: {
        color: "#111827",
        fontWeight: "600",
    },
    sessionsList: {
        flex: 1,
    },
    sessionCard: {
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    petInfo: {
        flexDirection: "column",
    },
    petName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    petBreed: {
        fontSize: 14,
        color: "#6b7280",
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
        paddingTop: 12,
    },
    serviceDetails: {
        marginBottom: 12,
    },
    serviceType: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    serviceTypeText: {
        fontSize: 14,
        color: "#6b7280",
        marginLeft: 6,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    servicePrice: {
        fontSize: 14,
        color: "#059669",
        fontWeight: "500",
    },
    offerTag: {
        backgroundColor: "#dcfce7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 6,
        alignSelf: "flex-start",
    },
    offerText: {
        fontSize: 12,
        color: "#059669",
    },
    customService: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    customServiceName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    customServiceType: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 2,
    },
    customServicePrice: {
        fontSize: 14,
        color: "#059669",
        fontWeight: "500",
    },
    customServiceDetails: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 4,
    },
    appointmentDetails: {
        marginTop: 12,
        backgroundColor: "#f9fafb",
        padding: 12,
        borderRadius: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: "#4b5563",
        marginLeft: 8,
    },
    cardFooter: {
        marginTop: 16,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: "#fee2e2",
    },
    cancelButtonText: {
        fontSize: 14,
        color: "#ef4444",
        fontWeight: "500",
    },
    rateButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: "#dbeafe",
    },
    rateButtonText: {
        fontSize: 14,
        color: "#3b82f6",
        fontWeight: "500",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 8,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
    },

    ratingContainer: {
        backgroundColor: "#FFFBEB",
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#FFE7A0",
    },
    ratingText: {
        marginLeft: 8,
        fontSize: 14,
        color: "#444",
        fontWeight: "600",
    },
    feedbackText: {
        marginLeft: 26,
        fontSize: 13,
        color: "#666",
        fontStyle: "italic",
    },
})

