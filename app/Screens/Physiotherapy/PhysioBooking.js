
import { useState, useEffect, useCallback } from "react"
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
    Platform,
    Linking,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import axios from "axios"
import { format, addDays, isSameDay } from "date-fns"
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import useClinic from "../../hooks/useClinic"
import useSettingsHook from "../../hooks/useSettingsHooks"
import { useToken } from "../../hooks/useToken"
import useCoupons from "../../hooks/useCoupons"
import useNotificationPermission from "../../hooks/notification"
import { API_END_POINT_URL_LOCAL } from "../../constant/constant"
import TimeSlotSelector from "../NewLabs/Bookings/TimeSlotSelector"
import RazorpayCheckout from "react-native-razorpay"
import DateSelector from "../NewLabs/Bookings/DateSelector"
import { getUser } from "../../hooks/getUserHook"

const { width } = Dimensions.get("window")

export default function PhysioBooking() {
    const navigation = useNavigation()
    const route = useRoute()
    const { service } = route.params || {}

    // States
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedCoupon, setSelectedCoupon] = useState(null)
    const [isApplied, setIsApplied] = useState(false)
    const [totalAmount, setTotalAmount] = useState(service?.discountPrice || service?.price || 0)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [existingBookings, setExistingBookings] = useState([])
    const [selectedTime, setSelectedTime] = useState(null)
    const [loading, setLoading] = useState(false)
    const [bookingInProgress, setBookingInProgress] = useState(false)
    const [error, setError] = useState(null)
    const [showCoupons, setShowCoupons] = useState(false)
    const [paymentProcessing, setPaymentProcessing] = useState(false)

    // Hooks
    const { clinics, getClinics } = useClinic()
    const { settings } = useSettingsHook()
    const { token, isLoggedIn } = useToken()
    const { coupons, cloading, error: couponError } = useCoupons("physiotherapy")
    const { fcmToken } = useNotificationPermission()



    const user = getUser()

    // Get physiotherapy booking settings
    const physioSettings = settings?.physiotherapyBookingTimes || []
 

    useEffect(() => {
        
        const price = service?.discountPrice || service?.price || 0
        setTotalAmount(price)
    }, [service])

    const fetchExistingBookings = useCallback(async (date) => {
        if (!date) return

        try {
            setLoading(true)
            const formattedDate = date
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-order-physio/${formattedDate}`)

            // console.log("Length",response.data.data.length)
            if (response.data && response.data.success) {
                setExistingBookings(response.data.data || [])
            }
        } catch (error) {
            console.error("Error fetching existing bookings:", error)
            setError("Failed to load available time slots. Please try again.")
            setTimeout(() => setError(null), 3000)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (selectedDate) {
            fetchExistingBookings(selectedDate)
        }
    }, [selectedDate, fetchExistingBookings])

    const handleDateSelect = (date) => {
        const formattedDate = format(new Date(date), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        setSelectedDate(formattedDate)
        setSelectedTime(null)
    }

    const handleTimeSelect = (time) => {
        setSelectedTime(time)
    }

    const applyCoupon = (coupon) => {
        // Calculate discount
        let discount = 0
        const basePrice = service?.discountPrice || service?.price || 0

        if (coupon.discountType === "Percentage") {
            discount = (basePrice * coupon.discountPercentage) / 100
        } else {
            discount = coupon.discountPercentage
        }

        // Apply maximum discount if applicable
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount
        }

        // Calculate new total
        const newTotal = basePrice - discount

        setSelectedCoupon(coupon)
        setDiscountAmount(discount)
        setTotalAmount(newTotal)
        setIsApplied(true)
        setShowCoupons(false)

        Alert.alert("Coupon Applied!", `Coupon ${coupon.code} applied successfully. You saved ₹${discount.toFixed(2)}!`)
    }

    const removeCoupon = () => {
        const basePrice = service?.discountPrice || service?.price || 0
        setSelectedCoupon(null)
        setDiscountAmount(0)
        setTotalAmount(basePrice)
        setIsApplied(false)
    }

    const handleBook = async () => {
        if (!isLoggedIn) {
            Alert.alert("Login Required", "Please login to book an appointment", [
                { text: "Cancel", style: "cancel" },
                { text: "Login", onPress: () => navigation.navigate("login") },
            ])
            return
        }

        if (!selectedDate || !selectedTime) {
            setError("Please select appointment date and time")
            setTimeout(() => setError(null), 3000)
            return
        }

        let date = new Date(selectedDate)
        if (date instanceof Date && !isNaN(date)) {
            date = date.toISOString().split("T")[0]
        } else {
            console.error("Invalid date:", selectedDate)
            setError("Invalid date selected. Please try again.")
            setTimeout(() => setError(null), 3000)
            return
        }

        // Prepare booking data
        const bookingData = {
            physio: service?._id,
            bookingType: "clinic",
            selectedDate: date,
            selectedTime: selectedTime,
            couponCode: selectedCoupon?.code || "",
            couponDiscount: discountAmount,
            totalPayableAmount: totalAmount,
            fcmToken: fcmToken || null,
        }

        try {
            setLoading(true)
            setBookingInProgress(true)
            setPaymentProcessing(true)

            const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/booking-physio`, bookingData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const { payment, booking } = response.data?.data

            // Configure Razorpay options
            const options = {
                description: "Physiotherapy Booking",
                image: service?.imageUrl[0].url || "https://i.ibb.co/cSHCKWHm/877c8e22-4df0-4f07-a857-e544208dc0f2.jpg",
                currency: "INR",
                key: payment?.key,
                amount: Number(payment?.amount) * 100,
                name: "Doggy World Care",
                order_id: payment?.orderId,
                prefill: {
                    contact: user?.petOwnertNumber || "",
                    name: user?.petname || "",
                },
                theme: { color: "#ff4d4d" },
            }

            // Open Razorpay
            RazorpayCheckout.open(options)
                .then(async (paymentData) => {

                    console.log("Payment Success:", paymentData)

                    // Verify payment on backend
                    try {
                        const verifyResponse = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/booking-verify-payment`, {
                            razorpay_payment_id: paymentData.razorpay_payment_id,
                            razorpay_order_id: paymentData.razorpay_order_id,
                            razorpay_signature: paymentData.razorpay_signature,
                            bookingId: booking._id,
                            type: "physiotherapy",
                            fcm: fcmToken || null,
                        })

                        if (verifyResponse.data.success) {
                            // Payment verified successfully
                            Alert.alert("Booking Confirmed!", "Your appointment has been booked successfully.", [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        navigation.reset({
                                            index: 0,
                                            routes: [{ name: "thankyou", params: { booking: booking } }],
                                        })
                                    },
                                },
                            ])
                        } else {
                            Alert.alert("Payment Verification Failed", "Please contact support with your payment ID.")
                        }
                    } catch (verifyError) {
                        console.error("Verification error:", verifyError)
                        Alert.alert(
                            "Verification Issue",
                            "Your payment was processed, but we could not verify it. Please contact support.",
                        )
                    }
                })
                .catch((error) => {
                    console.log("Payment Error:", error)
                    checkPaymentStatus(booking._id)

                    if (error.code === "PAYMENT_CANCELLED") {
                        Alert.alert("Booking Cancelled", "You cancelled the payment process.")
                    } else {
                        Alert.alert("Payment Failed", "Unable to process payment. Please try again.")
                    }
                })
                .finally(() => {
                    setPaymentProcessing(false)
                })
        } catch (err) {
            console.error("Booking creation error:", err.response?.data || err)
            Alert.alert("Booking Issue", err.response?.data?.message || "An unexpected error occurred.")
            setError("Failed to book appointment. Please try again.")
            setTimeout(() => setError(null), 3000)
            setPaymentProcessing(false)
        } finally {
            setBookingInProgress(false)
            setLoading(false)
        }
    }

    const checkPaymentStatus = async (bookingId) => {
        try {
            setTimeout(async () => {
                const statusResponse = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/booking-status/${bookingId}/physio`)

                if (statusResponse.data.status === "Confirmed") {
                    Alert.alert("Booking Confirmed!", "Your appointment has been booked successfully.", [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate("BookingSuccess", { booking: statusResponse.data.booking }),
                        },
                    ])
                }
            }, 3000)
        } catch (error) {
            console.error("Status check error:", error)
        }
    }

    if (paymentProcessing) {
        return (
            <View style={styles.loadingContainer}>

                <Text style={styles.loadingText}>Processing Payment...</Text>
                <Text style={styles.loadingSubtext}>Please do not close the app</Text>
            </View>
        )
    }
    if (!service) {
        return <View><Text>No Service</Text></View>
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Appointment</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Service Info */}
                <View style={styles.serviceInfoCard}>
                    <View style={styles.serviceImageContainer}>
                        {service.imageUrl && service.imageUrl.length > 0 && (
                            <Image source={{ uri: service.imageUrl[0].url }} style={styles.serviceImage} resizeMode="cover" />
                        )}
                    </View>
                    <View style={styles.serviceDetails}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <Text style={styles.serviceDesc} numberOfLines={2}>
                            {service.smallDesc}
                        </Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.servicePrice}>₹{service.discountPrice || service.price}</Text>
                            {service.discountPrice && service.discountPrice < service.price && (
                                <Text style={styles.originalPrice}>₹{service.price}</Text>
                            )}
                            {service.popular && (
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularText}>Popular</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Hospital Info */}
                <View style={styles.hospitalCard}>
                    <View style={styles.hospitalHeader}>
                        <FontAwesome5 name="hospital" size={20} color="#ff4d4d" />
                        <Text style={styles.hospitalTitle}>Doggy World Veterinary Hospital</Text>
                    </View>
                    <Text style={styles.hospitalAddress}>
                        Plot 147, Pocket B, 6, Halar Rd, C Block, Sector 8B, Rohini, New Delhi, Delhi, 110085
                    </Text>
                    <TouchableOpacity
                        style={styles.directionButton}
                        onPress={() => {
                            // Open maps with directions
                            const address = "Doggy World Veterinary Hospital, Rohini, Delhi"
                            const url = Platform.select({
                                ios: `maps:0,0?q=${address}`,
                                android: `geo:0,0?q=${address}`,
                            })
                            Linking.openURL(url)
                        }}
                    >
                        <MaterialIcons name="directions" size={16} color="white" />
                        <Text style={styles.directionButtonText}>Get Directions</Text>
                    </TouchableOpacity>
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="calendar" size={20} color="#ff4d4d" style={styles.sectionIcon} />
                        Select Date
                    </Text>
                    {physioSettings ? (
                        <DateSelector bookingSettings={physioSettings} onSelectDate={handleDateSelect} selectedDate={selectedDate} />
                    ) : (
                        <View style={styles.noSettingsContainer}>
                            <ActivityIndicator size="small" color="#ff4d4d" />
                            <Text style={styles.noSettingsText}>Loading available dates...</Text>
                        </View>
                    )}
                </View>

                {/* Time Selection */}
                {selectedDate && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            <Ionicons name="time" size={20} color="#ff4d4d" style={styles.sectionIcon} />
                            Select Time
                        </Text>
                        {loading ? (
                            <View style={styles.loadingTimeSlots}>
                                <ActivityIndicator size="small" color="#ff4d4d" />
                                <Text style={styles.loadingTimeSlotsText}>Loading available time slots...</Text>
                            </View>
                        ) : physioSettings ? (
                            <TimeSlotSelector
                                bookingSettings={physioSettings}
                                selectedDate={selectedDate}
                                onSelectTime={handleTimeSelect}
                                selectedTime={selectedTime}
                                existingBookings={existingBookings}
                            />
                        ) : (
                            <Text style={styles.noSettingsText}>Booking settings not available</Text>
                        )}
                    </View>
                )}

                {/* Coupon Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <MaterialIcons name="local-offer" size={20} color="#ff4d4d" style={styles.sectionIcon} />
                        Apply Coupon
                    </Text>

                    {isApplied && selectedCoupon ? (
                        <View style={styles.appliedCouponContainer}>
                            <View style={styles.appliedCoupon}>
                                <View>
                                    <Text style={styles.appliedCouponCode}>{selectedCoupon.code}</Text>
                                    <Text style={styles.appliedCouponDiscount}>You saved ₹{discountAmount.toFixed(2)}</Text>
                                </View>
                                <TouchableOpacity style={styles.removeCouponButton} onPress={removeCoupon}>
                                    <Text style={styles.removeCouponText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.couponButton} onPress={() => setShowCoupons(!showCoupons)}>
                            <Text style={styles.couponButtonText}>{showCoupons ? "Hide Coupons" : "View Available Coupons"}</Text>
                            <Ionicons name={showCoupons ? "chevron-up" : "chevron-down"} size={20} color="#ff4d4d" />
                        </TouchableOpacity>
                    )}

                    {showCoupons && (
                        <View style={styles.couponsContainer}>
                            {cloading ? (
                                <ActivityIndicator size="large" color="#ff4d4d" style={styles.cloading} />
                            ) : couponError ? (
                                <Text style={styles.couponError}>Failed to load coupons</Text>
                            ) : coupons && coupons.length > 0 ? (
                                <ScrollView style={styles.couponList}>
                                    {coupons.map((coupon) => (
                                        <TouchableOpacity key={coupon._id} style={styles.couponItem} onPress={() => applyCoupon(coupon)}>
                                            <View style={styles.couponHeader}>
                                                <Text style={styles.couponCodeBig}>{coupon.code}</Text>
                                                <Text style={styles.couponDiscountBig}>
                                                    {coupon.discountType === "Percentage"
                                                        ? `${coupon.discountPercentage}% OFF`
                                                        : `₹${coupon.discountPercentage} OFF`}
                                                </Text>
                                            </View>
                                            <Text style={styles.couponDescription}>{coupon.description}</Text>
                                            <Text style={styles.couponExpiry}>
                                                Valid till: {new Date(coupon.expirationDate).toLocaleDateString()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text style={styles.noCoupons}>No coupons available</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Price Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <MaterialIcons name="receipt" size={20} color="#ff4d4d" style={styles.sectionIcon} />
                        Price Details
                    </Text>
                    <View style={styles.priceDetailsCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Service Price</Text>
                            <Text style={styles.priceValue}>₹{service.discountPrice || service.price}</Text>
                        </View>

                        {isApplied && selectedCoupon && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Coupon Discount</Text>
                                <Text style={styles.discountValue}>- ₹{discountAmount.toFixed(2)}</Text>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Error Message */}
                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Bottom Spacing */}
                <View style={styles.bottomSpace} />
            </ScrollView>

            {/* Book Now Button */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomBarPrice}>
                    <Text style={styles.bottomBarPriceLabel}>Total</Text>
                    <Text style={styles.bottomBarPriceValue}>₹{totalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity
                    style={styles.bookNowButton}
                    onPress={handleBook}
                    disabled={bookingInProgress || !selectedDate || !selectedTime}
                >
                    {bookingInProgress ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Text style={styles.bookNowButtonText}>Book Now</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f8f8",
    },
    header: {
        backgroundColor: "#ff4d4d",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
    },
    headerRight: {
        width: 24,
    },
    scrollView: {
        flex: 1,
    },
    serviceInfoCard: {
        backgroundColor: "white",
        margin: 16,
        borderRadius: 12,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        flexDirection: "row",
    },
    serviceImageContainer: {
        width: 100,
        height: 100,
    },
    serviceImage: {
        width: "100%",
        height: "100%",
    },
    serviceDetails: {
        flex: 1,
        padding: 12,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    serviceDesc: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#ff4d4d",
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 16,
        color: "#999",
        textDecorationLine: "line-through",
        marginRight: 8,
    },
    popularBadge: {
        backgroundColor: "#ff4d4d",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: "auto",
    },
    popularText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    hospitalCard: {
        backgroundColor: "white",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    hospitalHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    hospitalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginLeft: 8,
    },
    hospitalAddress: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
        lineHeight: 20,
    },
    directionButton: {
        backgroundColor: "#ff4d4d",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: "flex-start",
    },
    directionButtonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
        marginLeft: 4,
    },
    section: {
        backgroundColor: "white",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    sectionIcon: {
        marginRight: 8,
    },
    dateScrollContainer: {
        paddingBottom: 8,
    },
    dateItem: {
        width: 70,
        height: 90,
        backgroundColor: "#f0f0f0",
        borderRadius: 12,
        marginRight: 10,
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        position: "relative",
    },
    selectedDateItem: {
        backgroundColor: "#ff4d4d",
    },
    dateMonth: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    dateDay: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    dateDayName: {
        fontSize: 14,
        color: "#666",
        marginTop: 4,
    },
    selectedDateText: {
        color: "white",
    },
    todayBadge: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "#4CAF50",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    todayText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
    },
    noSettingsContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        flexDirection: "row",
    },
    noSettingsText: {
        color: "#666",
        fontSize: 14,
        marginLeft: 8,
    },
    loadingTimeSlots: {
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        flexDirection: "row",
    },
    loadingTimeSlotsText: {
        color: "#666",
        fontSize: 14,
        marginLeft: 8,
    },
    couponButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f0f0f0",
        padding: 12,
        borderRadius: 8,
    },
    couponButtonText: {
        color: "#333",
        fontSize: 16,
    },
    couponsContainer: {
        marginTop: 12,
    },
    cloading: {
        marginVertical: 16,
    },
    couponError: {
        color: "#ff4d4d",
        textAlign: "center",
        marginVertical: 16,
    },
    couponList: {
        maxHeight: 300,
    },
    couponItem: {
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderStyle: "dashed",
    },
    couponHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    couponCodeBig: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#ff4d4d",
    },
    couponDiscountBig: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#4CAF50",
    },
    couponDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    couponExpiry: {
        fontSize: 12,
        color: "#999",
    },
    appliedCouponContainer: {
        backgroundColor: "#f0f0f0",
        borderRadius: 8,
        padding: 2,
    },
    appliedCoupon: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        borderStyle: "dashed",
        backgroundColor: "#fff",
    },
    appliedCouponCode: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ff4d4d",
    },
    appliedCouponDiscount: {
        fontSize: 14,
        color: "#4CAF50",
    },
    removeCouponButton: {
        backgroundColor: "#f0f0f0",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    removeCouponText: {
        color: "#ff4d4d",
        fontSize: 14,
        fontWeight: "bold",
    },
    priceDetailsCard: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 16,
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 16,
        color: "#666",
    },
    priceValue: {
        fontSize: 16,
        color: "#333",
    },
    discountValue: {
        fontSize: 16,
        color: "#4CAF50",
        fontWeight: "bold",
    },
    divider: {
        height: 1,
        backgroundColor: "#ddd",
        marginVertical: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#ff4d4d",
    },
    errorContainer: {
        backgroundColor: "#ffebee",
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    errorText: {
        color: "#ff4d4d",
        textAlign: "center",
    },
    bottomSpace: {
        height: 80,
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#eee",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bottomBarPrice: {
        flex: 1,
    },
    bottomBarPriceLabel: {
        fontSize: 14,
        color: "#666",
    },
    bottomBarPriceValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#333",
    },
    bookNowButton: {
        backgroundColor: "#ff4d4d",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flex: 1,
        marginLeft: 16,
    },
    bookNowButtonText: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        marginRight: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
    },
    lottieAnimation: {
        width: 200,
        height: 200,
    },
    loadingText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#ff4d4d",
        marginTop: 20,
    },
    loadingSubtext: {
        fontSize: 16,
        color: "#666",
        marginTop: 8,
    },
})
