import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    Linking,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { useState as useStateForDescription } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageSlider from '../../layouts/ImageSlider';
import useGetBannersHook from '../../hooks/GetBannersHook';
import TopHeadPart from '../../layouts/TopHeadPart';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install expo/vector-icons
import Call_Header from '../../components/Call_header/Call_Header';

const BANNER_TYPE = 'vaccination';
const PHONE_NUMBER = 'tel:7217619794';

const VaccineTypeCard = ({ item, index }) => {
    const [showFullDescription, setShowFullDescription] = useStateForDescription(false);
    const maxDescriptionLength = 80;
    const needsReadMore = item.description.length > maxDescriptionLength;

    const toggleDescription = () => {
        setShowFullDescription(!showFullDescription);
    };

    return (
        <TouchableOpacity activeOpacity={0.7} style={styles.card}>
            <View style={styles.cardImageContainer}>
                <Image
                    source={{ uri: item.image.url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDescription}>
                    {showFullDescription
                        ? item.description
                        : needsReadMore
                            ? `${item.description.substring(0, maxDescriptionLength)}...`
                            : item.description
                    }
                </Text>

                {needsReadMore && (
                    <TouchableOpacity onPress={toggleDescription} style={styles.readMoreButton}>
                        <Text style={styles.readMoreText}>
                            {showFullDescription ? 'Show Less' : 'Read More'}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const VaccinedTypes = () => {
    const { fetchBanners, sliders } = useGetBannersHook();
    const [vaccineTypes, setVaccineTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const handleCallPress = useCallback(() => {
        Linking.openURL(PHONE_NUMBER);
    }, []);

    useEffect(() => {
        fetchBanners(BANNER_TYPE);
        fetchVaccineTypes();
    }, [fetchBanners]);

    const fetchVaccineTypes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/list-all-vaccine-types`);
            if (response.data && response.data.success) {
              
                const activeTypes = response.data.data.filter(item => item.is_active);
                const sortedTypes = activeTypes.sort((a, b) => a.position - b.position);
                setVaccineTypes(sortedTypes);
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch vaccine types:", error);
            setError("Failed to load vaccination services. Please try again later.");
            setLoading(false);
        }
    };
      const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Simulate a network request
        setTimeout(() => {
            fetchVaccineTypes()
          setRefreshing(false);
        }, 1500);
      }, [fetchVaccineTypes]);

    return (
        <>
            <TopHeadPart title={'Pick Your Vaccine Spot!'} fnc={handleCallPress} />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView   refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }  showsVerticalScrollIndicator={false}>
                    <ImageSlider images={sliders} />
                    <Call_Header />
                    <View style={styles.container}>



                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#ff3333" />
                                <Text style={styles.loadingText}>Loading services...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={50} color="#ff3333" />
                                <Text style={styles.errorText}>{error}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={fetchVaccineTypes}>
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.cardsContainer}>
                                {vaccineTypes.map((item, index) => (
                                    <VaccineTypeCard key={item._id} item={item} index={index} />
                                ))}
                            </View>
                        )}

              

                      
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff5f5',
    },
    container: {
        flex: 1,
        padding: 8,
    },
    headerContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#d30000',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 5,
    },
    cardsContainer: {
        marginTop: 10,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderColor: '#ffdddd',
        borderWidth: 1,
    },
    cardImageContainer: {
        position: 'relative',
    },
    cardImage: {
        height: 180,
        width: '100%',
    },
    cardContent: {
        padding: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#d30000',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
        marginBottom: 8,
    },
    readMoreButton: {
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    readMoreText: {
        color: '#d30000',
        fontWeight: '500',
        fontSize: 13,
    },
    bookButton: {
        backgroundColor: '#ff3333',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    loadingContainer: {
        padding: 30,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
    },
    errorContainer: {
        padding: 30,
        alignItems: 'center',
    },
    errorText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 15,
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: '#ff3333',
        borderRadius: 6,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    infoContainer: {
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        borderColor: '#ffdddd',
        borderWidth: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 10,
    },
    callUsButton: {
        flexDirection: 'row',
        backgroundColor: '#d30000',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    callUsButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default VaccinedTypes;