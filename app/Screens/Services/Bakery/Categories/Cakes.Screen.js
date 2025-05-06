import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,

    ActivityIndicator,
    Platform,
    useWindowDimensions
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchCakeDesign, fetchFlavours, fetchQunatity } from './utils';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CakesScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    // State management
    const [selectedFlavourId, setSelectedFlavourId] = useState(null);
    const [selectedQuantityId, setSelectedQuantityId] = useState(null);
    const [selectedDesignId, setSelectedDesignId] = useState(null);
    const [flavours, setFlavours] = useState([]);
    const [designs, setDesigns] = useState([]);
    const [quantities, setQuantities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const cardWidth = useMemo(() => {
        const padding = 20;
        const gap = 10;
        const cardsPerRow = width > 768 ? 4 : 3;
        return (width - (padding * 2) - (gap * (cardsPerRow - 1))) / cardsPerRow;
    }, [width]);

    // Fetch data with proper error handling
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [flavourResponse, designResponse, quantityResponse] = await Promise.all([
                fetchFlavours(),
                fetchCakeDesign(),
                fetchQunatity()
            ]);

            if (flavourResponse && designResponse && quantityResponse) {
                setFlavours(flavourResponse);
                setDesigns(designResponse);
                setQuantities(quantityResponse);
            } else {
                throw new Error('Failed to fetch data');
            }
        } catch (error) {
            setError('Unable to load bakery data. Please try again.');
            Alert.alert('Error', 'Failed to load data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFlavourSelect = useCallback((id) => {
        setSelectedFlavourId(prevId => prevId === id ? null : id);
    }, []);

    const handleQuantitySelect = useCallback((id) => {
        setSelectedQuantityId(prevId => prevId === id ? null : id);
    }, []);

    const handleDesignSelect = useCallback((id) => {
        setSelectedDesignId(prevId => prevId === id ? null : id);
    }, []);


    const handleNextStep = useCallback(() => {
        if (!selectedFlavourId || !selectedQuantityId || !selectedDesignId) {
            Alert.alert('Incomplete Selection', 'Please select a flavour, quantity, and design to continue.');
            return;
        }

        navigation.navigate('Cake-Delivery', {
            flavourId: selectedFlavourId,
            quantityId: selectedQuantityId,
            designId: selectedDesignId,
        });
    }, [selectedFlavourId, selectedQuantityId, selectedDesignId, navigation]);

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#B32113" />
                <Text style={styles.loadingText}>Loading delicious cakes...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <MaterialIcons name="error-outline" size={64} color="#B32113" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['#B32113', '#FF6B6B']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Yummy Cakes 🍰</Text>
            </LinearGradient>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Flavours Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <FontAwesome5 name="birthday-cake" size={20} color="#B32113" />
                        <Text style={styles.sectionTitle}>Select Flavour</Text>
                    </View>
                    <View style={styles.grid}>
                        {flavours.map((flavour) => (
                            <TouchableOpacity
                                key={flavour.id}
                                style={[
                                    styles.card,
                                    { width: cardWidth },
                                    selectedFlavourId === flavour.documentId && styles.selectedCard
                                ]}
                                onPress={() => handleFlavourSelect(flavour.documentId)}
                                activeOpacity={0.7}
                            >
                                <Image
                                    source={{ uri: flavour.image?.url }}
                                    style={styles.cardImage}
                                    resizeMode="cover"
                                />
                                {flavour?.any_tag && (
                                    <View style={[styles.tag, { backgroundColor: '#000' }]}>
                                        <Text style={styles.tagText}>{flavour.tag_title}</Text>
                                    </View>
                                )}
                                <Text style={styles.cardTitle}>{flavour.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Quantities Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="scale" size={20} color="#B32113" />
                        <Text style={styles.sectionTitle}>Select Size</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.quantityContainer}
                    >
                        {quantities.map((quantity) => (
                            <TouchableOpacity
                                key={quantity.id}
                                style={[
                                    styles.quantityButton,
                                    selectedQuantityId === quantity.documentId && styles.selectedQuantityButton
                                ]}
                                onPress={() => handleQuantitySelect(quantity.documentId)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.quantityText,
                                    selectedQuantityId === quantity.documentId && styles.selectedQuantityText
                                ]}>
                                    {quantity.label}{quantity.type_of_qunatity}
                                </Text>
                                <Text style={[
                                    styles.priceText,
                                    selectedQuantityId === quantity.documentId && styles.selectedQuantityText
                                ]}>
                                    Rs {quantity.price}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Designs Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="design-services" size={20} color="#B32113" />
                        <Text style={styles.sectionTitle}>Select Design</Text>
                    </View>
                    <View style={styles.designGrid}>
                        {designs.map((design) => (
                            <TouchableOpacity
                                key={design.id}
                                style={[
                                    styles.designCard,
                                    selectedDesignId === design.documentId && styles.selectedDesignCard
                                ]}
                                onPress={() => handleDesignSelect(design.documentId)}
                                activeOpacity={0.7}
                            >
                                <Image
                                    source={{ uri: design.image.url }}
                                    style={styles.designImage}
                                    resizeMode="cover"
                                />
                                <Text style={styles.designName}>{design.name}</Text>
                                <View style={[
                                    styles.checkmark,
                                    selectedDesignId === design.documentId && styles.selectedCheckmark
                                ]}>
                                    {selectedDesignId === design.documentId && (
                                        <MaterialIcons name="check" size={16} color="#FFF" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Next Step Button */}
            <TouchableOpacity
                style={[
                    styles.nextButton,
                    (!selectedFlavourId || !selectedQuantityId || !selectedDesignId) && styles.disabledButton
                ]}
                onPress={handleNextStep}
                disabled={!selectedFlavourId || !selectedQuantityId || !selectedDesignId}
            >
                <Text style={styles.nextButtonText}>Continue to Delivery</Text>
                <MaterialIcons name="arrow-forward" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    scrollContent: {
        padding: 15,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3436',
        marginLeft: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'start',
        gap: 10,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: '#B32113',
    },
    cardImage: {
        width: '100%',
        height: 100,
    },
    tag: {
        position: 'absolute',
        top: 0,
        zIndex: 999,
        right: 0,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tagText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#2D3436',
        textAlign: 'center',
        padding: 10,
    },
    quantityContainer: {
        paddingHorizontal: 5,
    },
    quantityButton: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,

        marginHorizontal: 5,
        alignItems: 'center',
        minWidth: 120,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    selectedQuantityButton: {
        backgroundColor: '#B32113',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3436',
        marginBottom: 5,
    },
    priceText: {
        fontSize: 14,
        color: '#B32113',
        fontWeight: '600',
    },
    selectedQuantityText: {
        color: '#FFF',
    },
    designGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    designCard: {
        width: "45%",
        backgroundColor: '#FFF',
        borderRadius: 15,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    selectedDesignCard: {
        borderWidth: 2,
        borderColor: '#B32113',
    },
    designImage: {
        width: '100%',
        height: 120,
    },
    designName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3436',
        textAlign: 'center',
        padding: 10,
    },
    checkmark: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#B32113',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedCheckmark: {
        backgroundColor: '#B32113',
    },
    nextButton: {
        backgroundColor: '#B32113',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        margin: 15,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    disabledButton: {
        backgroundColor: '#CCCCCC',
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 10,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#B32113',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#B32113',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default CakesScreen;