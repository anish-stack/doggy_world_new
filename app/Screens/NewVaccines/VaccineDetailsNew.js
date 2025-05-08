import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Dimensions, SafeAreaView } from 'react-native'
import React, { useState, useCallback, useEffect } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';
import TopHeadPart from '../../layouts/TopHeadPart';
// import Carousel from 'react-native-snap-carousel';
import { AntDesign, Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import styles from './VaccineDetailesNewStyle';

const screenWidth = Dimensions.get('window').width;
export default function VaccineDetailsNew() {
    const route = useRoute()
    const { type, id, Typeid } = route.params || {}
    const [vaccine, setVaccine] = useState(null)
    const [relatedVaccines, setRelatedVaccines] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const [selectedLocationType, setSelectedLocationType] = useState(type === 'Home vaccination' ? 'Home' : 'Clinic');

    const { width: screenWidth } = Dimensions.get('window');

    const fetchVaccine = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/vaccine-product/${id}`);
            if (response.data && response.data.success) {
                setVaccine(response.data.data);
            } else {
                setError('Failed to fetch vaccine details');
            }
        } catch (error) {
            setError('Error connecting to server');
            console.error('Error fetching vaccine:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    const fetchOtherVaccinesExceptsId = useCallback(async () => {
        try {
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/vaccine-products`);
            if (response.data && response.data.success) {
                // Filter out current vaccine and get vaccines of similar type
                const data = response.data.data.filter((item) =>
                    item._id !== id &&
                    ((vaccine?.is_dog && item.is_dog) ||
                        (vaccine?.is_cat && item.is_cat) ||
                        (vaccine?.is_package && item.is_package))
                );
                setRelatedVaccines(data.slice(0, 5)); // Limit to 5 related vaccines
            }
        } catch (error) {
            console.error('Error fetching related vaccines:', error);
        }
    }, [id, vaccine]);

    useEffect(() => {
        fetchVaccine();
    }, [fetchVaccine]);

    useEffect(() => {
        if (vaccine) {
            fetchOtherVaccinesExceptsId();
        }
    }, [vaccine, fetchOtherVaccinesExceptsId]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchVaccine();
    }, [fetchVaccine]);

    // Calculate prices and discounts based on selected location type
    const getPriceInfo = useCallback(() => {
        if (!vaccine) return { price: 0, discountPrice: 0, percentOff: 0 };

        if (selectedLocationType === 'Home' && vaccine.home_price_of_package && vaccine.home_price_of_package_discount) {
            const price = vaccine.home_price_of_package;
            const discountPrice = vaccine.home_price_of_package_discount;
            const percentOff = price > discountPrice
                ? Math.round((price - discountPrice) / price * 100)
                : 0;

            return { price, discountPrice, percentOff };
        } else {
            const price = vaccine.price;
            const discountPrice = vaccine.discount_price;
            const percentOff = price > discountPrice
                ? Math.round((price - discountPrice) / price * 100)
                : vaccine.off_percentage || 0;

            return { price, discountPrice, percentOff };
        }
    }, [vaccine, selectedLocationType]);



    const renderPaginationDots = () => {
        console.log(vaccine?.image.length)
        if (!vaccine?.image || vaccine.image.length <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                {vaccine.image.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            activeSlide === index ? styles.paginationDotActive : styles.paginationDotActive
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderRelatedVaccineCard = (item) => {
        return (
            <TouchableOpacity
                key={item._id}
                style={styles.relatedCard}
                onPress={() => navigation.navigate('VaccineDetail', { id: item._id, type, Typeid: id })}
            >
                <Image
                    source={{ uri: item.mainImage?.url }}
                    style={styles.relatedCardImage}
                    resizeMode="cover"
                />
                <View style={styles.relatedCardContent}>
                    <Text style={styles.relatedCardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.relatedCardPrice}>₹{item.discount_price}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d32f2f" />
                <Text style={styles.loadingText}>Loading vaccine details...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#d32f2f" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchVaccine}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (!vaccine) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Vaccine not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const { price, discountPrice, percentOff } = getPriceInfo();

    return (
        <>
            <TopHeadPart title={vaccine.title} />
            <SafeAreaView style={styles.container}>
                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Image Carousel */}
                    <View style={styles.carouselContainer}>
                        {vaccine.tag && (
                            <View style={styles.tagContainer}>
                                <Text style={styles.tagText}>{vaccine.tag}</Text>
                            </View>
                        )}
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(event) => {
                                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                                setActiveSlide(index);
                            }}
                        >
                            {(vaccine.image || []).map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img.url }}
                                    // style={styles.carouselImage}
                                    style={{ width: screenWidth, height: 200, resizeMode: 'cover' }}
                                />
                            ))}
                        </ScrollView>
                    </View>
                    {renderPaginationDots()}

                    {/* Product Information */}
                    <View style={styles.infoContainer}>
                        <Text style={styles.title}>{vaccine.title}</Text>
                        <Text style={styles.smallDesc}>{vaccine.small_desc}</Text>

                        {/* Price Information */}
                        <View style={styles.priceContainer}>
                            <Text style={styles.discountPrice}>₹{discountPrice}</Text>
                            {price > discountPrice && (
                                <>
                                    <Text style={styles.originalPrice}>₹{price}</Text>
                                    <Text style={styles.offPercentage}>{percentOff}% OFF</Text>
                                </>
                            )}
                        </View>

                        {/* Location Type Selection */}
                        {vaccine.home_price_of_package && (
                            <View style={styles.locationTypeContainer}>
                                <Text style={styles.locationTypeTitle}>Available at:</Text>
                                <View style={styles.locationTypeOptions}>
                                    <TouchableOpacity
                                        style={[
                                            styles.locationTypeOption,
                                            selectedLocationType === 'Clinic' && styles.locationTypeOptionSelected
                                        ]}
                                        onPress={() => setSelectedLocationType('Clinic')}
                                    >
                                        <MaterialIcons name="local-hospital" size={20} color={selectedLocationType === 'Clinic' ? "#fff" : "#666"} />
                                        <Text style={[
                                            styles.locationTypeText,
                                            selectedLocationType === 'Clinic' && styles.locationTypeTextSelected
                                        ]}>Clinic</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.locationTypeOption,
                                            selectedLocationType === 'Home' && styles.locationTypeOptionSelected
                                        ]}
                                        onPress={() => setSelectedLocationType('Home')}
                                    >
                                        <FontAwesome name="home" size={20} color={selectedLocationType === 'Home' ? "#fff" : "#666"} />
                                        <Text style={[
                                            styles.locationTypeText,
                                            selectedLocationType === 'Home' && styles.locationTypeTextSelected
                                        ]}>Home</Text>
                                    </TouchableOpacity>
                                </View>
                                {selectedLocationType === 'Home' ? (
                                    <Text style={styles.locationNoteText}>
                                        Our vets will visit your home for vaccination
                                    </Text>
                                ) : (
                                    <Text style={styles.locationNoteText}>
                                        Visit our clinic for vaccination at a discounted price
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* What's Included Section */}
                        {vaccine.VaccinedInclueds && vaccine.VaccinedInclueds.length > 0 && (
                            <View style={styles.includedSection}>
                                <Text style={styles.sectionTitle}>What's Included</Text>
                                {vaccine.VaccinedInclueds.map((item, index) => (
                                    item.trim() ? (
                                        <View key={index} style={styles.includedItem}>
                                            <AntDesign name="check" size={16} color="#388e3c" style={styles.checkIcon} />
                                            <Text style={styles.includedText}>{item}</Text>
                                        </View>
                                    ) : null
                                ))}
                            </View>
                        )}

                        {/* Description */}
                        <View style={styles.descriptionSection}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.descriptionText}>{vaccine.desc}</Text>
                        </View>

                        {/* For Age Information */}
                        {vaccine.forage && (
                            <View style={styles.forAgeSection}>
                                <Text style={styles.sectionTitle}>Recommended Age</Text>
                                <Text style={styles.forAgeText}>{vaccine.forage}</Text>
                            </View>
                        )}

                        {/* Pet Type */}
                        <View style={styles.petTypeSection}>
                            <Text style={styles.sectionTitle}>Suitable For</Text>
                            <View style={styles.petTypeContainer}>
                                {vaccine.is_dog && (
                                    <View style={styles.petTypeTag}>
                                        <FontAwesome name="paw" size={14} color="#d32f2f" />
                                        <Text style={styles.petTypeText}>Dogs</Text>
                                    </View>
                                )}
                                {vaccine.is_cat && (
                                    <View style={styles.petTypeTag}>
                                        <FontAwesome name="paw" size={14} color="#d32f2f" />
                                        <Text style={styles.petTypeText}>Cats</Text>
                                    </View>
                                )}
                                {vaccine.is_package && (
                                    <View style={styles.petTypeTag}>
                                        <MaterialIcons name="medical-services" size={14} color="#d32f2f" />
                                        <Text style={styles.petTypeText}>Package</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Related Vaccines */}
                    {relatedVaccines.length > 0 && (
                        <View style={styles.relatedSection}>
                            <Text style={styles.relatedTitle}>Similar Vaccines</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.relatedScrollContent}
                            >
                                {relatedVaccines.map(renderRelatedVaccineCard)}
                            </ScrollView>
                        </View>
                    )}
                </ScrollView>

                {/* Bottom Action Bar */}
                <View style={styles.actionBar}>


                    <TouchableOpacity
                        style={styles.bookNowButton}
                        onPress={() =>
                            navigation.navigate('book-now-vaccine', {
                                id: vaccine?._id,
                                title: vaccine.title,
                                selectedLocationType: selectedLocationType
                            })
                        }
                    >
                        <Text style={styles.bookNowText}>Book Now at {selectedLocationType}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView >
        </>
    );
}