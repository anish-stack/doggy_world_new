import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StyleSheet,
    Image,
    Alert,
    Animated,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { API_END_POINT_URL, API_END_POINT_URL_LOCAL } from '../../../constant/constant';
import { useToken } from '../../../hooks/useToken';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;

export default function OtpVerification() {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(1);
    const [loading, setLoading] = useState(false);
    const [otpInputs, setOtpInputs] = useState(Array(OTP_LENGTH).fill(''));
    const inputRefs = useRef([]);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { saveToken } = useToken()
    const navigation = useNavigation();
    const route = useRoute();
    const { contact_number } = route.params || {};

    useEffect(() => {
        startPulseAnimation();
        return () => pulseAnim.setValue(1);
    }, []);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const formatTime = () => {
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleOtpChange = (value, index) => {
        const newOtpInputs = [...otpInputs];
        newOtpInputs[index] = value;
        setOtpInputs(newOtpInputs);
        setOtp(newOtpInputs.join(''));

        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleResend = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/resend-otp`, {
                petOwnertNumber: contact_number
            });
            console.log("response", response.data)
            setTimer(1);
            setOtp('')
            Alert.alert("Success", "A new OTP has been sent to your WhatsApp.");
        } catch (error) {
            Alert.alert("Error", error.response?.data?.error?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (otp.length !== OTP_LENGTH) {
            Alert.alert("Error", "Please enter the complete OTP");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/verify-otp`, {
                otp:Number(otp),
                petOwnertNumber: contact_number,
            });
            console.log("response", response.data)
            const { message, token  } = response.data
            if (!token) {
                Alert.alert("Login", "Please try to login again");
            }
            saveToken(token)

            Alert.alert("Success", message);

            navigation.navigate('Home');
        } catch (error) {
            Alert.alert("Error", error.response?.data?.error || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#f7f7f7', '#ffffff']}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <Animated.View style={[styles.imageContainer]}>
                    <Image
                        source={require('../../../assets/authimages/verify.png')}
                        style={styles.image}
                    />
                </Animated.View>

                <View style={styles.headerContainer}>
                    <Text style={styles.title}>OTP Verification</Text>
                    <Text style={styles.instructions}>
                        Enter the OTP sent to your WhatsApp number
                        <Text style={styles.phoneNumber}> {contact_number}</Text>
                    </Text>
                </View>

                <View style={styles.otpContainer}>
                    {otpInputs.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => inputRefs.current[index] = ref}
                            style={styles.otpInput}
                            maxLength={1}
                            keyboardType="numeric"
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={({ nativeEvent }) => {
                                if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                                    inputRefs.current[index - 1].focus();
                                }
                            }}
                        />
                    ))}
                </View>

                <View style={styles.timerContainer}>
                    <MaterialIcons name="timer" size={20} color="#666" />
                    <Text style={styles.timerText}>
                        Time remaining: <Text style={styles.timerDigits}>{formatTime()}</Text>
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.resendButton, timer > 0 && styles.disabledButton]}
                        onPress={handleResend}
                        disabled={timer > 0 || loading}
                    >
                        <MaterialIcons name="refresh" size={20} color={timer > 0 ? "#999" : "#666"} />
                        <Text style={[styles.buttonText, timer > 0 && styles.disabledButtonText]}>
                            Resend OTP
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.verifyButton]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="check-circle" size={20} color="#fff" />
                                <Text style={[styles.buttonText, styles.verifyButtonText]}>
                                    Verify OTP
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    imageContainer: {
        marginTop: 40,
        marginBottom: 30,
    },
    image: {
        width: width * 0.7,
        height: width * 0.7,
        resizeMode: 'contain',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    instructions: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    phoneNumber: {
        fontWeight: 'bold',
        color: '#333',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        gap: 10,
    },
    otpInput: {
        width: 45,
        height: 55,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#fff',
        color: '#333',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    timerText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    timerDigits: {
        fontWeight: 'bold',
        color: '#FF7862',
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    resendButton: {
        backgroundColor: '#f8f8f8',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    verifyButton: {
        backgroundColor: '#FF7862',
    },
    buttonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    verifyButtonText: {
        color: '#fff',
    },
    disabledButton: {
        backgroundColor: '#f1f1f1',
        borderColor: '#e5e5e5',
    },
    disabledButtonText: {
        color: '#999',
    },
});