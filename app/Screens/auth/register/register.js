import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_END_POINT_URL, API_END_POINT_URL_LOCAL } from '../../../constant/constant';
import usePetType from '../../../hooks/usePetType';
import useNotificationPermission from '../../../hooks/notification';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#E53935', // Primary red
  secondary: '#C62828', // Darker red
  accent: '#FFCDD2', // Light red
  error: '#B71C1C', // Deep red
  success: '#4CAF50',
  background: '#FFF5F5', // Very light red tint
  surface: '#FFFFFF',
  text: '#37474F',
  border: '#FFEBEE'
};

// SVG Background Pattern Component



export default function Register() {
  const [formData, setFormData] = useState({
    petType: '',
    petName: '',
    contactNumber: '',
    petDob: new Date(),
    petBreed: '',

    isGivePermissionToSendNotification: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '#ccc' });

  const { petTypes } = usePetType();
  const { isGranted, requestPermission } = useNotificationPermission();
  const navigation = useNavigation();

  useEffect(() => {

    setFormData(prev => ({
      ...prev,
      isGivePermissionToSendNotification: isGranted
    }));
  }, [isGranted]);



  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.petType) newErrors.petType = 'Please select a pet type';
    if (!formData.petName?.trim()) newErrors.petName = 'Pet name is required';

    if (!formData.contactNumber?.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.petBreed?.trim()) newErrors.petBreed = 'Pet breed is required';



    if (formData.petDob > new Date()) {
      newErrors.petDob = 'Birth date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = useMemo(() => {
    return formData.petType &&
      formData.petName?.trim() &&
      formData.contactNumber?.trim() &&
      formData.petBreed?.trim() 
    
  }, [formData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field being updated
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestPermission();
    setFormData(prev => ({
      ...prev,
      isGivePermissionToSendNotification: granted
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm() || loading) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_END_POINT_URL_LOCAL}/api/v1/register-pet`, formData);

      Alert.alert(
        'Registration Successful!',
        'Your furry friend has been registered successfully.',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('otp', {
              data: response.data,
              contact_number: formData.contactNumber
            })
          }
        ]
      );
    } catch (error) {
      console.log(error);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.error?.message || 'Please try again later'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderInputField = useCallback(({ icon, placeholder, field, keyboardType = 'default', secureTextEntry = false }) => (
    <>
      <View style={styles.inputContainer}>
        <MaterialIcons name={icon} size={20} color={THEME.primary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={formData[field]}
          onChangeText={(text) => handleInputChange(field, text)}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPassword}
          editable={!loading}
          placeholderTextColor="#9E9E9E"
        />
        {field === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={THEME.primary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={16} color={THEME.error} />
          <Text style={styles.errorText}>{errors[field]}</Text>
        </View>
      )}
    </>
  ), [formData, errors, showPassword, loading]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Pattern */}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[THEME.primary, THEME.secondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.header}>
              <MaterialIcons name="pets" size={48} color="#FFF" />
              <Text style={styles.title}>Paw Registration</Text>
              <Text style={styles.subtitle}>Create an account for your furry friend</Text>
            </View>
          </LinearGradient>

          {errors.petType && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color={THEME.error} />
              <Text style={styles.errorText}>{errors.petType}</Text>
            </View>
          )}

          <View style={styles.petTypeContainer}>
            {petTypes.map((type) => (
              <TouchableOpacity
                key={type?.petType}
                style={[
                  styles.petTypeButton,
                  formData.petType === type?._id && styles.selectedPetTypeButton,
                  loading && styles.disabledButton
                ]}
                onPress={() => handleInputChange('petType', type?._id)}
                disabled={loading}
              >
                <FontAwesome5
                  name={type?.petType.toLowerCase()}
                  size={24}
                  color={formData.petType === type?._id ? THEME.surface : THEME.text}
                />
                <Text
                  style={[
                    styles.petTypeText,
                    formData.petType === type?._id && styles.selectedPetTypeText
                  ]}
                >
                  {type?.petType.charAt(0).toUpperCase() + type?.petType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderInputField({
            icon: 'pets',
            placeholder: ' Pet Name',
            field: 'petName'
          })}

          {renderInputField({
            icon: 'phone',
            placeholder: 'Contact Number',
            field: 'contactNumber',
            keyboardType: 'phone-pad'
          })}

          <View style={styles.dateSection}>
            <TouchableOpacity
              style={[styles.datePickerButton, loading && styles.disabledButton, errors.petDob && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <MaterialIcons name="calendar-today" size={20} color={THEME.primary} />
              <Text style={styles.datePickerText}>
                {moment(formData.petDob).format('MMMM D, YYYY')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dateLabel}>📅 Pet's Birthday</Text>

            {errors.petDob && (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={16} color={THEME.error} />
                <Text style={styles.errorText}>{errors.petDob}</Text>
              </View>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.petDob}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) handleInputChange('petDob', selectedDate);
              }}
            />
          )}

          {renderInputField({
            icon: 'pets',
            placeholder: 'Pet Breed',
            field: 'petBreed'
          })}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={[THEME.primary, THEME.secondary]}
              style={[
                styles.button,
                (!isFormValid || loading) && styles.disabledButton
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color={THEME.surface} />
              ) : (
                <>
                  <MaterialIcons name="pets" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Register Pet</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('login')}
            style={styles.loginLink}
            disabled={loading}
          >
            <Text style={styles.loginText}>Already a pet parent? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  backgroundPatternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerGradient: {
    width: '100%',
    borderRadius: 15,
    marginTop: 20,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 5,
    opacity: 0.9,
  },
  petTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
  },
  petTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: THEME.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 10,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  selectedPetTypeButton: {
    backgroundColor: THEME.primary,
    borderColor: THEME.secondary,
  },
  petTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  selectedPetTypeText: {
    color: THEME.surface,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: THEME.surface,
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  inputError: {
    borderColor: THEME.error,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
  },
  dateSection: {
    width: '100%',
    marginBottom: 15,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: THEME.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  datePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: THEME.text,
  },
  dateLabel: {
    fontSize: 12,
    color: THEME.primary,
    marginTop: 5,
    marginLeft: 5,
  },
  passwordStrength: {
    width: '100%',
    marginBottom: 20,
    backgroundColor: '#E0E0E0',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
  },
  notificationPermission: {
    width: '100%',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: THEME.primary,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: THEME.primary,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: THEME.text,
  },
  button: {
    width: '100%',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
  },
  buttonText: {
    color: THEME.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    padding: 10,
  },
  loginText: {
    color: THEME.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: -10,
    paddingHorizontal: 5,
    alignSelf: 'flex-start',
  },
  errorText: {
    color: THEME.error,
    fontSize: 12,
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});