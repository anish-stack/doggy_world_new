import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const EmptyState = ({ filter }) => {
  let message = "No consultations found"
  let icon = "calendar"

  switch (filter) {
    case "upcoming":
      message = "No upcoming consultations"
      icon = "time"
      break
    case "completed":
      message = "No completed consultations yet"
      icon = "checkmark-circle"
      break
    case "cancelled":
      message = "No cancelled consultations"
      icon = "close-circle"
      break
    default:
      message = "No consultations found"
      icon = "calendar"
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color="#6A5AE0" />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>Book a consultation with our veterinarians to get started</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0EEFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    maxWidth: "80%",
  },
})

export default EmptyState
