"use client"

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
import { getUser } from "../../../hooks/getUserHook"

// API base URL - should be moved to environment config in production
const API_BASE_URL = "https://admindoggy.adsdigitalmedia.com/api"

export default function Login() {
  // Navigation
  const navigation = useNavigation()
  const { getUserFnc } = getUser()

  // Form state
  const [contactNumber, setContactNumber] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")

  // UI state
  const [isOtpMode, setIsOtpMode] = useState(true)
  const [otpSent, setOtpSent] = useState(false)
  //Token Save Hook
  const { saveToken } = useToken()

  // Status state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Timer for OTP resend
  const [resendTimer, setResendTimer] = useState(0)

  // Start resend timer when OTP is sent
  useEffect(() => {
    let interval
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prevTimer) => prevTimer - 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [otpSent, resendTimer])

  // Reset states when switching between OTP and password modes
  useEffect(() => {
    setError("")
    setSuccess("")
    setOtp("")
    setOtpSent(false)
    setResendTimer(0)
  }, [isOtpMode])

  // Validate phone number format
  const isValidPhoneNumber = (number) => {
    return /^\d{10}$/.test(number)
  }

  // Handle phone number input with validation
  const handleNumberChange = (text) => {
    const cleanedText = text.replace(/[^0-9]/g, "")
    setContactNumber(cleanedText)

    setError("")
    setSuccess("")
  }

  const handlePasswordLogin = async () => {
    // Validate inputs
    if (!contactNumber || !password) {
      setError("Please enter both contact number and password")
      return
    }

    if (!isValidPhoneNumber(contactNumber)) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await axios.post(`${API_BASE_URL}/user-login`, {
        contact_number: contactNumber,
        password: password,
      })

      if (response.data && response.data.success) {
        setSuccess("Login successful!")


        setTimeout(() => {
          navigation.navigate("Home")
        }, 1000)
      } else {
        setError(response.data?.message || "Login failed. Please try again.")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(error.response?.data?.error?.message || "Unable to connect to server. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestOtp = async () => {

    if (!contactNumber) {
      setError("Please enter your contact number")
      return
    }

    if (!isValidPhoneNumber(contactNumber)) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    try {
      setLoading(true)
      setError("")

      const response = await axios.post(`${API_BASE_URL}/user-login-through-otp`, {
        contact_number: contactNumber,
      })

      if (response.data && response.data.success) {
        setOtpSent(true)
        setSuccess("OTP sent successfully!")
        setResendTimer(30) // 30 seconds cooldown for resend
      } else {
        setError(response.data?.message || "Failed to send OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP request error:", error)
      setError(error.response?.data?.error?.message || "Unable to send OTP. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    // Validate inputs
    if (!contactNumber || !otp) {
      setError("Please enter both contact number and OTP");
      return;
    }

    if (!isValidPhoneNumber(contactNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(`${API_BASE_URL}/user-login-verify-otp`, {
        contact_number: contactNumber,
        otp: otp,
      });

      if (response.data && response.data.success) {
        const token = response.data.token;

        if (!token) {
          setError("Verification successful, but no token received. Please contact support.");
          return;
        }

        setSuccess("OTP verified successfully!");
        await saveToken(token);
        await getUserFnc()
        setTimeout(() => {
          navigation.navigate("Home");
        }, 2000);
      } else {
        setError(response.data?.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setError(
        error.response?.data?.error?.message || "Unable to verify OTP. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };


  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return

    try {
      setLoading(true)
      setError("")

      const response = await axios.post(`${API_BASE_URL}/user-login-resend-otp`, {
        contact_number: contactNumber,
      })

      if (response.data && response.data.success) {
        setSuccess("OTP resent successfully!")
        setResendTimer(30) // 30 seconds cooldown for resend
      } else {
        setError(response.data?.message || "Failed to resend OTP. Please try again.")
      }
    } catch (error) {
      console.error("OTP resend error:", error)
      setError(error.response?.data?.error?.message || "Unable to resend OTP. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  // Toggle between OTP and password login
  const toggleLoginMode = () => {
    setIsOtpMode(!isOtpMode)
  }

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        {/* Background Image */}
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2969&auto=format&fit=crop" }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Your pets are waiting for you</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                placeholder="Enter your 10-digit phone number"
                value={contactNumber}
                autoFocus={true}
                onChangeText={handleNumberChange}
                style={[styles.input, { borderColor: "#000", borderWidth: 0.2 }]}
                keyboardType="phone-pad"
                placeholderTextColor="#A0A0A0"
                maxLength={10}
                editable={!loading}
              />
            </View>

            {/* Password or OTP Input */}
            {!isOtpMode ? (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text)
                    setError("")
                  }}
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#A0A0A0"
                  editable={!loading}
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <View style={styles.otpHeader}>
                  <Text style={styles.label}>OTP</Text>
                  {otpSent && resendTimer > 0 && (
                    <Text style={styles.timerText}>Resend in {formatTime(resendTimer)}</Text>
                  )}
                </View>
                <TextInput
                  placeholder="Enter OTP"
                  value={otp}
                  keyboardType="number-pad"
                  onChangeText={(text) => {
                    setOtp(text.replace(/[^0-9]/g, ""))
                    setError("")
                  }}
                  style={[styles.input, { backgroundColor: otpSent ? "#F5F5F5" : "#E8E8E8" }]}
                  placeholderTextColor="#A0A0A0"
                  editable={otpSent && !loading}
                  maxLength={6}
                />
              </View>
            )}

            {/* Error and Success Messages */}
            {error ? (
              <Text style={styles.errorMessage}>{error}</Text>
            ) : success ? (
              <Text style={styles.successMessage}>{success}</Text>
            ) : null}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={isOtpMode ? (otpSent ? handleVerifyOtp : handleRequestOtp) : handlePasswordLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {isOtpMode ? (otpSent ? "Verify OTP" : "Send OTP") : "Sign In"}
                </Text>
              )}
            </TouchableOpacity>


            {isOtpMode && otpSent && (
              <TouchableOpacity
                style={[styles.resendButton, (resendTimer > 0 || loading) && styles.disabledResendButton]}
                onPress={handleResendOtp}
                disabled={resendTimer > 0 || loading}
              >
                <Text style={[styles.resendText, (resendTimer > 0 || loading) && styles.disabledResendText]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.toggleButton} onPress={toggleLoginMode} disabled={loading}>
              <Text style={styles.toggleText}>{isOtpMode ? null : "Use OTP Instead"}</Text>
            </TouchableOpacity>

            {/* Forgot Password Link */}
            {!isOtpMode && (
              <TouchableOpacity
                onPress={() => navigation.navigate("forget-password")}
                style={styles.forgotPassword}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("register")} disabled={loading}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const { width, height } = Dimensions.get("window")

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundImage: {
    position: "absolute",
    width,
    height,
    top: 0,
    left: 0,
  },
  overlay: {
    position: "absolute",
    width,
    height,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  header: {
    marginTop: height * 0.1,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  otpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  timerText: {
    fontSize: 12,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  errorMessage: {
    color: "#E53935",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    color: "#43A047",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    height: 56,
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#FFADAD",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  resendButton: {
    marginTop: 12,
    alignItems: "center",
  },
  disabledResendButton: {
    opacity: 0.5,
  },
  resendText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
  },
  disabledResendText: {
    color: "#999",
  },
  toggleButton: {
    marginTop: 16,
    alignItems: "center",
  },
  toggleText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "500",
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#666",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    marginRight: 8,
  },
  signUpText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
  },
})

