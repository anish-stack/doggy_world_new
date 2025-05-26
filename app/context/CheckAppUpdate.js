import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Alert,
    Modal,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import * as Updates from 'expo-updates';

const { width, height } = Dimensions.get('window');

export default function CheckAppUpdate({ children }) {
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        checkForOTAUpdates();
    }, []);

    const checkForOTAUpdates = async () => {
        try {
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                setShowUpdateModal(true);
            }
        } catch (err) {
            console.log("Update check failed:", err);
        }
    };

    const handleUpdateNow = async () => {
        setIsUpdating(true);
        try {
            await Updates.fetchUpdateAsync();

            Alert.alert(
                "✅ Update Successfully Installed",
                "Doggy World care is restarting with latest medical features...",
                [
                    {
                        text: "Restart Now",
                        onPress: async () => {
                            await Updates.reloadAsync();
                        }
                    }
                ]
            );
        } catch (error) {
            setIsUpdating(false);
            Alert.alert("Update Failed", "Something went wrong. Please try again later.");
        }
    };

    const handleUpdateLater = () => {
        setShowUpdateModal(false);
    };

    return (
        <View style={styles.container}>
            {children}

            <Modal
                visible={showUpdateModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUpdateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Medical Update Icon */}
                        <View style={styles.imageContainer}>
                            <View style={styles.updateIcon}>
                                <Text style={styles.iconText}>🏥</Text>
                            </View>
                            <View style={styles.plusIcon}>
                                <Text style={styles.plusIconText}>+</Text>
                            </View>
                        </View>

                        {/* Doggy World care Branding */}
                        <Text style={styles.brandName}>Doggy World care</Text>
                        <Text style={styles.title}>New Health Features Available!</Text>

                        <Text style={styles.subtitle}>
                            Enhanced medical services and improved patient care features
                        </Text>

                        <View style={styles.featuresContainer}>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>💊</Text>
                                <Text style={styles.featureText}>Advanced medicine search & ordering</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>📍</Text>
                                <Text style={styles.featureText}>Solved issue With Address Pickinhg</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>📋</Text>
                                <Text style={styles.featureText}>Better prescription management</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>🚚</Text>
                                <Text style={styles.featureText}>Faster medicine delivery tracking</Text>
                            </View>
                        </View>

                        <Text style={styles.description}>
                            Update now to access the latest medical features designed to provide
                            you with better healthcare services and medicine management.
                        </Text>

                        {/* Action Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.updateButton}
                                onPress={handleUpdateNow}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator color="#fff" size="small" />
                                        <Text style={styles.updateButtonText}>Updating Health App...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.updateButtonText}>Update Now 🏥</Text>
                                )}
                            </TouchableOpacity>


                        </View>

                        {/* Health motivation */}
                        <Text style={styles.motivationText}>
                            "Better App = Better Health Care! 💙"
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        width: width * 0.9,
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#1976D2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 2,
        borderColor: '#E3F2FD',
    },
    imageContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    updateIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1976D2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    iconText: {
        fontSize: 40,
    },
    plusIcon: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusIconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1976D2',
    },
    brandName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 5,
        textAlign: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0D47A1',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#424242',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 20,
        backgroundColor: '#F8FBFF',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E3F2FD',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    featureIcon: {
        fontSize: 20,
        marginRight: 12,
        width: 30,
    },
    featureText: {
        fontSize: 14,
        color: '#1565C0',
        flex: 1,
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        color: '#616161',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 25,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 15,
    },
    updateButton: {
        backgroundColor: '#1976D2',
        paddingVertical: 16,
        paddingHorizontal: 30,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#1976D2',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    laterButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#BBDEFB',
    },
    laterButtonText: {
        color: '#1976D2',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    motivationText: {
        fontSize: 12,
        color: '#1976D2',
        fontStyle: 'italic',
        textAlign: 'center',
        fontWeight: '600',
    },
});