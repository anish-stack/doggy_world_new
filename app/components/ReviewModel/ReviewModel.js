import React, { useState } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Animated
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import axios from 'axios';

export default function ReviewModal({ open, close, appointment, isGrooming }) {
    const [selectedRating, setSelectedRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    // Animation value for success message
    const [fadeAnim] = useState(new Animated.Value(0));

    const handleRating = (rating) => {
        setSelectedRating(rating);
    };

    const resetForm = () => {
        setSelectedRating(0);
        setFeedback("");
        setSuccess(false);
        setError(null);
    };

    const showSuccessMessage = () => {
        setSuccess(true);
        // Animate the success message
        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start(() => {
            close();
            resetForm();
        });
    };

    const handleSubmit = async () => {
        if (selectedRating === 0) {
            setError("Please select a rating before submitting");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Replace with your actual API endpoint
            const response = await axios.post('https://admindoggy.adsdigitalmedia.com/api/rate-consultation-bboking', {
                id: appointment.id,
                rate: selectedRating,
                feedback: feedback.trim() || null
            });

            console.log('Rating submitted successfully:', response.data);
            setLoading(false);
            showSuccessMessage();
        } catch (err) {
            console.error('Error submitting rating:', err);
            setLoading(false);
            setError(err?.response?.data?.error?.message || "Failed to submit rating. Please try again.");
        }
    };

    const getRatingText = () => {
        switch (selectedRating) {
            case 1: return "Poor";
            case 2: return "Fair";
            case 3: return "Good";
            case 4: return "Very Good";
            case 5: return "Excellent";
            default: return "Tap to rate";
        }
    };

    const handleClose = () => {
        resetForm();
        close();
    };

    return (
        <Modal visible={open} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {success ? (
                        <Animated.View style={[styles.successContainer, { opacity: fadeAnim }]}>
                            <View style={styles.successIconContainer}>
                                <MaterialIcons name="check-circle" size={60} color="#D22B2B" />
                            </View>
                            <Text style={styles.successTitle}>Thank You!</Text>
                            <Text style={styles.successText}>
                                Your feedback has been submitted successfully.
                            </Text>
                        </Animated.View>
                    ) : (
                        <>
                            <View style={styles.header}>
                                <Text style={styles.title}>Rate Your Experience</Text>
                                <Text style={styles.subtitle}>
                                    {appointment?.consultation?.name || "Consultation"} with {appointment?.doctor?.name || "Doctor"}
                                </Text>
                            </View>

                            {/* Star Rating */}
                            <View style={styles.ratingContainer}>
                                <View style={styles.starContainer}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => handleRating(star)}
                                            style={styles.starButton}
                                        >
                                            <FontAwesome
                                                name={selectedRating >= star ? "star" : "star-o"}
                                                size={36}
                                                color={selectedRating >= star ? "#D22B2B" : "#ddd"}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <Text style={styles.ratingText}>{getRatingText()}</Text>
                            </View>

                            {/* Feedback Text Input */}
                            <View style={styles.feedbackContainer}>
                                <Text style={styles.feedbackLabel}>Additional Comments (Optional)</Text>
                                <TextInput
                                    style={styles.feedbackInput}
                                    placeholder="Tell us more about your experience..."
                                    multiline
                                    numberOfLines={4}
                                    value={feedback}
                                    onChangeText={setFeedback}
                                />
                            </View>

                            {/* Error Message */}
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {/* Buttons */}
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    style={[styles.submitButton, selectedRating === 0 && styles.submitButtonDisabled]}
                                    disabled={loading || selectedRating === 0}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Submit</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalContainer: {
        width: "85%",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#003873",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
    ratingContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    starContainer: {
        flexDirection: "row",
        marginBottom: 10,
    },
    starButton: {
        padding: 5,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#D22B2B",
        marginTop: 5,
    },
    feedbackContainer: {
        width: "100%",
        marginBottom: 20,
    },
    feedbackLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#444",
        marginBottom: 8,
    },
    feedbackInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        height: 100,
        textAlignVertical: "top",
        fontSize: 14,
        backgroundColor: "#f9f9f9",
    },
    errorContainer: {
        backgroundColor: "#ffe0e0",
        padding: 10,
        borderRadius: 8,
        width: "100%",
        marginBottom: 15,
    },
    errorText: {
        color: "#d32f2f",
        fontSize: 14,
        textAlign: "center",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        backgroundColor: "#f0f0f0",
        alignItems: "center",
        borderRadius: 8,
        marginRight: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
    },
    submitButton: {
        flex: 1,
        padding: 14,
        backgroundColor: "#D22B2B",
        alignItems: "center",
        borderRadius: 8,
        marginLeft: 8,
    },
    submitButtonDisabled: {
        backgroundColor: "#F88379",
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "white",
    },
    successContainer: {
        alignItems: "center",
        padding: 20,
    },
    successIconContainer: {
        marginBottom: 15,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#003873",
        marginBottom: 10,
    },
    successText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
    },
});
