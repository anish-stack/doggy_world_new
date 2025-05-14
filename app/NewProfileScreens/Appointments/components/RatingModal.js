

import { useState } from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const RatingModal = ({ visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState("")

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating")
      return
    }

    onSubmit(rating, review)
    setRating(0)
    setReview("")
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <Text style={styles.title}>Rate Your Experience</Text>
          <Text style={styles.subtitle}>How was your consultation?</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={rating >= star ? "star" : "star-outline"}
                  size={36}
                  color={rating >= star ? "#FFD700" : "#CCCCCC"}
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingText}>
            {rating === 1
              ? "Poor"
              : rating === 2
                ? "Fair"
                : rating === 3
                  ? "Good"
                  : rating === 4
                    ? "Very Good"
                    : rating === 5
                      ? "Excellent"
                      : ""}
          </Text>

          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience (optional)"
            multiline
            value={review}
            onChangeText={setReview}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  star: {
    marginHorizontal: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 24,
  },
  reviewInput: {
    width: "100%",
    height: 100,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    textAlignVertical: "top",
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#6A5AE0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
})

export default RatingModal
