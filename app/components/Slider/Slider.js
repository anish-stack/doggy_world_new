import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
    ActivityIndicator,
    Text,
} from 'react-native';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const AUTO_SCROLL_INTERVAL = 3000;

const CustomSlider = ({ Refresh }) => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigation = useNavigation()
    const scrollX = useRef(new Animated.Value(0)).current;
    const position = useRef(Animated.divide(scrollX, width)).current;
    const flatListRef = useRef(null);
    const autoScrollTimer = useRef(null);

    useEffect(() => {
        if (Refresh === true) {

            fetchBanners();
        } else {
            fetchBanners();
        }
        return () => {
            if (autoScrollTimer.current) {
                clearInterval(autoScrollTimer.current);
            }
        };
    }, [Refresh]);

    useEffect(() => {
        if (banners.length > 1) {
            startAutoScroll();
        }
        return () => stopAutoScroll();
    }, [banners]);

    const fetchBanners = async () => {
        try {

            setLoading(true);
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/home-banner`);

            if (response?.data?.success) {
                const banner = response.data.data
                    .filter((item) => item.isActive)
                    .sort((a, b) => Number(a.position) - Number(b.position));

                setBanners(banner);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load banners');
            console.error('Error fetching banners:', err);
        } finally {
            setLoading(false);
        }
    };

    const startAutoScroll = () => {
        autoScrollTimer.current = setInterval(() => {
            if (currentIndex < banners.length - 1) {
                setCurrentIndex(currentIndex + 1);
                flatListRef.current?.scrollToIndex({
                    index: currentIndex + 1,
                    animated: true,
                });
            } else {
                setCurrentIndex(0);
                flatListRef.current?.scrollToIndex({
                    index: 0,
                    animated: true,
                });
            }
        }, AUTO_SCROLL_INTERVAL);
    };

    const stopAutoScroll = () => {
        if (autoScrollTimer.current) {
            clearInterval(autoScrollTimer.current);
        }
    };

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: false }
    );

    const handleMomentumScrollEnd = (event) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(newIndex);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchBanners}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Animated.FlatList
                ref={flatListRef}
                data={banners}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                onScrollBeginDrag={stopAutoScroll}
                onScrollEndDrag={startAutoScroll}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate(item.link)}
                    >
                        <Image
                            source={{ uri: item.imageUrl.url }}
                            style={styles.image}
                            resizeMode="stretch"
                        />
                    </TouchableOpacity>
                )}
                keyExtractor={item => item._id}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {banners.map((_, i) => {
                    const opacity = position.interpolate({
                        inputRange: [i - 1, i, i + 1],
                        outputRange: [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                    });

                    const scale = position.interpolate({
                        inputRange: [i - 1, i, i + 1],
                        outputRange: [1, 1.2, 1],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    opacity,
                                    transform: [{ scale }],
                                },
                            ]}
                        />
                    );
                })}
            </View>


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    loadingContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
    errorContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    image: {
        width: width,
        height: 150,
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ffffff',
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    counter: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    counterText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default CustomSlider;