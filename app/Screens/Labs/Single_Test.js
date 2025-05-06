import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { scale, verticalScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UpperLayout from '../../layouts/UpperLayout';
import Product_Slider from '../Pet_Shop/_Shop/Product_Slider';
import { useDispatch } from 'react-redux';
import { AddingStart, AddingSuccess } from '../../redux/slice/labTestCart';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Single_Test() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const route = useRoute();
    const { Test, typeOfTest, isUltraSound = false, ClinicId } = route.params || {};

    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTestDetails();
    }, [Test]);

    const fetchTestDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate[clinics][populate]=*&populate=OtherImages&filters[documentId][$eq]=${Test}`
            );
            setData(response.data.data[0] || null);
        } catch (error) {
            setError('Failed to load test details. Please try again.');
            console.error('Error fetching test details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddtoCart = (item) => {
        if (!item) return;

        const { documentId, test_name, discountPrice, test_price, OtherImages } = item;
        const cartItem = {
            documentId,
            test_name,
            isUltraSound: isUltraSound,
            discountPrice,
            test_price,
            typeOfTest,
            imageUrl: OtherImages?.[0]?.url || null,
        };

        dispatch(AddingStart());
        dispatch(AddingSuccess([cartItem]));
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#B32113" />
                <Text style={styles.loadingText}>Loading test details...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Icon name="error-outline" size={scale(50)} color="#B32113" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchTestDetails}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.centered}>
                <Icon name="info-outline" size={scale(50)} color="#666" />
                <Text style={styles.noDataText}>No test details available</Text>
            </View>
        );
    }

    return (
     <SafeAreaView style={{flex:1,paddingBottom:40}}>
           <View style={styles.container}>
            <UpperLayout isBellShow={false} title={data.test_name} />

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {data.OtherImages?.length > 0 && (
                    <View style={styles.sliderContainer}>
                        <Product_Slider
                            isNavigation={false}
                            PassHeight={verticalScale(250)}
                            images={data.OtherImages}
                        />
                    </View>
                )}

                <View style={styles.contentContainer}>
                    <View style={styles.headerSection}>
                        <Text style={styles.title}>{data.test_name}</Text>
                        <View style={styles.petTypeContainer}>
                            <Icon name="pets" size={scale(20)} color="#666" />
                            <Text style={styles.petTypeText}>Test For {data.PetType}</Text>
                        </View>
                    </View>

                    <View style={styles.priceSection}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.discountPrice}>₹{data.discountPrice}</Text>
                            <Text style={styles.originalPrice}>₹{data.test_price}</Text>
                        </View>
                        <View style={styles.savingsContainer}>
                            <Text style={styles.savingsText}>
                                Save ₹{data.test_price - data.discountPrice}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.detailsSection}>
                        <Text style={styles.sectionTitle}>Test Details</Text>
                        <Text style={styles.detailsText}>{data.Details}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddtoCart(data)}
                    activeOpacity={0.9}
                >
                    <Icon name="shopping-cart" size={scale(24)} color="#fff" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
     </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: verticalScale(10),
        color: '#666',
        fontSize: scale(14),
    },
    errorText: {
        color: '#B32113',
        fontSize: scale(16),
        marginTop: verticalScale(10),
        textAlign: 'center',
        paddingHorizontal: scale(20),
    },
    noDataText: {
        color: '#666',
        fontSize: scale(16),
        marginTop: verticalScale(10),
    },
    retryButton: {
        marginTop: verticalScale(20),
        paddingHorizontal: scale(30),
        paddingVertical: verticalScale(10),
        backgroundColor: '#B32113',
        borderRadius: scale(25),
    },
    retryButtonText: {
        color: '#fff',
        fontSize: scale(14),
        fontWeight: '600',
    },
    scrollContainer: {
        flex: 1,
    },
    sliderContainer: {
        backgroundColor: '#fff',
        marginBottom: verticalScale(10),
    },
    contentContainer: {
        padding: scale(15),
    },
    headerSection: {
        backgroundColor: '#fff',
        padding: scale(15),
        borderRadius: scale(10),
        marginBottom: verticalScale(10),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    title: {
        fontSize: scale(20),
        fontWeight: 'bold',
        color: '#333',
        marginBottom: verticalScale(8),
    },
    petTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    petTypeText: {
        fontSize: scale(14),
        color: '#666',
        marginLeft: scale(5),
    },
    priceSection: {
        backgroundColor: '#fff',
        padding: scale(15),
        borderRadius: scale(10),
        marginBottom: verticalScale(10),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    discountPrice: {
        fontSize: scale(24),
        fontWeight: 'bold',
        color: '#B32113',
    },
    originalPrice: {
        fontSize: scale(18),
        color: '#666',
        textDecorationLine: 'line-through',
        marginLeft: scale(10),
    },
    savingsContainer: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(5),
        borderRadius: scale(5),
        marginTop: verticalScale(8),
        alignSelf: 'flex-start',
    },
    savingsText: {
        color: '#2e7d32',
        fontSize: scale(12),
        fontWeight: '600',
    },
    detailsSection: {
        backgroundColor: '#fff',
        padding: scale(15),
        borderRadius: scale(10),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sectionTitle: {
        fontSize: scale(16),
        fontWeight: '600',
        color: '#333',
        marginBottom: verticalScale(8),
    },
    detailsText: {
        fontSize: scale(14),
        color: '#666',
        lineHeight: scale(20),
    },
    bottomContainer: {
        backgroundColor: '#fff',
        padding: scale(15),
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    addToCartButton: {
        backgroundColor: '#B32113',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(12),
        borderRadius: scale(10),
    },
    addToCartText: {
        color: '#fff',
        fontSize: scale(16),
        fontWeight: 'bold',
        marginLeft: scale(10),
    },
});