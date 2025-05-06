import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import { API_END_POINT_URL } from "../../constant/constant"
import { useState } from "react"
import CancelModal from "./CancelModal"

export default function AppointmentDetails({ route }) {
  const navigation = useNavigation()
  const { appointment } = route.params
  const [modalVisible, setModalVisible] = useState(false);
  const consultation = appointment.consultation || {}
  const doctor = appointment.doctor || {}
  const pet = appointment.pet || {}

  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const formatTime = (timeString) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes.substring(0, 2)} ${ampm}`
  }

  const handleCancel = async () => {
    setModalVisible(true)
  };

  const handleHelp = () => {
    Alert.alert("Need Help?", "Contact our support team at support@petcare.com or call us at +1-800-PET-CARE", [
      { text: "OK" },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#003873" />
          </TouchableOpacity>
          <Text style={styles.heading}>Appointment Details</Text>
          <TouchableOpacity onPress={handleHelp} style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#00aaa9" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.card}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  appointment.is_consultation_complete
                    ? styles.completedBadge
                    : appointment.isBookingCancel
                      ? styles.cancelledBadge
                      : styles.upcomingBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {appointment.is_consultation_complete
                    ? "Completed"
                    : appointment.isBookingCancel
                      ? "Cancelled"
                      : "Upcoming"}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Consultation Type</Text>
              <View style={styles.infoRow}>
                <FontAwesome name="stethoscope" size={18} color="#00aaa9" />
                <Text style={styles.infoText}>{consultation.name}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={18} color="#666" />
                <Text style={styles.infoText}>{formatDate(appointment.Date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={18} color="#666" />
                <Text style={styles.infoText}>
                  {formatTime(appointment.Time)} ({appointment.period})
                </Text>
              </View>
            </View>

            {appointment?.isBookingCancel && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cancel Details</Text>
                <View style={styles.infoRow}>
                  <MaterialIcons name="info" size={18} color="#666" />
                  <Text style={styles.infoText}>
                    {appointment?.Cancel_Reason}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Doctor</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="person" size={18} color="#666" />
                <Text style={styles.infoText}>{doctor.name}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pet Information</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="pets" size={18} color="#666" />
                <Text style={styles.infoText}>
                  {pet.petName} ({pet.PetType})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="cake" size={18} color="#666" />
                <Text style={styles.infoText}>Age: {pet.Age || "Not specified"}</Text>
              </View>
              <View style={styles.infoRow}>
                <FontAwesome name="paw" size={18} color="#666" />
                <Text style={styles.infoText}>Breed: {pet.Breed}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.infoRow}>
                <MaterialIcons name="attach-money" size={18} color="#666" />
                <Text style={styles.infoText}>Original Price: ₹{consultation.price}</Text>
              </View>
              {consultation.discount && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="local-offer" size={18} color="#666" />
                  <Text style={styles.infoText}>Discount: {consultation.discount}%</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <MaterialIcons name="payment" size={18} color="#666" />
                <Text style={styles.infoText}>Final Price: ₹{consultation.discountPrice || consultation.price}</Text>
              </View>
            </View>

            {consultation.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Consultation</Text>
                <Text style={styles.descriptionText}>{consultation.description}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        {!appointment.is_consultation_complete && !appointment.isBookingCancel && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
        <CancelModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          appointmentId={appointment.id}

          onSuccess={() => console.log("Appointment cancelled successfully!")}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#003873",
  },
  helpButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upcomingBadge: {
    backgroundColor: "#FFC1C3",
  },
  completedBadge: {
    backgroundColor: "#e0f7e0",
  },
  cancelledBadge: {
    backgroundColor: "#ffe0e0",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003873",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#444",
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    backgroundColor: "#ff6b6b",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})

