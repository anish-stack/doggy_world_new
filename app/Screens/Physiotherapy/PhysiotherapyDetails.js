import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, Linking } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import TopHeadPart from '../../layouts/TopHeadPart';

const { width } = Dimensions.get('window');
const PHONE_NUMBER = 'tel:9811299059';

export default function PhysiotherapyDetails() {
    const navigation = useNavigation();
    const route = useRoute();
    const { service } = route.params;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleCallPress = useCallback(() => {
        Linking.openURL(PHONE_NUMBER);
    }, []);

    const handleBookNow = () => {
        navigation.navigate('PhysioBooking', {service:service})
    };

    const handleImageChange = (index) => {
        setCurrentImageIndex(index);
    };

    return (
        <View style={styles.container}>
            <TopHeadPart title={service.title} fnc={() => navigation.goBack()} isBackButton={true} />

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                {/* Image Carousel */}
                <View style={styles.imageCarouselContainer}>
                    {service.imageUrl && service.imageUrl.length > 0 && (
                        <Image
                            source={{ uri: service.imageUrl[currentImageIndex].url }}
                            style={styles.mainImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Image Thumbnails */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.thumbnailsContainer}
                    >
                        {service.imageUrl && service.imageUrl.map((img, index) => (
                            <TouchableOpacity
                                key={img._id}
                                onPress={() => handleImageChange(index)}
                                style={[
                                    styles.thumbnailButton,
                                    currentImageIndex === index && styles.activeThumbnail
                                ]}
                            >
                                <Image
                                    source={{ uri: img.url }}
                                    style={styles.thumbnailImage}
                                    resizeMode="fill"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Service Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        {service.popular && (
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularText}>Popular</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.priceContainer}>
                        {service.discountPrice < service.price ? (
                            <>
                                <Text style={styles.discountPrice}>₹{service.discountPrice}</Text>
                                <Text style={styles.originalPrice}>₹{service.price}</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>{service.offPercentage}% OFF</Text>
                                </View>
                            </>
                        ) : (
                            <Text style={styles.price}>₹{service.price}</Text>
                        )}
                        <Text style={styles.duration}>{service.priceMinute}</Text>
                    </View>

                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Overview</Text>
                        <Text style={styles.descriptionText}>{service.smallDesc}</Text>
                    </View>

                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{service.description}</Text>
                    </View>

                    <View style={styles.benefitsContainer}>
                        <Text style={styles.benefitsTitle}>Benefits</Text>
                        <View style={styles.benefitsList}>
                            <View style={styles.benefitItem}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.benefitText}>Improves mobility and flexibility</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.benefitText}>Reduces pain and inflammation</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.benefitText}>Accelerates recovery from injuries</Text>
                            </View>
                            <View style={styles.benefitItem}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.benefitText}>Enhances overall well-being</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Book Now Button */}
            <View style={styles.bookingContainer}>
                <View style={styles.bookingPriceContainer}>
                    <Text style={styles.bookingPriceLabel}>Price</Text>
                    <Text style={styles.bookingPrice}>
                        ₹{service.discountPrice < service.price ? service.discountPrice : service.price}
                    </Text>
                </View>
                <TouchableOpacity style={styles.bookNowButton} onPress={handleBookNow}>
                    <Text style={styles.bookNowText}>Book Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FF',
    },
    scrollView: {
        flex: 1,
    },
    imageCarouselContainer: {
        width: '100%',
        backgroundColor: 'white',
    },
    mainImage: {
        width: '100%',
        objectFit: 'fill',
        height: 240,
    },
    thumbnailsContainer: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: 'white',
    },
    thumbnailButton: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    activeThumbnail: {
        borderColor: '#ed8280',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        objectFit: 'fill'
    },
    detailsContainer: {
        padding: 16,
        backgroundColor: 'white',
        marginTop: 10,
        borderRadius: 16,
        marginHorizontal: 4,
        marginBottom: 100, // Space for the fixed booking button
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    serviceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    popularBadge: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    popularText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#F5F7FF',
        padding: 12,
        borderRadius: 12,
    },
    price: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ed8280',
    },
    discountPrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ed8280',
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 18,
        color: '#999',
        textDecorationLine: 'line-through',
        marginRight: 8,
    },
    discountBadge: {
        backgroundColor: '#4ECDC4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
    },
    discountText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    duration: {
        fontSize: 16,
        color: '#666',
        marginLeft: 'auto',
    },
    descriptionContainer: {
        marginBottom: 20,
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    benefitsContainer: {
        marginBottom: 20,
    },
    benefitsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    benefitsList: {
        backgroundColor: '#F5F7FF',
        padding: 16,
        borderRadius: 12,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    bulletPoint: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ed8280',
        marginRight: 10,
    },
    benefitText: {
        fontSize: 16,
        color: '#333',
    },
    bookingContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        alignItems: 'center',
        justifyContent: 'space-between',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bookingPriceContainer: {
        flex: 1,
    },
    bookingPriceLabel: {
        fontSize: 14,
        color: '#666',
    },
    bookingPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4A3780',
    },
    bookNowButton: {
        backgroundColor: '#ed8280',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginLeft: 16,
    },
    bookNowText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});