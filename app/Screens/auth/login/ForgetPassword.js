import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import img from '../../../assets/authimages/forget.png';


export default function ForgetPassword({ navigation }) {
    const [contactNumber, setContactNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    const handleRequestOtp = () => {
        if (contactNumber === '') {
            Alert.alert('Error', 'Please enter your contact number');
            return;
        }
        // Simulate sending OTP
        Alert.alert('Success', 'OTP has been sent to your contact number');
        setShowOtp(true);
    };

    const handleChangePassword = () => {
        if (otp === '' || newPassword === '') {
            Alert.alert('Error', 'Please enter OTP and new password');
            return;
        }
        // Simulate password change
        Alert.alert('Success', 'Password changed successfully');
        navigation.navigate('login');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Image source={img} style={styles.image} />

            <View style={styles.innerContainer}>
                <Text style={styles.title}>Forgot Password</Text>

                <TextInput
                    placeholder="Contact Number"
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    style={styles.input}
                    keyboardType="phone-pad"
                />

                {showOtp && (
                    <TextInput
                        placeholder="OTP"
                        value={otp}
                        onChangeText={setOtp}
                        style={styles.input}
                        keyboardType="number-pad"
                    />
                )}

                {showOtp && (
                    <TextInput
                        placeholder="New Password"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        style={styles.input}
                    />
                )}

                <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={!showOtp ? handleRequestOtp : handleChangePassword}
                >
                    <Text style={styles.buttonText}>
                        {!showOtp ? 'Request OTP' : 'Change Password'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
 activeOpacity={0.9}onPress={() => navigation.navigate('login')} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Back to Login</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    innerContainer: {
        padding: 20,
        width: '90%',
        backgroundColor: '#ffffff',
        borderRadius: 10,

        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 250,
        resizeMode: 'contain',
        borderRadius: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#003873',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        backgroundColor: '#f8f8f8',
    },
    buttonContainer: {
        backgroundColor: '#ffe4e1',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkContainer: {
        marginTop: 15,
    },
    linkText: {
        color: '#003873',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
});
