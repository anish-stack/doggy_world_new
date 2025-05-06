import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

export default function GroomingServices() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedServiceId, setExpandedServiceId] = useState(null);
    const navigation = useNavigation()
    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await axios.get('https://admindoggy.adsdigitalmedia.com/api/grooming-services?populate=*');
            setServices(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load services. Please try again later.');
            setLoading(false);
        }
    };

    const handleReadMore = (id) => {
        setExpandedServiceId(expandedServiceId === id ? null : id);
    };

    const renderService = ({ item }) => {
        const isExpanded = expandedServiceId === item.id;
        const imageUrl = item.image[0]?.url || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400';

        return (
            <TouchableOpacity disabled={!item.Booking_Accept} activeOpacity={0.9} onPress={() => navigation.navigate('clinic', {
                id: item,
                type: 'General Booking'

            })} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.serviceTypeContainer}>
                        <FontAwesome5 name="dog" size={20} color="#B32113" />
                        <Text style={styles.serviceType}>{item.type}</Text>
                    </View>
                    {item.anyOffer && (
                        <View style={styles.offerBadge}>
                            <MaterialIcons name="local-offer" size={16} color="#fff" />
                            <Text style={styles.offerText}>OFFER</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.imageContainer}>
                        <Image resizeMode='stretch' source={{ uri: imageUrl }} style={styles.image} />
                    </View>

                    <View style={styles.detailsContainer}>
                        <Text style={styles.description} numberOfLines={isExpanded ? undefined : 3}>
                            {item.desc}
                        </Text>

                        <TouchableOpacity onPress={() => handleReadMore(item.id)} style={styles.readMoreButton}>
                            <Text style={styles.readMoreText}>
                                {isExpanded ? 'Read Less' : 'Read More'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceText}>
                                ₹{item.startPrice} - ₹{item.endPrice}
                            </Text>
                            {item.PriceVary && (
                                <Text style={styles.priceNote}>
                                    *Price varies based on breed
                                </Text>
                            )}
                        </View>

                        {item.anyOffer && (
                            <View style={styles.offerContainer}>
                                <MaterialIcons name="stars" size={16} color="#B32113" />
                                <Text style={styles.offerDetails}>{item.offer}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.bookButton,
                                !item.Booking_Accept && styles.bookButtonDisabled
                            ]}
                            onPress={() => navigation.navigate('clinic', { id: item ,  type: 'General Booking'
                            })}
                            disabled={!item.Booking_Accept}
                        >
                            <Text style={styles.bookButtonText}>
                                {item.Booking_Accept ? 'Book Now' : 'Booking Closed'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#B32113" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color="#B32113" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={services}
                renderItem={renderService}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.box}>
                <TouchableOpacity
                    activeOpacity={0.9} onPress={() => navigation.navigate('Gromming_More_service', { item: services })} style={styles.buttonContainer}>
                    <Text style={styles.customText}>View More Services</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.9} onPress={() => navigation.navigate('Create_Custom_Service')} style={styles.buttonContainer} >
                    <Text style={styles.customText}>Create Custom Package</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    listContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    serviceTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    serviceType: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    offerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#B32113',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    offerText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 200,
    },
    detailsContainer: {
        flex: 1,
        marginLeft: 16,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    readMoreButton: {
        marginTop: 8,
    },
    readMoreText: {
        color: '#B32113',
        fontSize: 14,
        fontWeight: '600',
    },
    priceContainer: {
        marginTop: 12,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    priceNote: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    offerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    offerDetails: {
        fontSize: 13,
        color: '#B32113',
        flex: 1,
    },
    bookButton: {
        backgroundColor: '#B32113',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
    },
    bookButtonDisabled: {
        backgroundColor: '#ccc',
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 12,
    },
    retryButton: {
        backgroundColor: '#B32113',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    box: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',


    },
    buttonContainer: {
        flex: 1,
        borderRadius: 8,
        backgroundColor: '#B32113',
        gap: 0,
        margin: 2
    },
    customText: {
        fontSize: 10,
        color: '#ffffff',
        textAlign: 'center',
        marginVertical: 12,
        fontWeight: 'bold',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 25,

        textTransform: 'uppercase',

    }
});