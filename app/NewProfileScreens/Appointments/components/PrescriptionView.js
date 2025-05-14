import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const PrescriptionView = ({ prescription }) => {
  const { description, medicenSuggest, nextDateForConsultation } = prescription

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified"

    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (error) {
      return dateString
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prescription</Text>

      {description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctor's Notes</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      ) : null}

      {medicenSuggest && medicenSuggest.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          {medicenSuggest.map((medicine, index) => (
            <View key={index} style={styles.medicineItem}>
              <Ionicons name="medical" size={16} color="#6A5AE0" />
              <Text style={styles.medicineText}>{medicine}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Follow-up</Text>
        <View style={styles.followUpContainer}>
          <Ionicons name="calendar" size={16} color="#6A5AE0" />
          <Text style={styles.followUpText}>Next consultation: {formatDate(nextDateForConsultation)}</Text>
        </View>
      </View>

    
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  medicineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  medicineText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  followUpContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  followUpText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6A5AE0",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  downloadButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 8,
  },
})

export default PrescriptionView
