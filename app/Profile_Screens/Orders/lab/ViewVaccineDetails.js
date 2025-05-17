import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Platform,
  Dimensions,
  TextInput,
  Modal,
  Linking,
} from "react-native"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"
import { format } from "date-fns"
import DateTimePicker from "@react-native-community/datetimepicker"
import { API_END_POINT_URL_LOCAL } from "../../../constant/constant"
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign, Feather, MaterialIcons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export default function ViewVaccineDetails({ navigation, route }) {
  const { booking } = route.params || {}
  const [bookingDetails, setBookingDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bottom sheet states
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [nextVaccinationOpen, setNextVaccinationOpen] = useState(false)
  const [reportViewOpen, setReportViewOpen] = useState(false)

  // Reschedule states
  const [rescheduleDate, setRescheduleDate] = useState(null)
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Review states
  const [ratingValue, setRatingValue] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewLoading, setReviewLoading] = useState(false)

  // Next vaccination states
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedVaccines, setSelectedVaccines] = useState([])
  const [selectedStatus, setSelectedStatus] = useState("Pending")
  const [selectedNotes, setSelectedNotes] = useState("")
  const [currentEditItem, setCurrentEditItem] = useState(null)
  const [showNextDatePicker, setShowNextDatePicker] = useState(false)
  const [showNextTimePicker, setShowNextTimePicker] = useState(false)

  // Fetch vaccination booking details
  const fetchBookingDetails = useCallback(async () => {
    if (!booking?._id) return

    setLoading(true)
    try {
      const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/single-vaccine-orders?id=${booking?._id}`)

      if (response.data.success) {
        setBookingDetails(response.data.data)
        
        // If there's a next scheduled vaccination, set the initial values
        if (response.data.data.nextScheduledVaccination?.schedule?.length > 0) {
          const nextSchedule = response.data.data.nextScheduledVaccination.schedule[0]
          setCurrentEditItem(nextSchedule)
          setSelectedDate(new Date(nextSchedule.date))
          setSelectedTime(nextSchedule.time)
          setSelectedVaccines([nextSchedule.vaccines])
          setSelectedStatus(nextSchedule.status)
          setSelectedNotes(nextSchedule.notes || "")
        }
      } else {
        setError("Failed to fetch booking details")
      }
    } catch (error) {
      console.log("Error fetching vaccination details:", error)
      setError(error.message || "An error occurred while fetching data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [booking])

  useEffect(() => {
    fetchBookingDetails()
  }, [fetchBookingDetails])

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchBookingDetails()
  }, [fetchBookingDetails])

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!bookingDetails?._id) return

    setIsSubmitting(true)
    try {
      const response = await axios.put(
        `${API_END_POINT_URL_LOCAL}/api/v1/cancel-vaccine-orders?id=${bookingDetails._id}&status=Cancelled`
      )

      if (response.data.success) {
        Alert.alert("Booking Cancelled", "Vaccination booking has been cancelled successfully")
        setCancelConfirmOpen(false)
        fetchBookingDetails()
      } else {
        Alert.alert("Error", "Failed to cancel booking")
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to cancel booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reschedule
  const handleReschedule = async () => {
    if (!bookingDetails?._id) return

    if (!rescheduleDate) {
      Alert.alert("Error", "Please select a date")
      return
    }

    if (!rescheduleTime) {
      Alert.alert("Error", "Please select a time")
      return
    }

    setIsSubmitting(true)
    try {
      const formattedDate = format(rescheduleDate, "yyyy-MM-dd")

      const payload = {
        rescheduledDate: formattedDate,
        rescheduledTime: rescheduleTime,
        status: "Rescheduled",
      }

      const response = await axios.put(
        `${API_END_POINT_URL_LOCAL}/api/v1/reschedule-vaccine-orders?id=${bookingDetails._id}&type=reschedule`,
        payload
      )

      if (response.data.success) {
        Alert.alert("Booking Rescheduled", "Your vaccination has been rescheduled successfully")
        setRescheduleOpen(false)
        fetchBookingDetails()
      } else {
        Alert.alert("Error", "Failed to reschedule booking")
      }
    } catch (err) {
      console.log(err)
      Alert.alert("Error", err.response?.data?.message || "Failed to reschedule booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle review submission
  const handleReview = async () => {
    if (!ratingValue) {
      Alert.alert("Error", "Please select a rating")
      return
    }

    setReviewLoading(true)
    try {
      // Submit review to API
      const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/add-review`, {
        id: bookingDetails._id,
        rating: ratingValue,
        review: reviewText,
      })

      if (response.data.success) {
        Alert.alert("Success", "Review submitted successfully")
        setReviewOpen(false)
        fetchBookingDetails()
      } else {
        throw new Error(response.data.message || "Failed to submit review")
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to submit review")
    } finally {
      setReviewLoading(false)
    }
  }

  // Handle update next vaccination schedule
  const handleUpdateSchedule = async () => {
    if (!currentEditItem) return

    if (selectedVaccines.length === 0) {
      Alert.alert("Error", "Please select at least one vaccine")
      return
    }

    setIsSubmitting(true)
    try {
      const updateData = {
        whichOrderId: bookingDetails._id,
        action: "update",
        scheduleId: bookingDetails.nextScheduledVaccination._id,
        scheduleItemId: currentEditItem._id,
        updatedScheduleItem: {
          date: selectedDate.toISOString(),
          time: selectedTime,
          vaccines: selectedVaccines[0], // Assuming we're using the first selected vaccine
          status: selectedStatus,
          notes: selectedNotes,
        },
      }

      const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/add-scheduled`, updateData)

      if (response.data.success) {
        Alert.alert("Success", "Schedule item updated successfully")
        setNextVaccinationOpen(false)
        fetchBookingDetails()
      } else {
        throw new Error(response.data.message || "Failed to update schedule")
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update schedule")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "PPP")
  }

  // Handle date change for reschedule
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setRescheduleDate(selectedDate)
    }
  }

  // Handle time selection for reschedule
  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false)
    if (selectedTime) {
      const hours = selectedTime.getHours()
      const minutes = selectedTime.getMinutes()
      const formattedHours = hours < 10 ? `0${hours}` : hours
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
      setRescheduleTime(`${formattedHours}:${formattedMinutes}`)
    }
  }

  // Handle date change for next vaccination
  const onNextDateChange = (event, date) => {
    setShowNextDatePicker(false)
    if (date) {
      setSelectedDate(date)
    }
  }

  // Handle time selection for next vaccination
  const onNextTimeChange = (event, time) => {
    setShowNextTimePicker(false)
    if (time) {
      const hours = time.getHours()
      const minutes = time.getMinutes()
      const formattedHours = hours < 10 ? `0${hours}` : hours
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
      setSelectedTime(`${formattedHours}:${formattedMinutes}`)
    }
  }

  // Toggle modals
  const toggleCancelSheet = () => setCancelConfirmOpen(!cancelConfirmOpen)
  const toggleRescheduleSheet = () => setRescheduleOpen(!rescheduleOpen)
  const toggleReviewSheet = () => setReviewOpen(!reviewOpen)
  const toggleNextVaccinationSheet = () => setNextVaccinationOpen(!nextVaccinationOpen)
  const toggleReportViewSheet = () => setReportViewOpen(!reportViewOpen)

  // Open report URL
  const openReportUrl = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Could not open the report. Please try again later.")
      })
    }
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading vaccination details...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookingDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccination Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              bookingDetails?.status === "Confirmed"
                ? styles.confirmedStatus
                : bookingDetails?.status === "Cancelled"
                  ? styles.cancelledStatus
                  : bookingDetails?.status === "Rescheduled"
                    ? styles.rescheduledStatus
                    : styles.defaultStatus,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                bookingDetails?.status === "Cancelled"
                  ? styles.cancelledStatusText
                  : bookingDetails?.status === "Rescheduled"
                    ? styles.rescheduledStatusText
                    : styles.confirmedStatusText,
              ]}
            >
              {bookingDetails?.status || "Processing"}
            </Text>
          </View>
          <Text style={styles.bookingRef}>Ref: {bookingDetails?.bookingRef}</Text>
        </View>

        {/* Vaccine Card */}
        {bookingDetails?.vaccine && (
          <View style={styles.vaccineCard}>
            {bookingDetails.vaccine.mainImage?.url && (
              <Image
                source={{ uri: bookingDetails.vaccine.mainImage.url }}
                style={styles.vaccineImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.vaccineInfo}>
              <View style={styles.vaccineHeader}>
                <Text style={styles.vaccineTitle}>{bookingDetails.vaccine.title}</Text>
                {bookingDetails.vaccine.tag && (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{bookingDetails.vaccine.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.vaccineDesc}>{bookingDetails.vaccine.small_desc}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.discountPrice}>
                  {formatPrice(
                    bookingDetails.bookingType === "Home"
                      ? bookingDetails.vaccine.home_price_of_package_discount
                      : bookingDetails.vaccine.discount_price
                  )}
                </Text>
                <Text style={styles.originalPrice}>
                  {formatPrice(
                    bookingDetails.bookingType === "Home"
                      ? bookingDetails.vaccine.home_price_of_package
                      : bookingDetails.vaccine.price
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pet Details */}
        {bookingDetails?.pet && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="dog" size={24} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Pet Details</Text>
            </View>

            <View style={styles.petDetailsContainer}>
              <View style={styles.petDetail}>
                <Text style={styles.petDetailLabel}>Name</Text>
                <Text style={styles.petDetailValue}>{bookingDetails.pet.petname}</Text>
              </View>

              <View style={styles.petDetail}>
                <Text style={styles.petDetailLabel}>Type</Text>
                <Text style={styles.petDetailValue}>{bookingDetails.pet.petType?.petType || "N/A"}</Text>
              </View>

              <View style={styles.petDetail}>
                <Text style={styles.petDetailLabel}>Breed</Text>
                <Text style={styles.petDetailValue}>{bookingDetails.pet.petbreed || "N/A"}</Text>
              </View>

              <View style={styles.petDetail}>
                <Text style={styles.petDetailLabel}>Date of Birth</Text>
                <Text style={styles.petDetailValue}>
                  {bookingDetails.pet.petdob ? formatDate(bookingDetails.pet.petdob) : "N/A"}
                </Text>
              </View>

              <View style={styles.petDetail}>
                <Text style={styles.petDetailLabel}>Owner Contact</Text>
                <Text style={styles.petDetailValue}>{bookingDetails.pet.petOwnertNumber || "N/A"}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Appointment Details */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Appointment Details</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Appointment Date</Text>
              <Text style={styles.detailValue}>
                {bookingDetails?.rescheduledDate
                  ? formatDate(bookingDetails.rescheduledDate)
                  : formatDate(bookingDetails?.selectedDate)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Appointment Time</Text>
              <Text style={styles.detailValue}>
                {bookingDetails?.rescheduledTime || bookingDetails?.selectedTime || "N/A"} (
                {bookingDetails?.bookingPart || "N/A"})
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="clinic-medical" size={18} color="#8b5cf6" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Booking Type</Text>
              <Text style={styles.detailValue}>{bookingDetails?.bookingType || "N/A"}</Text>
            </View>
          </View>

          {bookingDetails?.bookingType === "Clinic" && bookingDetails?.clinic && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Clinic</Text>
                <Text style={styles.detailValue}>{bookingDetails.clinic.clinicName}</Text>
                <Text style={styles.detailSubValue}>
                  <Ionicons name="map-outline" size={14} color="#8b5cf6" /> {bookingDetails.clinic.address}
                </Text>
                <Text style={styles.detailSubValue}>
                  <Ionicons name="call-outline" size={14} color="#8b5cf6" /> {bookingDetails.clinic.phone}
                </Text>
                <Text style={styles.detailSubValue}>
                  <Ionicons name="time-outline" size={14} color="#8b5cf6" /> {bookingDetails.clinic.openTime} -{" "}
                  {bookingDetails.clinic.closeTime}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Next Scheduled Vaccination */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="event-repeat" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Next Scheduled Vaccination</Text>
          </View>

          {bookingDetails?.nextScheduledVaccination?.schedule?.length > 0 ? (
            <>
              {bookingDetails.nextScheduledVaccination.schedule.map((item, index) => (
                <View key={index} style={styles.nextVaccinationItem}>
                  <View style={styles.nextVaccinationHeader}>
                    <View
                      style={[
                        styles.nextVaccinationStatus,
                        item.status === "Completed"
                          ? styles.completedStatus
                          : item.status === "Cancelled"
                            ? styles.cancelledNextStatus
                            : styles.pendingStatus,
                      ]}
                    >
                      <Text
                        style={[
                          styles.nextVaccinationStatusText,
                          item.status === "Completed"
                            ? styles.completedStatusText
                            : item.status === "Cancelled"
                              ? styles.cancelledNextStatusText
                              : styles.pendingStatusText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setCurrentEditItem(item)
                        setSelectedDate(new Date(item.date))
                        setSelectedTime(item.time)
                        setSelectedVaccines([item.vaccines])
                        setSelectedStatus(item.status)
                        setSelectedNotes(item.notes || "")
                        setNextVaccinationOpen(true)
                      }}
                    >
                      <Feather name="edit-2" size={16} color="#8b5cf6" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.nextVaccinationDetails}>
                    <View style={styles.nextVaccinationDetail}>
                      <Ionicons name="calendar-outline" size={16} color="#8b5cf6" />
                      <Text style={styles.nextVaccinationText}>{formatDate(item.date)}</Text>
                    </View>

                    <View style={styles.nextVaccinationDetail}>
                      <Ionicons name="time-outline" size={16} color="#8b5cf6" />
                      <Text style={styles.nextVaccinationText}>{item.time || "N/A"}</Text>
                    </View>

                    <View style={styles.nextVaccinationDetail}>
                      <MaterialCommunityIcons name="needle" size={16} color="#8b5cf6" />
                      <Text style={styles.nextVaccinationText}>{item.vaccines}</Text>
                    </View>

                    {item.notes && (
                      <View style={styles.nextVaccinationDetail}>
                        <Ionicons name="document-text-outline" size={16} color="#8b5cf6" />
                        <Text style={styles.nextVaccinationText}>{item.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.noScheduleContainer}>
              <MaterialIcons name="event-busy" size={48} color="#d1d5db" />
              <Text style={styles.noScheduleText}>No upcoming vaccinations scheduled</Text>
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Payment Details</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="card" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Payment Status</Text>
              <View
                style={[
                  styles.paymentStatusBadge,
                  bookingDetails?.paymentComplete ? styles.paidStatus : styles.unpaidStatus,
                ]}
              >
                <Text style={styles.paymentStatusText}>
                  {bookingDetails?.paymentComplete ? "Paid" : "Unpaid"}
                </Text>
              </View>
            </View>
          </View>

          {bookingDetails?.payment?.razorpay_payment_id && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="receipt" size={18} color="#8b5cf6" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Payment ID</Text>
                <Text style={styles.detailValue}>{bookingDetails.payment.razorpay_payment_id}</Text>
              </View>
            </View>
          )}

          {bookingDetails?.couponCode && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="pricetag" size={20} color="#8b5cf6" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Coupon Applied</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.couponCode} (₹{bookingDetails.couponDiscount} off)
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <FontAwesome5 name="money-bill-wave" size={18} color="#8b5cf6" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>{formatPrice(bookingDetails?.totalPayableAmount || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Report Section (if available) */}
        {bookingDetails?.ReportId && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={24} color="#8b5cf6" />
              <Text style={styles.sectionTitle}>Vaccination Report</Text>
            </View>

            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => openReportUrl(bookingDetails.ReportId)}
            >
              <Ionicons name="document-text-outline" size={24} color="#fff" />
              <Text style={styles.reportButtonText}>View Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Rating Section */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="star" size={24} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          </View>

          {bookingDetails?.hasRated ? (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>Thank you for your feedback!</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={24}
                    color={star <= bookingDetails.bookingRating ? "#f59e0b" : "#d1d5db"}
                  />
                ))}
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.rateButton} onPress={toggleReviewSheet}>
              <Ionicons name="star-outline" size={24} color="#fff" />
              <Text style={styles.rateButtonText}>Rate Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        {bookingDetails?.status === "Confirmed" && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={toggleRescheduleSheet}>
              <Ionicons name="calendar" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reschedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={toggleCancelSheet}>
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal visible={cancelConfirmOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Booking</Text>
              <TouchableOpacity onPress={toggleCancelSheet}>
                <AntDesign name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              Are you sure you want to cancel this vaccination booking? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={toggleCancelSheet}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelButtonText}>No, Keep It</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCancelBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule Modal */}
      <Modal visible={rescheduleOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Booking</Text>
              <TouchableOpacity onPress={toggleRescheduleSheet}>
                <AntDesign name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>Please select a new date and time for your vaccination.</Text>

            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar" size={20} color="#8b5cf6" />
                <Text style={styles.datePickerButtonText}>
                  {rescheduleDate ? format(rescheduleDate, "PPP") : "Select Date"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time" size={20} color="#8b5cf6" />
                <Text style={styles.datePickerButtonText}>{rescheduleTime ? rescheduleTime : "Select Time"}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={rescheduleDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onTimeChange}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={toggleRescheduleSheet}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleReschedule}
                disabled={isSubmitting || !rescheduleDate || !rescheduleTime}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Reschedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal visible={reviewOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={toggleReviewSheet}>
                <AntDesign name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>How was your vaccination experience?</Text>

            <View style={styles.ratingStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRatingValue(star)}>
                  <Ionicons
                    name={star <= ratingValue ? "star" : "star-outline"}
                    size={36}
                    color={star <= ratingValue ? "#f59e0b" : "#d1d5db"}
                    style={styles.ratingStar}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience (optional)"
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={toggleReviewSheet}
                disabled={reviewLoading}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleReview}
                disabled={reviewLoading || ratingValue === 0}
              >
                {reviewLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Next Vaccination Edit Modal */}
      <Modal visible={nextVaccinationOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Next Vaccination</Text>
              <TouchableOpacity onPress={toggleNextVaccinationSheet}>
                <AntDesign name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>Update your next vaccination schedule</Text>

            <View style={styles.formContainer}>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowNextDatePicker(true)}>
                <Ionicons name="calendar" size={20} color="#8b5cf6" />
                <Text style={styles.datePickerButtonText}>
                  {selectedDate ? format(selectedDate, "PPP") : "Select Date"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowNextTimePicker(true)}>
                <Ionicons name="time" size={20} color="#8b5cf6" />
                <Text style={styles.datePickerButtonText}>{selectedTime ? selectedTime : "Select Time"}</Text>
              </TouchableOpacity>

        

            </View>

            {showNextDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onNextDateChange}
                minimumDate={new Date()}
              />
            )}

            {showNextTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onNextTimeChange}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={toggleNextVaccinationSheet}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleUpdateSchedule}
                disabled={isSubmitting || !selectedDate || !selectedTime}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#8b5cf6",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#8b5cf6",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confirmedStatus: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  cancelledStatus: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  rescheduledStatus: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  defaultStatus: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  statusText: {
    fontWeight: "600",
    fontSize: 14,
  },
  confirmedStatusText: {
    color: "#10b981",
  },
  cancelledStatusText: {
    color: "#ef4444",
  },
  rescheduledStatusText: {
    color: "#f59e0b",
  },
  bookingRef: {
    fontSize: 14,
    color: "#6b7280",
  },
  vaccineCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  vaccineImage: {
    width: "100%",
    height: 180,
  },
  vaccineInfo: {
    padding: 16,
  },
  vaccineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vaccineTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  tagBadge: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  vaccineDesc: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8b5cf6",
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: "#9ca3af",
    textDecorationLine: "line-through",
  },
  detailsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 8,
  },
  petDetailsContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
  },
  petDetail: {
    marginBottom: 12,
  },
  petDetailLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  petDetailValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  detailSubValue: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  nextVaccinationItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  nextVaccinationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  nextVaccinationStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pendingStatus: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
  },
  completedStatus: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  cancelledNextStatus: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  nextVaccinationStatusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  pendingStatusText: {
    color: "#f59e0b",
  },
  completedStatusText: {
    color: "#10b981",
  },
  cancelledNextStatusText: {
    color: "#ef4444",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: "#8b5cf6",
    marginLeft: 4,
  },
  nextVaccinationDetails: {
    gap: 8,
  },
  nextVaccinationDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  nextVaccinationText: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 8,
  },
  noScheduleContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  noScheduleText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    textAlign: "center",
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  paidStatus: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  unpaidStatus: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  paymentStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#8b5cf6",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    borderRadius: 8,
  },
  reportButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  ratingContainer: {
    alignItems: "center",
    padding: 12,
  },
  ratingText: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    borderRadius: 8,
  },
  rateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 24,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rescheduleButton: {
    backgroundColor: "#8b5cf6",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalMessage: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  modalCancelButton: {
    backgroundColor: "#f3f4f6",
  },
  modalConfirmButton: {
    backgroundColor: "#8b5cf6",
  },
  modalCancelButtonText: {
    color: "#4b5563",
    fontWeight: "600",
    fontSize: 16,
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 12,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#111827",
    marginLeft: 12,
  },
  ratingStarsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  ratingStar: {
    marginHorizontal: 8,
  },
  reviewInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    marginBottom: 20,
    textAlignVertical: "top",
  },
  statusSelector: {
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    marginHorizontal: 4,
  },
  selectedStatusOption: {
    backgroundColor: "#8b5cf6",
  },
  statusOptionText: {
    fontSize: 14,
    color: "#4b5563",
  },
  selectedStatusOptionText: {
    color: "#fff",
    fontWeight: "600",
  },
  notesInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    marginTop: 12,
    textAlignVertical: "top",
  },
})
