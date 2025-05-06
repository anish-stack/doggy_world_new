import { View, Text, StyleSheet, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '../../layouts/Layout';
import Slider from '../../components/Slider/Slider';
import LocationTab from '../../layouts/locationTab';
import Categories from '../../components/Categories/Categories';
import Doctors from '../Doctors/Doctors';
import * as Location from 'expo-location';
import axios from 'axios';
import Blogs from '../../components/Blogs/Blogs';
import Made from '../../components/love/Made';

export default function Home() {
    // State management
    const [location, setLocation] = useState(null);
    const [locData, setLocData] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastFetchedCoords, setLastFetchedCoords] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Request location permissions
    const requestLocationPermission = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return false;
        }
        return true;
    }, []);

    // Get current location
    const getLocation = useCallback(async () => {
        try {
            const hasPermission = await requestLocationPermission();
            if (hasPermission) {
                const userLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
                setLocation(userLocation);
            }
        } catch (error) {
            setErrorMsg('Error getting location: ' + error.message);
        }
    }, [requestLocationPermission]);

    console.log("refreshing", refreshing)
    const fetchCurrentLocation = useCallback(async (latitude, longitude) => {

        if (lastFetchedCoords) {
            const latDiff = Math.abs(lastFetchedCoords.latitude - latitude);
            const lngDiff = Math.abs(lastFetchedCoords.longitude - longitude);

            // If coordinates are close to previously fetched coordinates (within ~100 meters), don't fetch again
            if (latDiff < 0.001 && lngDiff < 0.001) {
                return;
            }
        }

        try {
            const { data } = await axios.post('https://api.srtutorsbureau.com/Fetch-Current-Location', {
                lat: latitude,
                lng: longitude
            });

            if (data.data?.address) {
                setLocData(data.data);
                // Remember these coordinates to avoid redundant API calls
                setLastFetchedCoords({ latitude, longitude });
            }
        } catch (error) {
            console.log(error?.response || error);
        }
    }, [lastFetchedCoords]);

    // Initial location fetch on component mount
    useEffect(() => {
        getLocation();
    }, []);

    // Fetch location data when coordinates change
    useEffect(() => {
        if (location?.coords?.latitude && location?.coords?.longitude) {
            fetchCurrentLocation(location.coords.latitude, location.coords.longitude);
        }
    }, [location, fetchCurrentLocation]);

    // Show error alerts
    useEffect(() => {
        if (errorMsg) {
            Alert.alert('Location Error', errorMsg);
        }
    }, [errorMsg]);

    // Pull-to-refresh handler with loading state
    const onRefresh = useCallback(async () => {

        setRefreshing(true);
        setIsLoading(true);
        setLoadingMessage('Updating your location...');


        const timerPromise = new Promise(resolve => setTimeout(resolve, 3000));

        await Promise.all([timerPromise]);

        setRefreshing(false);
        setIsLoading(false);
        setLoadingMessage('');
    }, [getLocation]);

    // Memoize child components to prevent unnecessary re-renders
    const memoizedLocationTab = useMemo(() => <LocationTab data={locData} />, [locData]);
    const memoizedSlider = useMemo(() => <Slider Refresh={refreshing} />, [refreshing]);
    const memoizedCategories = useMemo(() => <Categories Refresh={refreshing} />, [refreshing])
    const memoizedDoctors = useMemo(() => <Doctors />, []);
    const memoizedBlogs = useMemo(() => <Blogs />, []);
    const memoizedMade = useMemo(() => <Made />, []);

    return (
        <Layout onRefresh={onRefresh} refreshing={() => setRefreshing(true)}>
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <View style={styles.loaderContent}>
                        <ActivityIndicator size="large" color="#0066cc" />
                        <Text style={styles.loaderText}>{loadingMessage}</Text>
                    </View>
                </View>
            )}
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0066cc']}
                    />
                }

            >
                <View>
                    {memoizedLocationTab}
                    {memoizedSlider}
                    {memoizedCategories}
                    {memoizedDoctors}
                    {memoizedBlogs}
                    {memoizedMade}
                </View>
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        padding: 0,
        marginBottom: 20,
    },
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    loaderContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
});