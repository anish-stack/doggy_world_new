import { View, Text, Linking, RefreshControl, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import TopHeadPart from '../../layouts/TopHeadPart'
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';

const PHONE_NUMBER = 'tel:7217619794';
const SECTIONS = ['Package', 'Cat', 'Dog']; // Categories for our sections

export default function VaccinesShows() {
    const route = useRoute()
    const { type, id } = route.params || {}
    const [vaccines, setVaccines] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');

    const handleCallPress = useCallback(() => {
        Linking.openURL(PHONE_NUMBER);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchVaccines();
    }, []);

    const fetchVaccines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/vaccine-products`);
            if (response.data && response.data.success) {
                const data = response.data.data.filter((item) =>
                    item.WhichTypeOfvaccinations.some(
                        (it) => it.title === type || it?._id === id
                    )
                );
                setVaccines(data);
            } else {
                setError('Failed to fetch vaccines');
            }
        } catch (error) {
            setError('Error connecting to server');
            console.error('Error fetching vaccines:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchVaccines();
    }, [fetchVaccines]);

    // Group vaccines by category for section layout
    const categorizedVaccines = useMemo(() => {
        if (!vaccines.length) return {};

        // Filter by search text first if there's any search
        let filteredResults = [...vaccines];
        if (searchText) {
            filteredResults = filteredResults.filter(vaccine =>
                vaccine.title.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // First identify all packages
        const packageItems = filteredResults.filter(v => v.is_package).sort((a, b) => a.position - b.position);

        // Get IDs of all packages to exclude them from other categories
        const packageIds = new Set(packageItems.map(item => item._id));

        // Filter out packages from cat and dog items
        const catItems = filteredResults
            .filter(v => v.is_cat && !packageIds.has(v._id))
            .sort((a, b) => a.position - b.position);

        const dogItems = filteredResults
            .filter(v => v.is_dog && !packageIds.has(v._id))
            .sort((a, b) => a.position - b.position);

        // Create categories object
        const result = {
            Package: packageItems,
            Cat: catItems,
            Dog: dogItems
        };

        return result;
    }, [vaccines, searchText]);

    const renderVaccineCard = (item) => {
        // Check if this is a Home vaccination type
        const isHomeVaccination = type === 'Home vaccination' ? true : false


        // Determine which prices to display based on vaccination type
        let displayPrice, displayDiscountPrice;

        if (isHomeVaccination && item.home_price_of_package && item.home_price_of_package_discount) {
            displayPrice = item.home_price_of_package;
            displayDiscountPrice = item.home_price_of_package_discount;
        } else {
            displayPrice = item.price;
            displayDiscountPrice = item.discount_price;
        }

        // Calculate percentage off
        const percentOff = displayDiscountPrice < displayPrice
            ? Math.round((displayPrice - displayDiscountPrice) / displayPrice * 100)
            : 0;

        return (
            <TouchableOpacity
                key={item._id}
                style={styles.card}
                onPress={() => navigation.navigate('VaccineDetail', { id: item._id, type, Typeid: id })}
            >

                <Image
                    source={{ uri: item.mainImage?.url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.small_desc}
                    </Text>

                    <View style={styles.priceContainer}>
                        {displayDiscountPrice < displayPrice ? (
                            <>
                                <Text style={styles.discountPrice}>₹{displayDiscountPrice}</Text>
                                <Text style={styles.originalPrice}>₹{displayPrice}</Text>
                                <Text style={styles.offPercentage}>
                                    {percentOff}% OFF
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.price}>₹{displayPrice}</Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start', gap: 5, padding: 5 }}>
                        {item.tag && (
                            <View style={{ backgroundColor: '#f0f0f0', padding: 5, borderRadius: 2 }}>
                                <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 12 }}>{item.tag}</Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => navigation.navigate('VaccineDetail', { id: item._id, type, Typeid: id })} activeOpacity={0.9} style={{ backgroundColor: '#4CAF50', paddingVertical: 5, paddingHorizontal: 14, borderRadius: 5 }}>
                            <Text style={{ color: 'white', textAlign: 'center', fontSize: 12 }}>Book Vaccinations</Text>
                        </TouchableOpacity>
                    </View>




                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = (title, hasItems) => {
        return (
            <View style={[styles.sectionHeader, !hasItems && styles.emptySection]}>
                <Text style={styles.sectionTitle}>
                    {title === 'Package' ? 'Dog And Cat Packages' : `${title} Vaccines`}
                </Text>

            </View>
        );
    };

    return (
        <>
            <TopHeadPart title={type || "Pet Vaccines"} fnc={handleCallPress} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search vaccines..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor="#888"
                    />
                </View>

                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {loading && !refreshing ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#d32f2f" />
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchVaccines}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {SECTIONS.map(section => {
                                const sectionItems = categorizedVaccines[section] || [];
                                return (
                                    <View key={section} style={styles.section}>
                                        {renderSectionHeader(section, sectionItems.length > 0)}
                                        {sectionItems.length > 0 ? (
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.horizontalScrollContent}
                                            >
                                                {sectionItems.slice(0, 5).map(renderVaccineCard)}
                                            </ScrollView>
                                        ) : (
                                            <View style={styles.emptyContainer}>
                                                <Text style={styles.emptyText}>No {section.toLowerCase()} vaccines found</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </>
    )
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
    },
    searchInput: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        color: '#333',
    },
    scrollContent: {
        padding: 0,
        paddingBottom: 20,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
    },
    emptySection: {
        borderBottomWidth: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    viewAllButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
    },
    viewAllText: {
        color: '#d32f2f',
        fontSize: 14,
        fontWeight: '600',
    },
    horizontalScrollContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 300,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 300,
    },
    errorText: {
        color: '#d32f2f',
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        margin: 16,
        minHeight: 150,
        borderWidth: 1,
        borderColor: '#eee',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    },
    card: {
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: 140,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardContent: {
        padding: 12,
    },
    tagContainer: {
        width: 50,
        backgroundColor: 'rgba(211, 47, 47, 0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        zIndex: 10,
    },
    tagText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
        lineHeight: 18,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: '700',
        color: '#d32f2f',
    },
    discountPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#d32f2f',
    },
    originalPrice: {
        fontSize: 13,
        color: '#888',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    offPercentage: {
        fontSize: 11,
        color: '#388e3c',
        marginLeft: 6,
        fontWeight: '600',
    },
    vaccinationTypes: {
        flexDirection: 'column',
        marginTop: 4,
    },
    vaccinationType: {
        backgroundColor: '#f3f3f3',
        borderRadius: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginTop: 4,
        borderLeftWidth: 2,
        borderLeftColor: '#d32f2f',
    },
    vaccinationTypeText: {
        fontSize: 12,
        color: '#555',
    },
});