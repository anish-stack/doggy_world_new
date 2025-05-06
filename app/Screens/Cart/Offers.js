import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native';
import axios from 'axios';
import UpperLayout from '../../layouts/UpperLayout';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Offers() {
    const navigation = useNavigation()
    const [coupon, setCoupon] = useState('');
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expand, setExpand] = useState(null);

    const handleApplyCoupon = () => {
        if (coupon.trim()) {
            Alert.alert('Coupon Applied', `You applied the coupon: ${coupon}`);
        } else {
            Alert.alert('Error', 'Please enter a valid coupon code.');
        }
    };

    const handleExpand = (index) => {
        setExpand((prev) => (prev === index ? null : index));
    };

    const fetchOffers = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get('https://admindoggy.adsdigitalmedia.com/api/offers?populate=*');
            if (data && data.data.length) {
                setOffers(data.data);
            } else {
                setError('No available offers found.');
            }
        } catch (err) {
            setError('Internal Server Error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    return (
        <SafeAreaView
            style={{ backgroundColor: '#fff', flex: 1 }}
        >

            <View style={styles.container}>
                <UpperLayout title="Apply Coupon" isBellShow={false} />
                <ScrollView>


                    <View style={styles.couponContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter Coupon Code"
                            value={coupon}
                            onChangeText={setCoupon}
                        />
                        <TouchableOpacity
                            activeOpacity={0.9} style={styles.button} onPress={handleApplyCoupon}>
                            <Text style={styles.buttonText}>APPLY</Text>
                        </TouchableOpacity>
                    </View>


                    {error ? (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}


                    <View style={styles.availableContainer}>
                        <Text style={styles.availableText}>Available Coupons</Text>
                        {loading ? (
                            <ActivityIndicator size="large" color="#0d6efd" />
                        ) : (
                            <View style={styles.offersList}>
                                {offers && offers.map((offer, index) => (
                                    <View key={offer.id} style={styles.offerCard}>
                                        <View style={styles.row}>
                                            <View style={[styles.row, { gap: 15 }]}>
                                                <Image source={{ uri: offer?.icon?.url }} style={styles.image} />
                                                <Text style={styles.offerTitle}>{offer.Code}</Text>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    navigation.navigate('cart', { offerClick: offer });
                                                }}
                                            >
                                                <Text style={styles.ApplyText}>
                                                    Apply
                                                </Text>
                                            </TouchableOpacity>

                                        </View>
                                        <Text style={styles.offerDescription}>{offer.desc}</Text>

                                        <View key={index} style={styles.expandContainer}>
                                            <TouchableOpacity
                                                style={styles.expandButton}
                                                onPress={() => handleExpand(index)}
                                            >
                                                <Text style={styles.buttonExpandText}>
                                                    {expand === index ? '- Less' : '+ More'}
                                                </Text>
                                            </TouchableOpacity>

                                            {expand === index && (
                                                <View style={styles.termsContainer}>
                                                    <Text style={styles.termsText}>
                                                        {offer.TermAndCondition}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    couponContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: '#ffffff',
    },
    button: {
        marginLeft: 12,
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    buttonText: {
        color: '#B32113',
        fontSize: 20,
        fontWeight: 'bold',
    },
    availableContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    availableText: {
        fontSize: 22,
        color: '#333',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    offersList: {
        marginTop: 10,
    },
    offerCard: {
        backgroundColor: '#ffffff',

        padding: 16,
        marginBottom: 10,

    },
    row: {
        gap: 3,
        flexDirection: 'row',
        alignItems: 'start',
        justifyContent: 'space-between',

    },
    offerTitle: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        paddingVertical: 5,
        backgroundColor: 'rgba(179, 33, 19, 0.2)',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',

    },
    image: {
        width: 35,
        height: 35,
        borderRadius: 8,
        marginBottom: 10,
        resizeMode: 'cover',
        backgroundColor: '#f9f9f9',
    },
    offerDescription: {
        fontSize: 14,
        fontWeight: '500',

        lineHeight: 20,
        borderRadius: 8,
        color: '#111',
        marginTop: 4,
    },
    errorBanner: {
        marginTop: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f8d7da',
        borderRadius: 8,
    },
    ApplyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#b52518',
    },
    errorText: {
        color: '#721c24',
        fontSize: 16,
    },
    expandContainer: {
        marginVertical: 10,


    },
    expandButton: {

        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    buttonExpandText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    termsContainer: {
        marginTop: 12,
        borderRadius: 8,
    },
    termsText: {
        fontSize: 14,
        color: '#777',
        lineHeight: 20,
    },
});
