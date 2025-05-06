import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Animated,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { API_END_POINT_URL, API_END_POINT_URL_LOCAL } from '../../constant/constant';
import axios from 'axios';
import TopHeadPart from '../../layouts/TopHeadPart';
import Call_Header from '../../components/Call_header/Call_Header';
import WebView from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// Color palette
const COLORS = {
    primary: '#cc0000',
    secondary: '#ff4d4d',
    tertiary: '#ff8080',
    background: '#f8f8f8',
    white: '#ffffff',
    text: '#333333',
    lightText: '#666666',
    border: '#eeeeee',
    shadow: '#000000',
};

const ImageSlider = ({ images }) => {
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef(null);
    const flattenedImages = useMemo(() => {
        if (!images || images.length === 0) return [];
        return images || [];
    }, [images]);

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    useEffect(() => {
        if (flattenedImages.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % flattenedImages.length;
            setCurrentIndex(nextIndex);
            scrollViewRef.current?.scrollTo({
                x: nextIndex * width,
                animated: true,
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [currentIndex, flattenedImages.length]);

    if (!flattenedImages.length) return null;

    return (
        <View style={styles.sliderContainer}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
            >
                {flattenedImages.map((item, index) => (
                    <Image
                        key={index}
                        source={{ uri: item?.url }}
                        style={styles.sliderImage}
                        resizeMode="stretch"
                    />
                ))}
            </ScrollView>

            {flattenedImages.length > 1 && (
                <View style={styles.pagination}>
                    {flattenedImages.map((_, index) => {
                        const inputRange = [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ];

                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [8, 16, 8],
                            extrapolate: 'clamp',
                        });

                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[styles.dot, { width: dotWidth, opacity }]}
                            />
                        );
                    })}
                </View>
            )}
            <LinearGradient
                colors={['rgba(0,0,0,0.2)', 'transparent']}
                style={styles.sliderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
        </View>
    );
};

const ConsultationCard = ({ item, navigation, expandedItems, toggleExpand }) => {
    const isExpanded = expandedItems[item._id] || false;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => navigation.navigate('next-step', {
                type: item.name,
                id: item?._id
            })}
        >
            <View style={styles.cardContent}>
                <Image
                    source={{ uri: item.imageUrl?.url || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2940&auto=format&fit=crop' }}
                    style={styles.cardImage}
                    resizeMode='contain'
                />

                <View style={styles.textContent}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text
                        style={styles.cardDescription}
                        numberOfLines={isExpanded ? undefined : 1}
                    >
                        {item.description}
                    </Text>

                    {item.description && item.description.length > 100 && (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                toggleExpand(item._id);
                            }}
                            style={styles.readMoreContainer}
                        >
                            <Text style={styles.readMore}>
                                {isExpanded ? 'Read Less ▲' : 'Read More ▼'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.priceSection}>
                        <View>
                            <Text style={styles.priceLabel}>Starting from</Text>
                            <View style={styles.priceContainer}>
                                {item.discount > 0 && (
                                    <Text style={styles.originalPrice}>₹{item.price}</Text>
                                )}
                                <Text style={styles.price}>
                                    ₹{item.discount_price || item.price}
                                </Text>
                            </View>
                            {item.isAnyOffer && item.offer_valid_upto_text && (
                                <Text style={styles.offer}>{item.offer_valid_upto_text}</Text>
                            )}
                        </View>


                    </View>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => navigation.navigate('next-step', {
                            type: item.name,
                            id: item?._id
                        })}
                    >
                        <LinearGradient
                            colors={['#ff4d4d', '#b03131']}
                            style={styles.gradientButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.buttonText}>Book Now</Text>
                            <Ionicons name="arrow-forward" size={moderateScale(18)} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            {item.discount > 0 && (
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discount}% OFF</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function Consultation() {
    const navigation = useNavigation();
    const [consultation, setConsultation] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [sliders, setSliders] = useState([]);
    const [expandedItems, setExpandedItems] = useState({});

    const toggleExpand = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const sortedConsultation = useMemo(() => {
        return [...consultation].sort((a, b) => Number(a.position) - Number(b.position));
    }, [consultation]);

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/service-banner/consultation`);

            if (response?.data?.success) {
                const banner = response?.data?.data?.imageUrl
                    .filter((item) => item.isActive)
                    .sort((a, b) => Number(a.position) - Number(b.position));

                setSliders(banner);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load banners');
            console.error('Error fetching banners:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchConsultation = useCallback(async () => {
        try {
            setError(null);
            const { data } = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/consultation-types`);
            if (data.success && Array.isArray(data.data)) {
                setConsultation(data.data);
            } else {
                throw new Error("Invalid data format");
            }
        } catch (error) {
            setError('Failed to load consultation data');
            console.error('Error fetching consultation:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([fetchBanners(), fetchConsultation()]).finally(() => {
            setRefreshing(false);
        });
    }, [fetchBanners, fetchConsultation]);

    useEffect(() => {
        fetchBanners();
        fetchConsultation();
    }, []);

    const renderContent = useMemo(() => {
        if (loading && !refreshing) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            );
        }

        if (error && !refreshing) {
            return (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle" size={moderateScale(50)} color={COLORS.primary} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary, COLORS.secondary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                <ImageSlider images={sliders} />
                <Call_Header />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Available Consultations</Text>
                    <View style={styles.divider} />
                </View>

                <View style={styles.consultationsContainer}>
                    {sortedConsultation.map(item => (
                        <ConsultationCard
                            key={item._id}
                            item={item}
                            expandedItems={expandedItems}
                            toggleExpand={toggleExpand}
                            navigation={navigation}
                        />
                    ))}
                </View>

                <WebView
                    source={{ uri: "https://e646aa95356d411688ca904e76e00491.elf.site" }}
                    style={styles.webView}
                />
            </ScrollView>
        );
    }, [loading, refreshing, error, sliders, sortedConsultation, expandedItems, handleRefresh, navigation]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
            <TopHeadPart title={'Online Consultation'} />
            {renderContent}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: verticalScale(20),
    },
    sectionHeader: {
        paddingHorizontal: scale(15),
        marginTop: verticalScale(15),
        marginBottom: verticalScale(5),
    },
    sectionTitle: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: verticalScale(5),
    },
    divider: {
        height: verticalScale(3),
        width: scale(50),
        backgroundColor: COLORS.primary,
        borderRadius: moderateScale(2),
    },
    // Slider styles
    sliderContainer: {
        height: verticalScale(140),
        width: width,
        position: 'relative',
    },
    sliderImage: {
        width: width,
        height: verticalScale(140),
    },
    sliderGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: verticalScale(40),
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: verticalScale(15),
        alignSelf: 'center',
    },
    dot: {
        height: verticalScale(8),
        borderRadius: moderateScale(4),
        backgroundColor: COLORS.white,
        marginHorizontal: scale(4),
    },
    // Card styles
    consultationsContainer: {
        padding: scale(10),
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(15),
        marginBottom: verticalScale(15),
        shadowColor: '#f58484',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
        position: 'relative',
    },
    cardContent: {
        flexDirection: 'row',
        overflow: 'hidden',
        justifyContent: 'flex-start',
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(15),
        borderRadius: moderateScale(15),
    },
    cardImage: {
        width: scale(120),
        height: scale(150),
        borderWidth: 0.3,
        borderColor: '#f58484',
        borderRadius: moderateScale(15),
        marginRight: scale(10),
    },
    textContent: {
        flex: 1,
        paddingVertical: scale(5),
    },
    cardTitle: {
        fontSize: moderateScale(16),
        fontWeight: '700',
        color: '#333',
        marginBottom: verticalScale(8),
    },
    cardDescription: {
        fontSize: moderateScale(12),
        color: '#666',
        lineHeight: moderateScale(18),
        marginBottom: verticalScale(10),
    },
    readMoreContainer: {
        marginTop: verticalScale(-10),
        marginBottom: verticalScale(8),
    },
    readMore: {
        color: COLORS.primary,
        fontSize: moderateScale(12),
        fontWeight: '600',
    },
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: verticalScale(2),
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(5),
    },
    priceLabel: {
        fontSize: moderateScale(12),
        color: '#666',
    },
    originalPrice: {
        fontSize: moderateScale(14),
        color: '#666',
        textDecorationLine: 'line-through',
    },
    price: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        color: '#333',
    },
    offer: {
        fontSize: moderateScale(12),
        color: '#cc0000',
        marginTop: verticalScale(2),
    },
    bookButton: {
        marginVertical: 12,
        overflow: 'hidden',
        borderRadius: moderateScale(25),
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: scale(15),
        paddingVertical: verticalScale(8),
        borderRadius: moderateScale(25),
        gap: scale(5),
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: moderateScale(14),
    },
    // Discount badge
    discountBadge: {
        position: 'absolute',
        top: verticalScale(0),
        right: scale(0),
        backgroundColor: COLORS.primary,
        paddingHorizontal: scale(8),
        paddingVertical: verticalScale(4),
        borderRadius: moderateScale(12),
    },
    discountText: {
        color: COLORS.white,
        fontSize: moderateScale(10),
        fontWeight: '700',
    },
    // Loading and error styles
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: scale(20),
    },
    errorText: {
        fontSize: moderateScale(16),
        color: COLORS.lightText,
        textAlign: 'center',
        marginVertical: verticalScale(16),
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(10),
        borderRadius: moderateScale(25),
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    webView: {
        width: '100%',
        height: verticalScale(500),
        marginTop: verticalScale(20),
    },
});