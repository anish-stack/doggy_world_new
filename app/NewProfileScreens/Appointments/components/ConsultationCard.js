import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { format } from "date-fns"

const ConsultationCard = ({ consultation, onPress }) => {
  const { pet, consultationType, date, time, status, bookingRef, doctorId, prescription } = consultation

  const getStatusColor = () => {
    switch (status) {
      case "Confirmed":
        return "#4CAF50"
      case "Cancelled":
        return "#F44336"
      case "Completed":
        return "#2196F3"
      default:
        return "#FF9800"
    }
  }

  const formatDate = (dateString) => {
    try {
      const dateObj = new Date(dateString)
      return format(dateObj, "dd MMM yyyy")
    } catch (error) {
      return dateString
    }
  }

  const isPrescriptionAvailable =
    prescription &&
    (prescription.description || (prescription.medicenSuggest && prescription.medicenSuggest.length > 0))

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.petInfo}>
          <View style={styles.petIconContainer}>
            <Ionicons name="paw" size={20} color="#6A5AE0" />
          </View>
          <Text style={styles.petName}>{pet.petname}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons name="medical" size={16} color="#666" />
          <Text style={styles.infoText}>{consultationType.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatDate(date)} • {time}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.infoText}>{doctorId.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="bookmark" size={16} color="#666" />
          <Text style={styles.infoText}>Ref: {bookingRef}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {isPrescriptionAvailable && (
          <View style={styles.prescriptionBadge}>
            <Ionicons name="document-text" size={14} color="#6A5AE0" />
            <Text style={styles.prescriptionText}>Prescription Available</Text>
          </View>
        )}

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Paid</Text>
          <Text style={styles.price}>₹{consultationType.discount_price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  petInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  petIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0EEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  petName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  prescriptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EEFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  prescriptionText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6A5AE0",
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
})

export default ConsultationCard
