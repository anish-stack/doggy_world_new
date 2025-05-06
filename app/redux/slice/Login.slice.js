import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import axios from 'axios';

const initialState = {
    token: null,
    isAuthenticated: false,
    pet: null,
    loading: false,
    status: 401,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
            state.status = 401;
        },
        loginSuccess: (state, action) => {
            state.loading = false;
            state.token = action.payload.token;  // Fix: Directly accessing token
            state.pet = action.payload.petInData; // Fix: Directly accessing petInData
            state.status = 201;
            state.isAuthenticated = true;
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.status = 401;
            state.error = action.payload;
        },
        logout: (state) => {
            state.token = null;
            state.pet = null;
            state.status = 401;
            state.isAuthenticated = false;
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

// Thunk for logging in the user
export const loginUser = (contactNumber, otp, navigation) => async (dispatch) => {
    try {
        dispatch(loginStart());
        console.log('Login process started');

        const response = await axios.post(
            'https://admindoggy.adsdigitalmedia.com/api/v1/pet/pet-register-VerifyOtp',
            { ContactNumber: contactNumber, otp, type: 'login' }
        );

        const token = response?.data?.token;
        const petInData = response?.data?.user;

        if (token && petInData) {
            await AsyncStorage.setItem('token', JSON.stringify(token));
            await AsyncStorage.setItem('pet', JSON.stringify(petInData));

            dispatch(loginSuccess({ token, petInData }));

            Toast.show({
                type: 'success',
                text1: 'Login Successful! 🐾',
                text2: 'You have successfully logged in to your pet profile!',
            });
            navigation.navigate('home')
        } else {
            dispatch(loginFailure('Login failed, no token received.'));
        }
    } catch (error) {
        console.error('Login error:', error);
        dispatch(loginFailure(error?.response?.data?.message || 'An error occurred during login'));
    }
};

// Thunk for checking auth token on app start
export const checkAuthToken = () => async (dispatch) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const petInData = await AsyncStorage.getItem('pet');

        if (token && petInData) {
            dispatch(loginSuccess({
                token: JSON.parse(token),
                petInData: JSON.parse(petInData) // Ensure this is parsed correctly
            }));
        } else {
            dispatch(logout()); // If no token or pet data, log out
        }

    } catch (error) {
        dispatch(loginFailure('Failed to load token from storage'));
        console.error('Error loading token or pet data:', error);
    }
};

// Thunk for logging out the user
export const logoutUser = () => async (dispatch) => {
    try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('pet'); // Also remove pet data on logout
        dispatch(logout());
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export default authSlice.reducer;
