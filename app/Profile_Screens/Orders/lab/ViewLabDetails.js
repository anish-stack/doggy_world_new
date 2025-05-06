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
import { useState, useMemo, useCallback } from "react"
import { useNavigation, useRoute } from "@react-navigation/native"
import TopHeadPart from "../../../layouts/TopHeadPart"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

export default function ViewLabDetails() {
  const navigation = useNavigation()
  const route = useRoute()
  const { labBooking } = route.params
  const [loading, setLoading] = useState(false)

  const formatDate = useCallback((dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }, [])

  const getStatus = useMemo(() => {
    if (labBooking.isBookingCancel) return "cancelled"
    if (labBooking.is_order_complete) return "completed"
    return "pending"
  }, [labBooking])

  const getStatusColor = useMemo(() => {
    switch (getStatus.toLowerCase()) {
      case "pending":
        return "#f59e0b"
      case "completed":
        return "#10b981"
      case "cancelled":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }, [getStatus])

  const handleCancelBooking = useCallback(() => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this lab test/vaccination?", [
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
            Alert.alert("Booking Cancelled", "Your lab test/vaccination has been cancelled successfully.", [
              {
                text: "OK",
                onPress: () => navigation.goBack(),
              },
            ])
          }, 1500)
        },
      },
    ])
  }, [navigation])

  const handleCall = useCallback(() => {
    if (labBooking.clinic?.contact_details) {
      Alert.alert("Contact Clinic", "Would you like to call the clinic?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${labBooking.clinic.contact_details}`),
        },
      ])
    }
  }, [labBooking])

  const handleViewLocation = useCallback(() => {
    if (labBooking.clinic?.Map_Location) {
      Linking.openURL(labBooking.clinic.Map_Location)
    }
  }, [labBooking])

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

  const totalSavings = useMemo(() => {
    return Number.parseFloat(labBooking.Total_Discount || 0)
  }, [labBooking])

  const totalAmount = useMemo(() => {
    return Number.parseFloat(labBooking.Total_Price || 0)
  }, [labBooking])

  const payableAmount = useMemo(() => {
    return Number.parseFloat(labBooking.Payable_Amount || 0)
  }, [labBooking])

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Processing your request...</Text>
        </View>
      )}

      <TopHeadPart title="Booking Details" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor + "15" }]}>
          <View style={styles.statusIconContainer}>
            <MaterialCommunityIcons
              name={
                getStatus === "completed"
                  ? "check-circle"
                  : getStatus === "cancelled"
                    ? "close-circle"
                    : "clock-outline"
              }
              size={24}
              color={getStatusColor}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusTitle, { color: getStatusColor }]}>
              {getStatus.charAt(0).toUpperCase() + getStatus.slice(1)}
            </Text>
            <Text style={styles.statusDescription}>
              {getStatus === "pending"
                ? "Your booking is confirmed"
                : getStatus === "completed"
                  ? "Your tests/vaccinations have been completed"
                  : "Your booking has been cancelled"}
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
              <Text style={styles.detailValue}>{labBooking.documentId}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome name="calendar" size={16} color="#666" />
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>{formatDate(labBooking.Booking_Date)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={16} color="#666" />
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{labBooking.Time_Of_Test}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome name="calendar-check-o" size={16} color="#666" />
              <Text style={styles.detailLabel}>Booked On:</Text>
              <Text style={styles.detailValue}>{formatDate(labBooking.createdAt)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="notifications" size={16} color="#666" />
              <Text style={styles.detailLabel}>Notification:</Text>
              <Text style={styles.detailValue}>
                {labBooking.whatsapp_notification_done ? "WhatsApp notification sent" : "No notification sent"}
              </Text>
            </View>
          </View>
        </View>

        {/* Pet Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Pet Information</Text>
          <View style={styles.petCard}>
            <View style={styles.petImageContainer}>
              {/* <Image source={require("../../../assets/pet-placeholder.png")} style={styles.petImage} /> */}
            </View>
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{labBooking.auth?.petName || "Pet"}</Text>

              <View style={styles.petDetailRow}>
                <MaterialCommunityIcons name="dog" size={16} color="#666" />
                <Text style={styles.petDetailLabel}>Type:</Text>
                <Text style={styles.petDetailValue}>{labBooking.auth?.PetType || "Not specified"}</Text>
              </View>

              <View style={styles.petDetailRow}>
                <MaterialCommunityIcons name="dog-side" size={16} color="#666" />
                <Text style={styles.petDetailLabel}>Breed:</Text>
                <Text style={styles.petDetailValue}>{labBooking.auth?.Breed || "Not specified"}</Text>
              </View>

              <View style={styles.petDetailRow}>
                <MaterialIcons name="cake" size={16} color="#666" />
                <Text style={styles.petDetailLabel}>Age:</Text>
                <Text style={styles.petDetailValue}>{labBooking.auth?.Age || "Not specified"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tests/Vaccinations */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tests & Vaccinations</Text>
          {labBooking.Test && labBooking.Test.length > 0 ? (
            labBooking.Test.map((test, index) => (
              <View key={index} style={styles.testCard}>
                <View style={styles.testHeader}>
                  <Text style={styles.testName}>{test.Test_Name}</Text>
                  {test.Is_Ultarasound && (
                    <View style={styles.ultrasoundBadge}>
                      <Text style={styles.ultrasoundText}>Ultrasound</Text>
                    </View>
                  )}
                </View>

                <View style={styles.testDetails}>
                  <View style={styles.testDetailRow}>
                    <Text style={styles.testDetailLabel}>Type:</Text>
                    <Text style={styles.testDetailValue}>{test.Type_Of_Test || "Standard"}</Text>
                  </View>

                  <View style={styles.testPriceContainer}>
                    <View style={styles.testPriceRow}>
                      <Text style={styles.testPriceLabel}>Original Price:</Text>
                      <Text style={styles.testOriginalPrice}>₹{test.Test_Price}</Text>
                    </View>

                    <View style={styles.testPriceRow}>
                      <Text style={styles.testPriceLabel}>Discounted Price:</Text>
                      <Text style={styles.testDiscountPrice}>₹{test.Discount_Price}</Text>
                    </View>

                    <View style={styles.testPriceRow}>
                      <Text style={styles.testPriceLabel}>You Save:</Text>
                      <Text style={styles.testSavings}>
                        ₹{Number.parseFloat(test.Test_Price) - Number.parseFloat(test.Discount_Price)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noTestsContainer}>
              <MaterialIcons name="error-outline" size={24} color="#666" />
              <Text style={styles.noTestsText}>No tests or vaccinations found</Text>
            </View>
          )}
        </View>

        {/* Clinic Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Clinic Information</Text>
          <View style={styles.clinicCard}>
            <Text style={styles.clinicName}>{labBooking.clinic?.clinic_name}</Text>
            <Text style={styles.clinicAddress}>{labBooking.clinic?.Address}</Text>
            <Text style={styles.clinicHours}>{labBooking.clinic?.time}</Text>

            <View style={styles.clinicRatingContainer}>
              <MaterialIcons name="star" size={16} color="#f59e0b" />
              <Text style={styles.clinicRating}>{labBooking.clinic?.Rating || "4.5"}</Text>
            </View>

            <View style={styles.clinicButtonsContainer}>
              <TouchableOpacity style={styles.clinicButton} onPress={handleCall}>
                <MaterialIcons name="phone" size={16} color="#4F46E5" />
                <Text style={styles.clinicButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.clinicButton} onPress={handleViewLocation}>
                <MaterialIcons name="location-on" size={16} color="#4F46E5" />
                <Text style={styles.clinicButtonText}>View Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Offer Information */}
        {labBooking.offer && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Applied Offer</Text>
            <View style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <MaterialIcons name="local-offer" size={20} color="#4F46E5" />
                <Text style={styles.offerCode}>{labBooking.offer.Code}</Text>
              </View>

              <Text style={styles.offerDescription}>{labBooking.offer.desc}</Text>

              <View style={styles.offerDetails}>
                <View style={styles.offerDetailRow}>
                  <Text style={styles.offerDetailLabel}>Minimum Amount:</Text>
                  <Text style={styles.offerDetailValue}>₹{labBooking.offer.minimum_amount}</Text>
                </View>

                <View style={styles.offerDetailRow}>
                  <Text style={styles.offerDetailLabel}>Maximum Discount:</Text>
                  <Text style={styles.offerDetailValue}>₹{labBooking.offer.upto_off}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewTermsButton}
                onPress={() =>
                  Alert.alert(
                    "Terms & Conditions",
                    labBooking.offer.TermAndCondition || "Standard terms and conditions apply.",
                  )
                }
              >
                <Text style={styles.viewTermsText}>View Terms & Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentValue}>₹{totalAmount}</Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Discount</Text>
              <Text style={styles.discountValue}>-₹{totalSavings}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Payable Amount</Text>
              <Text style={styles.totalValue}>₹{payableAmount}</Text>
            </View>
          </View>
        </View>

        {/* Cancellation Information */}
        {labBooking.isBookingCancel && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Cancellation Information</Text>
            <View style={styles.cancellationCard}>
              <MaterialIcons name="cancel" size={24} color="#ef4444" />
              <Text style={styles.cancellationTitle}>Booking Cancelled</Text>
              {labBooking.cancel_reason && (
                <Text style={styles.cancellationReason}>Reason: {labBooking.cancel_reason}</Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {getStatus === "pending" ? (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
            <MaterialIcons name="cancel" size={20} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back to Bookings</Text>
          </TouchableOpacity>
        )}

        {/* Support Note */}
        <View style={styles.supportNoteContainer}>
          <Text style={styles.supportNoteText}>Need help with your booking? Contact our support team.</Text>
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
  testCard: {
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
  testHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  testName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  ultrasoundBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ultrasoundText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
  },
  testDetails: {
    marginTop: 5,
  },
  testDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  testDetailLabel: {
    fontSize: 14,
    color: "#666",
    width: 50,
  },
  testDetailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  testPriceContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  testPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  testPriceLabel: {
    fontSize: 14,
    color: "#666",
  },
  testOriginalPrice: {
    fontSize: 14,
    color: "#888",
    textDecorationLine: "line-through",
  },
  testDiscountPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  testSavings: {
    fontSize: 14,
    color: "#10b981",
  },
  noTestsContainer: {
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
  noTestsText: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  clinicCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
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
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  clinicRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  clinicRating: {
    fontSize: 14,
    color: "#333",
    marginLeft: 5,
  },
  clinicButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clinicButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  clinicButtonText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
    marginLeft: 5,
  },
  offerCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  offerCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4F46E5",
    marginLeft: 10,
  },
  offerDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  offerDetails: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  offerDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  offerDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  offerDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  viewTermsButton: {
    alignItems: "center",
  },
  viewTermsText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
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
  },
  discountValue: {
    fontSize: 14,
    color: "#10b981",
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
    color: "#4F46E5",
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
    marginTop: 10,
    marginBottom: 20,
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
    marginTop: 10,
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

