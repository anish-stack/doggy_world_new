

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, Button, } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"
import { useNavigation } from "@react-navigation/native"
import { API_END_POINT_URL_LOCAL } from "../../constant/constant"
import { useToken } from "../../hooks/useToken"
import { showMessage } from "react-native-flash-message"
import DateTimePicker from "@react-native-community/datetimepicker"
import RatingModal from "./components/RatingModal"
import PrescriptionView from "./components/PrescriptionView"
import TopHeadPart from "../../layouts/TopHeadPart"
import axios from "axios"
import * as Notifications from 'expo-notifications';
export default function ConsultationDetail({ route }) {
  const { consultation } = route.params
  const navigation = useNavigation()
  const { token } = useToken()

  const [loading, setLoading] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date(consultation.date))
  const [selectedTime, setSelectedTime] = useState("")

  const [showPicker, setShowPicker] = useState(false);


  const [availableTimes, setAvailableTimes] = useState([
    "9:00 AM - 9:20 AM",
    "9:30 AM - 9:50 AM",
    "10:00 AM - 10:20 AM",
    "10:30 AM - 10:50 AM",
    "11:00 AM - 11:20 AM",
    "2:00 PM - 2:20 PM",
    "2:30 PM - 2:50 PM",
    "3:00 PM - 3:20 PM",
    "3:30 PM - 3:50 PM",
    "4:00 PM - 4:20 PM",
  ])

  const onChange = (event, date) => {
    setShowPicker(Platform.OS === 'ios'); // keep open for iOS only
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (dateString) => {
    try {
      const dateObj = new Date(dateString)
      return format(dateObj, "dd MMMM yyyy")
    } catch (error) {
      return dateString
    }
  }

  const handleCancelBooking = () => {
    Alert.alert("Cancel Consultation", "Are you sure you want to cancel this consultation?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => cancelConsultation() },
    ])
  }



  const cancelConsultation = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_END_POINT_URL_LOCAL}/api/v1/consultations-cancel`,
        {
          params: { id: consultation._id },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;
      console.log("✅ Cancel Consultation Response:", result);

      if (result.success) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Consultation Cancelled & Refund Initiated 💸`,
            body: `Your booking has been cancelled successfully. Refund will be credited within 2–5 hours. Thank you for your patience.`,
            sound: true,
          },
          trigger: { seconds: 4 },
        });

        showMessage({
          message: "Success",
          description: "Consultation cancelled successfully",
          type: "success",
        });

        navigation.goBack();
      } else {
        console.warn("⚠️ Cancel Failed:", result.message);

        showMessage({
          message: "Error",
          description: result.message || "Failed to cancel consultation",
          type: "danger",
        });
      }
    } catch (error) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Cancellation Attempted 🚨`,
          body: `We tried to cancel your booking. If the refund is not received in 2–5 hours, please contact support.`,
          sound: true,
        },
        trigger: { seconds: 4 },
      });
      console.error("❌ Error cancelling consultation:", error?.response?.data || error.message);
      showMessage({
        message: "Error",
        description: error?.response?.data?.message || "Something went wrong. Please try again.",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleModal(true)
  }

  const submitReschedule = async () => {
    if (!selectedTime) {
      showMessage({
        message: "Error",
        description: "Please select a time slot",
        type: "danger",
      })
      return
    }

    try {
      setLoading(true)
      const formattedDate = format(selectedDate, "yyyy-MM-dd")

      const response = await axios.post(
        `${API_END_POINT_URL_LOCAL}/api/v1/consultations-reschedule`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            id: consultation?._id,
            date: formattedDate,
            time: selectedTime,
          },
        }
      );
      const result = response.data

      if (result.success) {
        showMessage({
          message: "Success",
          description: "Consultation rescheduled successfully",
          type: "success",
        })
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Consultation Rescheduled ✅`,
            body: `Your consultation has been successfully rescheduled. Please check your updated booking details.`,
            sound: true,
          },
          trigger: { seconds: 4 }, // Triggers after 4 seconds
        });

        setShowRescheduleModal(false)
        navigation.goBack()
      } else {
        showMessage({
          message: "Error",
          description: result.message || "Failed to reschedule consultation",
          type: "danger",
        })
      }
    } catch (error) {
      console.error("Error rescheduling consultation:", error)
      showMessage({
        message: "Error",
        description: "Something went wrong. Please try again.",
        type: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    navigation.navigate("PaymentScreen", {
      consultationId: consultation._id,
      amount: consultation.consultationType.discount_price,
    })
  }

  const handleSubmitRating = async (rating, review) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_END_POINT_URL_LOCAL}/api/v1/consultations-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: consultation?._id,
          number: rating,
          note: review,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showMessage({
          message: "Success",
          description: "Thank you for your feedback!",
          type: "success",
        })
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Thanks for Rating Us ⭐`,
            body: `We appreciate your feedback! Your rating has been submitted successfully.`,
            sound: true,
          },
          trigger: { seconds: 4 }, // Notification will be triggered after 4 seconds
        });
        navigation.goBack()
        setShowRatingModal(false)
      } else {
        showMessage({
          message: "Error",
          description: result.message || "Failed to submit rating",
          type: "danger",
        })
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
      showMessage({
        message: "Error",
        description: "Something went wrong. Please try again.",
        type: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const canCancel = consultation.status === "Confirmed" || consultation.status === "Rescheduled";
  const canReschedule = consultation.status === "Confirmed" || consultation.status === "Rescheduled";

  const canRate = consultation.status === "Completed" && !consultation.Rating;

  const isPrescriptionAvailable =
    consultation.prescription &&
    (consultation.prescription.description ||
      (consultation.prescription.medicenSuggest && consultation.prescription.medicenSuggest.length > 0))

  return (
    <View style={styles.container}>
      <TopHeadPart title="Consultation Details" />


      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A5AE0" />
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.card}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      consultation.status === "Confirmed"
                        ? "#4CAF50"
                        : consultation.status === "Cancelled"
                          ? "#F44336"
                          : "#2196F3",
                  },
                ]}
              >
                <Text style={styles.statusText}>{consultation.status}</Text>
              </View>
              <Text style={styles.bookingRef}>Ref: {consultation.bookingRef}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pet Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="paw" size={18} color="#6A5AE0" />
                <Text style={styles.infoText}>{consultation.pet.petname}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={18} color="#6A5AE0" />
                <Text style={styles.infoText}>{consultation.pet.petbreed}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Consultation Details</Text>
              <View style={styles.infoRow}>
                <Ionicons name="medical" size={18} color="#6A5AE0" />
                <Text style={styles.infoText}>{consultation.consultationType.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color="#6A5AE0" />
                <Text style={styles.infoText}>{formatDate(consultation.date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color="#6A5AE0" />
                <Text style={styles.infoText}>{consultation.time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Doctor Information</Text>
              <View style={styles.doctorContainer}>
                {consultation.doctorId.image && (
                  <View style={styles.doctorImageContainer}>
                    <Image source={{ uri: consultation.doctorId.image.url }} style={styles.doctorImage} />
                  </View>
                )}
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{consultation.doctorId.name}</Text>
                  <Text style={styles.doctorSpecialty}>Veterinarian</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.infoRow}>
                <Ionicons name="card" size={18} color="#6A5AE0" />
                <Text style={styles.infoText}>Payment Status: {consultation.paymentComplete ? "Paid" : "Pending"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash" size={18} color="#6A5AE0" />
                <Text style={styles.infoText}>Amount: ₹{consultation.consultationType.discount_price}</Text>
              </View>
              {consultation.paymentDetails && consultation.paymentDetails.razorpay_payment_id && (
                <View style={styles.infoRow}>
                  <Ionicons name="receipt" size={18} color="#6A5AE0" />
                  <Text style={styles.infoText}>Transaction ID: {consultation.paymentDetails.razorpay_payment_id}</Text>
                </View>
              )}
            </View>

            {isPrescriptionAvailable && (
              <>
                <View style={styles.divider} />
                <PrescriptionView prescription={consultation.prescription} />
              </>
            )}
          </View>

          <View style={styles.actionsContainer}>
            {canCancel && (
              <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelBooking}>
                <Ionicons name="close-circle" size={18} color="white" />
                <Text style={styles.actionButtonText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}

            {canReschedule && (
              <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]} onPress={handleReschedule}>
                <Ionicons name="calendar" size={18} color="white" />
                <Text style={styles.actionButtonText}>Reschedule</Text>
              </TouchableOpacity>
            )}
            {consultation.Rating && (
              <TouchableOpacity style={[styles.actionButton, styles.rescheduleButton]}>

                <Text style={styles.actionButtonText}>Thnaks For Give Your Feedback 🥰</Text>
              </TouchableOpacity>
            )}

            {consultation?.prescription.nextDateForConsultation &&
              new Date(consultation.prescription.nextDateForConsultation) > new Date() && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.payButton]}
                  onPress={() => navigation.navigate('Consultation')}
                >
                  <Ionicons name="card" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Book Appointment For Next Consultation</Text>
                </TouchableOpacity>
              )}

            {canRate && (
              <TouchableOpacity
                style={[styles.actionButton, styles.rateButton]}
                onPress={() => setShowRatingModal(true)}
              >
                <Ionicons name="star" size={18} color="white" />
                <Text style={styles.actionButtonText}>Rate Visit</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      <RatingModal visible={showRatingModal} onClose={() => setShowRatingModal(false)} onSubmit={handleSubmitRating} />

      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Button title="Pick a date" onPress={() => setShowPicker(true)} />
            <Text>Selected Date: {selectedDate.toLocaleDateString()}</Text>

            {showPicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) setSelectedDate(date)

                  setShowPicker(false)
                }}
                minimumDate={new Date()}
              />
            )}


            <Text style={styles.modalLabel}>Select Time Slot</Text>
            <ScrollView style={styles.timeSlotContainer}>
              {availableTimes.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.timeSlot, selectedTime === time && styles.selectedTimeSlot]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeSlotText, selectedTime === time && styles.selectedTimeSlotText]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowRescheduleModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmModalButton]} onPress={submitReschedule}>
                <Text style={styles.confirmModalButtonText}>{loading ? 'Please Wait' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  bookingRef: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  doctorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0EEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  doctorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  doctorSpecialty: {
    fontSize: 14,
    color: "#666",
  },
  actionsContainer: {
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  rescheduleButton: {
    backgroundColor: "#FF9800",
  },
  payButton: {
    backgroundColor: "#4CAF50",
  },
  rateButton: {
    backgroundColor: "#2196F3",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  timeSlotContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F0F0F0",
  },
  selectedTimeSlot: {
    backgroundColor: "#6A5AE0",
  },
  timeSlotText: {
    fontSize: 14,
    color: "#666",
  },
  selectedTimeSlotText: {
    color: "white",
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  confirmModalButton: {
    backgroundColor: "#6A5AE0",
    marginLeft: 8,
  },
  cancelModalButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  confirmModalButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
