import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
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
import { API_END_POINT_URL } from '../../../constant/constant';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#4A90E2',
  secondary: '#5C6BC0',
  accent: '#FF9800',
  error: '#F44336',
  success: '#4CAF50',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#2C3E50',
  border: '#E0E6ED'
};

export default function Register() {
  const [formData, setFormData] = useState({
    petType: '',
    name: '',
    contactNumber: '',
    breed: '',
    age: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  const navigation = useNavigation();

  // Password strength calculation using useMemo
  const passwordStrength = useMemo(() => {
    const { password } = formData;
    let score = 0;
    if (!password) return { score: 0, message: '', color: '#ccc' };

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthMap = {
      0: { message: 'Very Weak', color: THEME.error },
      1: { message: 'Weak', color: '#FFA726' },
      2: { message: 'Medium', color: THEME.accent },
      3: { message: 'Strong', color: '#66BB6A' },
      4: { message: 'Very Strong', color: THEME.success }
    };

    return { score, ...strengthMap[score] };
  }, [formData.password]);

  // Form validation using useMemo
  const isFormValid = useMemo(() => {
    const { name, contactNumber, breed, password, petType } = formData;
    return (
      name.length >= 2 &&
      /^[0-9]{10}$/.test(contactNumber) &&
      breed.length > 0 &&
      password.length >= 6 &&
      petType !== ''
    );
  }, [formData]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for the field being updated
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const { name, contactNumber, breed, password } = formData;

    if (!name || name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!/^[0-9]{10}$/.test(contactNumber)) newErrors.contactNumber = 'Enter valid 10-digit number';
    if (!breed) newErrors.breed = 'Breed is required';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async () => {
    if (!validateForm() || loading) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_END_POINT_URL}/api/register`, {
        PetType: formData.petType,
        petName: formData.name,
        contact_number: formData.contactNumber,
        Breed: formData.breed,
        DOB: date.toISOString(),
        Age: moment().diff(moment(date), 'years', true).toFixed(1),
        password: formData.password
      });

      navigation.navigate('otp', {
        data: response.data,
        contact_number: formData.contactNumber
      });
    } catch (error) {
        console.log(error)
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
        <MaterialIcons name={icon} size={20} color={THEME.text} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={formData[field]}
          onChangeText={(text) => handleInputChange(field, text)}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !showPassword}
          editable={!loading}
        />
        {field === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={THEME.text}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}

    </>
  ), [formData, errors, showPassword, loading]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <MaterialIcons name="pets" size={40} color={THEME.primary} />
            <Text style={styles.title}>Register Your Pet</Text>
            <Text style={styles.subtitle}>Create an account for your furry friend</Text>
          </View>

          <View style={styles.petTypeContainer}>
            {['dog', 'cat'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.petTypeButton,
                  formData.petType === type && styles.selectedPetTypeButton,
                  loading && styles.disabledButton
                ]}
                onPress={() => handleInputChange('petType', type)}
                disabled={loading}
              >
                <FontAwesome5
                  name={type}
                  size={24}
                  color={formData.petType === type ? THEME.surface : THEME.text}
                />
                <Text
                  style={[
                    styles.petTypeText,
                    formData.petType === type && styles.selectedPetTypeText
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderInputField({
            icon: 'pets',
            placeholder: 'Pet Name',
            field: 'name'
          })}

          {renderInputField({
            icon: 'phone',
            placeholder: 'Contact Number',
            field: 'contactNumber',
            keyboardType: 'phone-pad'
          })}

          <TouchableOpacity
            style={[styles.datePickerButton, loading && styles.disabledButton]}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <MaterialIcons name="calendar-today" size={20} color={THEME.text} />
            <Text style={styles.datePickerText}>
              {moment(date).format('MMMM D, YYYY')}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {renderInputField({
            icon: 'pets',
            placeholder: 'Breed',
            field: 'breed'
          })}

          {renderInputField({
            icon: 'lock',
            placeholder: 'Password',
            field: 'password',
            secureTextEntry: true
          })}

          {formData.password && (
            <View style={styles.passwordStrength}>
              <View
                style={[
                  styles.strengthBar,
                  { backgroundColor: passwordStrength.color }
                ]}
              />
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.message}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={[THEME.error, THEME.error]}
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
                <Text style={styles.buttonText}>Register Pet</Text>
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
  scrollContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  petTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
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
  },
  selectedPetTypeButton: {
    backgroundColor: THEME.primary,
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
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
  },
  datePickerButton: {
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
  },
  datePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: THEME.text,
  },
  passwordStrength: {
    width: '100%',
    marginBottom: 20,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 5,
  },
  strengthText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
  errorText: {
    color: THEME.error,
    fontSize: 12,
    marginBottom: 15,
    marginTop: -10,
    alignSelf: 'flex-start',
    marginLeft: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
});