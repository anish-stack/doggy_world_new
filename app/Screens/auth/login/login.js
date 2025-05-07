
import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"
import { useToken } from "../../../hooks/useToken"
import { API_END_POINT_URL_LOCAL } from "../../../constant/constant"
import { getUser } from "../../../hooks/getUserHook"

export default function Login() {
  const navigation = useNavigation()
  const { refreshUser } = getUser()
  const { saveToken } = useToken()

  // Form state
  const [contactNumber, setContactNumber] = useState("")
  const [otp, setOtp] = useState("")

  // UI state
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [resendTimer, setResendTimer] = useState(0)

  // Handle resend timer
  useEffect(() => {
    let interval
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpSent, resendTimer])

  // Input validators
  const isValidPhoneNumber = number => /^\d{10}$/.test(number)
  const isValidOtp = code => /^\d{4,6}$/.test(code)

  // Handle input changes
  const handleNumberChange = text => {
    const cleanedText = text.replace(/[^0-9]/g, "")
    setContactNumber(cleanedText)
    setMessage({ type: "", text: "" })
  }



  // API calls
  const requestOtp = async () => {
    if (!contactNumber) {
      setMessage({ type: "error", text: "Please enter your contact number" })
      return
    }

    if (!isValidPhoneNumber(contactNumber)) {
      setMessage({ type: "error", text: "Please enter a valid 10-digit phone number" })
      return
    }

    try {
      setLoading(true)
      setMessage({ type: "", text: "" })

      const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/login-pet`, {
        petOwnertNumber: contactNumber,
      })

      if (response.data?.success) {
        setOtpSent(true)
        setMessage({ type: "success", text: "OTP sent successfully!" })
        setResendTimer(30)
      } else {
        setMessage({
          type: "error",
          text: response.data?.message || "Failed to send OTP. Please try again."
        })
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to send OTP. Please check your connection."
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!contactNumber || !otp) {
      setMessage({ type: "error", text: "Please enter both phone number and OTP" })
      return
    }

    if (!isValidOtp(otp)) {
      setMessage({ type: "error", text: "Please enter a valid OTP" })
      return
    }

    try {
      setLoading(true)
      setMessage({ type: "", text: "" })

      const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/login-pet-verify-otp`, {
        petOwnertNumber: contactNumber,
        otp: Number(otp),
      })

      if (response.data?.success) {
        const token = response.data.token

        if (!token) {
          setMessage({
            type: "error",
            text: "Verification successful, but no token received. Please contact support."
          })
          return
        }

        setMessage({ type: "success", text: "Login successful! Redirecting..." })
        await saveToken(token)
        await refreshUser()

        setTimeout(() => {
          navigation.navigate("Home")
        }, 1500)
      } else {
        setMessage({
          type: "error",
          text: response.data?.message || "Invalid OTP. Please try again."
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Verification failed. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setOtpSent(false)
    setOtp("")
    setMessage({ type: "", text: "" })
    setResendTimer(0)
  }

  // Format seconds to MM:SS
  const formatTime = seconds => {
    return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Background with overlay */}
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1560743641-3914f2c45636?q=80&w=2574&auto=format&fit=crop"
          }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />

        <View style={styles.content}>
          {/* Logo placeholder */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🐾</Text>
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your number"
                  value={contactNumber}
                  onChangeText={handleNumberChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor="#9EA0A4"
                  editable={!loading}
                />
              </View>
            </View>

            {/* OTP Section */}
            {otpSent && (
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>OTP Verification</Text>
                  {resendTimer > 0 && (
                    <Text style={styles.timer}>{formatTime(resendTimer)}</Text>
                  )}
                </View>
                <TextInput
                  style={{ borderWidth: 1, padding: 10, color: 'black' }}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={(text) => setOtp(text)}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor="#000"
                />


              </View>
            )}

            {/* Messages */}
            {message.text ? (
              <Text style={message.type === "error" ? styles.errorText : styles.successText}>
                {message.text}
              </Text>
            ) : null}

            {/* Primary Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={otpSent ? verifyOtp : requestOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {otpSent ? "Verify & Login" : "Send OTP"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Secondary Actions */}
            {otpSent ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={resetForm}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Change Number</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, resendTimer > 0 && styles.disabledSecondaryButton]}
                  onPress={requestOtp}
                  disabled={resendTimer > 0 || loading}
                >
                  <Text style={[
                    styles.secondaryButtonText,
                    resendTimer > 0 && styles.disabledSecondaryButtonText
                  ]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("register")}
              disabled={loading}
            >
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const { width, height } = Dimensions.get("window")

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    width,
    height,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    width,
    height,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: height * 0.07,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 40,
  },
  header: {
    alignItems: "center",
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginTop: 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "600",
    marginBottom: 8,
  },
  timer: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#F9F9F9",
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333333",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  successText: {
    color: "#43A047",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#FFADAD",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  secondaryButton: {
    padding: 8,
  },
  disabledSecondaryButton: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: "#FF6B6B",
    fontSize: 15,
    fontWeight: "500",
  },
  disabledSecondaryButtonText: {
    color: "#999999",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  footerText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginRight: 8,
  },
  signupText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
  },
});