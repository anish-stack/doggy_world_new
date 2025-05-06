import React, { useState } from "react";
import { View, Text, TextInput, Modal, Alert, TouchableOpacity, StyleSheet } from "react-native";
import axios from "axios";
import { API_END_POINT_URL } from "../../constant/constant";
import { useNavigation } from "@react-navigation/native";

const CancelModal = ({ visible, onClose, appointmentId, onSuccess }) => {
    const [cancelReason, setCancelReason] = useState("");
    const navigation = useNavigation()

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert("Error", "Please provide a cancellation reason.");
            return;
        }
        if (cancelReason.length > 100) {
            Alert.alert("Error", "Cancellation reason should not exceed 100 characters.");
            return;
        }

        try {
            const response = await axios.post(
                `${API_END_POINT_URL}/api/cancel_booking_grooming`,
                {
                    id: appointmentId,
                    cancel_reason: cancelReason,
                }
            );

            console.log("response", response.data);

            if (response.status === 200) {
                Alert.alert("Success", "Your appointment has been cancelled successfully.");
                setCancelReason("");
                onClose();
                onSuccess(); // Refresh data or navigate
                // navigation.navigate('Appointments')
            } else {
                Alert.alert("Error", "Failed to cancel appointment. Please try again.");
            }
        } catch (error) {
            console.error("Cancellation Error:", err);
            Alert.alert("Error", err?.response?.data?.error?.message || "Something went wrong.");
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <Text style={styles.title}>Cancel Appointment</Text>
                    <Text style={styles.description}>
                        Please enter the reason for cancellation (max 100 characters):
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Why You Should Cancel This Appoinment Please Write a reason..."
                        value={cancelReason}
                        multiline={true}
                        onChangeText={setCancelReason}
                        maxLength={100}
                    />
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCancel} style={styles.submitButton}>
                            <Text style={styles.submitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        width: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: "#555",
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 6,
        width: "100%",
        height: 100,
        marginBottom: 15,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    cancelButton: {
        marginRight: 10,
        padding: 8,
    },
    cancelButtonText: {
        color: "#555",
    },
    submitButton: {
        backgroundColor: "#d64444",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    submitButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default CancelModal;
