
import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
} from "react-native"
import { Ionicons, FontAwesome5 } from "@expo/vector-icons"
import axios from "axios"
import Razorpay from "react-native-razorpay"
import { format } from 'date-fns';
// Custom components
import DateSelector from "../Bookings/DateSelector"
import TimeSlotSelector from "../Bookings/TimeSlotSelector"
import BookingSummary from "../Bookings/BookingSummary"

// Hooks and constants

import useClinic from "../../../hooks/useClinic"
import useUserAddress from "../../../hooks/useUserAddress"
import { useToken } from "../../../hooks/useToken"
import useCoupons from "../../../hooks/useCoupons"
import useNotificationPermission from "../../../hooks/notification"
import useSettingsHook from "../../../hooks/useSettingsHooks"
import { getUser } from "../../../hooks/getUserHook"
import { API_END_POINT_URL_LOCAL } from "../../../constant/constant"

const BookingLabTests = ({ route, navigation }) => {
  // Get route params
  const { title, selectedLocationType, id, isImageing } = route.params || {}

  // State variables
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [bookingInProgress, setBookingInProgress] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [addressData, setAddressData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  })
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [isApplied, setIsApplied] = useState(false)
  const [totalAmount, setTotalAmount] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [existingBookings, setExistingBookings] = useState([])

  // Custom hooks
  const { clinics, getClinics } = useClinic()
  const { settings } = useSettingsHook()
  const { address, getAddress, createAddress } = useUserAddress()
  const { token, isLoggedIn } = useToken()
  const { coupons, cloading, error: couponError } = useCoupons("Lab Test")
  const { fcmToken } = useNotificationPermission()
  const user = getUser()

  // Get lab test booking settings
  const labTestSettings = settings?.labTestBookingTimes

  // Fetch service details
  const fetchService = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/LabTest-product/${id}`)
      if (response.data && response.data.success) {
        setService(response.data.data)

        // Set initial price based on location type
        const price =
          selectedLocationType === "Home"
            ? response.data.data.home_price_of_package_discount || response.data.data.home_price_of_package
            : response.data.data.discount_price || response.data.data.price

        setTotalAmount(price)

        // Calculate discount amount
        if (selectedLocationType === "Home") {
          if (response.data.data.home_price_of_package && response.data.data.home_price_of_package_discount) {
            setDiscountAmount(
              response.data.data.home_price_of_package - response.data.data.home_price_of_package_discount,
            )
          }
        } else {
          if (response.data.data.price && response.data.data.discount_price) {
            setDiscountAmount(response.data.data.price - response.data.data.discount_price)
          }
        }
      } else {
        setError("Failed to fetch service details")
      }
    } catch (error) {
      setError("Error connecting to server")
      console.error("Error fetching service:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id, selectedLocationType])

  // Fetch existing bookings for the selected date
  const fetchExistingBookings = useCallback(async (date) => {
    if (!date) return

    try {
      const formattedDate = date
      const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/bookings/lab-test/${formattedDate}`)
      console.log(response.data.data)
      if (response.data && response.data.success) {
        setExistingBookings(response.data.data || [])
      }
    } catch (error) {
      console.error("Error fetching existing bookings:", error)
      // Don't show error to user, just log it
    }
  }, [])


  useEffect(() => {
    fetchService()
    if (selectedLocationType === "Clinic") {
      getClinics()
    } else {
      getAddress()
    }
  }, [fetchService, getClinics, selectedLocationType])

  // Fetch bookings when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchExistingBookings(selectedDate)
    }
  }, [selectedDate, fetchExistingBookings])

  // Handle date selection
  const handleDateSelect = (date) => {
    // Format the date in YYYY-MM-DD format
    const formattedDate = format(new Date(date), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    console.log("Formatted Date: ", formattedDate);

    // Set the formatted date to the state
    setSelectedDate(formattedDate);

    // Reset time when the date changes
    setSelectedTime(null);
  }


  // Handle time selection
  const handleTimeSelect = (time) => {
    setSelectedTime(time)
  }

  // Handle address creation
  const handleAddAddress = async () => {
    if (!addressData.street || !addressData.city || !addressData.state || !addressData.zipCode) {
      Alert.alert("Error", "Please fill all address fields")
      return
    }

    try {
      const newAddress = await createAddress(addressData)
      if (newAddress) {
        setSelectedAddress(newAddress)
        setShowAddressModal(false)
        getAddress() // Refresh address list
      }
    } catch (err) {
      Alert.alert("Error", "Failed to create address")
    }
  }

  // Apply coupon
  const applyCoupon = (coupon) => {
    if (!coupon) return

    setSelectedCoupon(coupon)
    setIsApplied(true)
    setShowCouponModal(false)

    // Calculate discounted price
    const originalPrice =
      selectedLocationType === "Home"
        ? service?.home_price_of_package_discount || service?.home_price_of_package
        : service?.discount_price || service?.price

    let couponDiscountAmount = 0
    if (coupon.discountType === "Percentage") {
      couponDiscountAmount = (originalPrice * coupon.discountPercentage) / 100
    } else {
      couponDiscountAmount = coupon.discountPercentage // Fixed amount
    }

    const finalPrice = originalPrice - couponDiscountAmount

    setTotalAmount(finalPrice)
    setDiscountAmount((prev) => prev + couponDiscountAmount)
  }

  // Remove applied coupon
  const removeCoupon = () => {
    if (!selectedCoupon) return

    // Reset to original price
    const originalPrice =
      selectedLocationType === "Home"
        ? service?.home_price_of_package_discount || service?.home_price_of_package
        : service?.discount_price || service?.price

    // Recalculate discount amount
    let baseDiscountAmount = 0
    if (selectedLocationType === "Home") {
      if (service?.home_price_of_package && service?.home_price_of_package_discount) {
        baseDiscountAmount = service.home_price_of_package - service.home_price_of_package_discount
      }
    } else {
      if (service?.price && service?.discount_price) {
        baseDiscountAmount = service.price - service.discount_price
      }
    }

    setTotalAmount(originalPrice)
    setDiscountAmount(baseDiscountAmount)
    setSelectedCoupon(null)
    setIsApplied(false)
  }

  // Handle booking
  const handleBook = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please login to book an appointment", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("login") },
      ])
      return
    }

    // Validate required fields
    if (selectedLocationType === "Home" && !selectedAddress) {
      setError("Please select or add an address for home service")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (selectedLocationType === "Clinic" && !selectedClinic) {
      setError("Please select a clinic")
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!selectedDate || !selectedTime) {
      setError("Please select appointment date and time")
      setTimeout(() => setError(null), 3000)
      return
    }


    let date = new Date(selectedDate)
    if (date instanceof Date && !isNaN(date)) {
      date = date.toISOString().split("T")[0];
      console.log("ssssss", date); // Output: 2025-05-09
    } else {
      console.error("Invalid date sss:", selectedDate);
    }
    // Prepare booking data
    const bookingData = {
      labTest: id,
      clinic: selectedClinic?._id || "",
      bookingType: selectedLocationType || "clinic",
      selectedDate: date,
      selectedTime: selectedTime,
      address: selectedAddress?._id || "",
      couponCode: selectedCoupon?.code || "",
      couponDiscount: selectedCoupon
        ? selectedCoupon.discountType === "Percentage"
          ? (totalAmount * selectedCoupon.discountPercentage) / 100
          : selectedCoupon.discountPercentage
        : 0,
      totalPayableAmount: totalAmount,
      fcmToken: fcmToken || null,
    }

    try {
      setLoading(true)
      setBookingInProgress(true)

      const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/booking-lab-test`, bookingData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const { payment, booking } = response.data?.data

      // Configure Razorpay options
      const options = {
        description: "Lab Test Booking",
        image: service?.mainImage?.url || "https://i.ibb.co/cSHCKWHm/877c8e22-4df0-4f07-a857-e544208dc0f2.jpg",
        currency: "INR",
        key: payment?.key,
        amount: Number(payment?.amount) * 100,
        name: "Doggy World Care",
        order_id: payment?.orderId,
        prefill: {
          email: user?.email || "",
          contact: user?.phone || "",
          name: user?.name || "",
        },
        theme: { color: "#ff4d4d" },
      }

      // Open Razorpay
      Razorpay.open(options)
        .then(async (paymentData) => {
          // Payment successful
          console.log("Payment Success:", paymentData)

          // Verify payment on backend
          try {
            const verifyResponse = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/booking-verify-payment`, {
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_order_id: paymentData.razorpay_order_id,
              razorpay_signature: paymentData.razorpay_signature,
              bookingId: booking._id,
              type: "labtest",
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
    } catch (err) {
      console.error("Booking creation error:", err.response?.data || err)
      Alert.alert("Booking Issue", err.response?.data?.message || "An unexpected error occurred.")
      setError("Failed to book appointment. Please try again.")
      setTimeout(() => setError(null), 3000)
    } finally {
      setBookingInProgress(false)
      setLoading(false)
    }
  }

  // Helper function to check payment status for edge cases
  const checkPaymentStatus = async (bookingId) => {
    try {
      // Wait a few seconds to allow webhook processing
      setTimeout(async () => {
        const statusResponse = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/booking-status/${bookingId}/labtest`)

        if (statusResponse.data.status === "Confirmed") {
          Alert.alert("Booking Confirmed!", "Your Lab Test booking has been booked successfully.", [
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

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchService()
    if (selectedLocationType === "Home") {
      getAddress()
    }
  }, [fetchService, getAddress, selectedLocationType])

  // Loading state
  // if (loading && !refreshing) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#ff4d4d" />
  //       <Text style={styles.loadingText}>Loading...</Text>
  //     </View>
  //   )
  // }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book Lab Test</Text>
        <Text style={styles.subTitle}>{selectedLocationType === "Home" ? "Home Service" : "Clinic Visit"}</Text>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Service Details */}
      {service && (
        <View style={styles.serviceCard}>
          {service.mainImage && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: service.mainImage.url }} style={styles.serviceImage} resizeMode="cover" />
            </View>
          )}
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceTitle}>{service.title}</Text>
   

            <View style={styles.priceContainer}>
              {selectedLocationType === "Home" ? (
                <>
                  <Text style={styles.originalPrice}>₹{service.home_price_of_package}</Text>
                  <Text style={styles.discountPrice}>₹{service.home_price_of_package_discount}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.originalPrice}>₹{service.price}</Text>
                  <Text style={styles.discountPrice}>₹{service.discount_price}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Address Selection for Home Service */}
      {selectedLocationType === "Home" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Address</Text>

          {address && address.length > 0 ? (
            <View style={styles.addressList}>
              {address.map((addr, index) => (
                <TouchableOpacity
                  key={addr._id || index}
                  style={[
                    styles.addressItem,
                    selectedAddress && selectedAddress._id === addr._id && styles.selectedAddressItem,
                  ]}
                  onPress={() => setSelectedAddress(addr)}
                >
                  <View style={styles.addressContent}>
                    <Text style={styles.addressText}>
                      {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                    </Text>
                  </View>
                  {selectedAddress && selectedAddress._id === addr._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#ff4d4d" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noAddressText}>No addresses found</Text>
          )}

          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddressModal(true)}>
            <Text style={styles.addButtonText}>+ Add New Address</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clinic Selection */}
      {selectedLocationType === "Clinic" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Clinic</Text>

          {clinics && clinics.length > 0 ? (
            <View style={styles.clinicList}>
              {clinics.map((clinic, index) => (
                <TouchableOpacity
                  key={clinic._id || index}
                  style={[
                    styles.clinicItem,
                    selectedClinic && selectedClinic._id === clinic._id && styles.selectedClinicItem,
                  ]}
                  onPress={() => setSelectedClinic(clinic)}
                >
                  <View style={styles.clinicContent}>
                    <Text style={styles.clinicName}>{clinic.clinicName}</Text>
                    <Text style={styles.clinicAddress}>{clinic.address}</Text>
                  </View>
                  {selectedClinic && selectedClinic._id === clinic._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#ff4d4d" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noClinicText}>No clinics available</Text>
          )}
        </View>
      )}

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        {labTestSettings ? (
          <DateSelector bookingSettings={labTestSettings} onSelectDate={handleDateSelect} selectedDate={selectedDate} />
        ) : (
          <Text style={styles.noSettingsText}>Booking settings not available</Text>
        )}
      </View>

      {/* Time Selection */}
      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          {labTestSettings ? (
            <TimeSlotSelector
              bookingSettings={labTestSettings}
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
        <Text style={styles.sectionTitle}>Apply Coupon</Text>

        {isApplied && selectedCoupon ? (
          <View style={styles.appliedCouponContainer}>
            <View style={styles.appliedCoupon}>
              <Text style={styles.couponCode}>{selectedCoupon.code}</Text>
              <Text style={styles.couponDiscount}>
                {selectedCoupon.discountType === "Percentage"
                  ? `${selectedCoupon.discountPercentage}% OFF`
                  : `₹${selectedCoupon.discountPercentage} OFF`}
              </Text>
            </View>
            <TouchableOpacity style={styles.removeCouponButton} onPress={removeCoupon}>
              <Text style={styles.removeCouponText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.couponButton} onPress={() => setShowCouponModal(true)} disabled={cloading}>
            <FontAwesome5 name="ticket-alt" size={18} color="#ff4d4d" />
            <Text style={styles.couponButtonText}>{cloading ? "Loading coupons..." : "Select Coupon"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Booking Summary */}
      <BookingSummary
        service={service}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedLocation={selectedLocationType}
        selectedAddress={selectedAddress}
        selectedClinic={selectedClinic}
        appliedCoupon={selectedCoupon}
        totalAmount={totalAmount}
        discountAmount={discountAmount}
      />

      {/* Book Now Button */}
      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedDate ||
            !selectedTime ||
            (selectedLocationType === "Home" && !selectedAddress) ||
            (selectedLocationType === "Clinic" && !selectedClinic)) &&
          styles.disabledButton,
        ]}
        onPress={handleBook}
        disabled={
          bookingInProgress ||
          !selectedDate ||
          !selectedTime ||
          (selectedLocationType === "Home" && !selectedAddress) ||
          (selectedLocationType === "Clinic" && !selectedClinic)
        }
      >
        {bookingInProgress ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>Book Now</Text>
        )}
      </TouchableOpacity>

      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Street</Text>
              <TextInput
                style={styles.input}
                value={addressData.street}
                onChangeText={(text) => setAddressData((prev) => ({ ...prev, street: text }))}
                placeholder="Enter street address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={addressData.city}
                onChangeText={(text) => setAddressData((prev) => ({ ...prev, city: text }))}
                placeholder="Enter city"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={addressData.state}
                onChangeText={(text) => setAddressData((prev) => ({ ...prev, state: text }))}
                placeholder="Enter state"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Zip Code</Text>
              <TextInput
                style={styles.input}
                value={addressData.zipCode}
                onChangeText={(text) => setAddressData((prev) => ({ ...prev, zipCode: text }))}
                placeholder="Enter zip code"
                keyboardType="number-pad"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress}>
              <Text style={styles.saveButtonText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Coupon Modal */}
      <Modal
        visible={showCouponModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCouponModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Available Coupons</Text>
              <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

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
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subTitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 16,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  serviceDetails: {
    flex: 1,
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
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  originalPrice: {
    fontSize: 14,
    color: "#999",
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff4d4d",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  addressList: {
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedAddressItem: {
    borderColor: "#ff4d4d",
    backgroundColor: "#fff9f9",
  },
  addressContent: {
    flex: 1,
    marginRight: 10,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
  },
  noAddressText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
    fontStyle: "italic",
  },
  addButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#ff4d4d",
    fontWeight: "600",
    fontSize: 14,
  },
  clinicList: {
    marginBottom: 10,
  },
  clinicItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedClinicItem: {
    borderColor: "#ff4d4d",
    backgroundColor: "#fff9f9",
  },
  clinicContent: {
    flex: 1,
    marginRight: 10,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  clinicAddress: {
    fontSize: 14,
    color: "#666",
  },
  noClinicText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 10,
    fontStyle: "italic",
  },
  noSettingsText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
    fontStyle: "italic",
  },
  appliedCouponContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  appliedCoupon: {
    flex: 1,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  couponDiscount: {
    fontSize: 14,
    color: "#4CAF50",
  },
  removeCouponButton: {
    padding: 8,
  },
  removeCouponText: {
    color: "#ff4d4d",
    fontWeight: "600",
  },
  couponButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
  couponButtonText: {
    color: "#333",
    fontWeight: "600",
    marginLeft: 8,
  },
  bookButton: {
    backgroundColor: "#ff4d4d",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 20,
    shadowColor: "#ff4d4d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#ffb3b3",
    shadowOpacity: 0.1,
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#ff4d4d",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  couponList: {
    maxHeight: 400,
  },
  couponItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
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
    color: "#333",
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
  cloading: {
    marginVertical: 20,
  },
  couponError: {
    textAlign: "center",
    color: "#f44336",
    marginVertical: 20,
  },
  noCoupons: {
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
    fontStyle: "italic",
  },
})

export default BookingLabTests
