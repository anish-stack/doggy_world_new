
import { useState, useCallback, useEffect, useRef } from "react"
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    Dimensions,
    Animated,
    Platform,
    StatusBar,
    FlatList,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import axios from "axios"
import { API_END_POINT_URL_LOCAL } from "../../constant/constant"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"
import {
    ArrowLeft,
    Heart,
    Share2,
    ShoppingCart,
    Clock,
    Home,
    Building2,
    AlertTriangle,
    Check,
    ChevronRight,
    Microscope,
    Zap,
    Dog,
    Cat,
    Package,
    AlertCircle,
} from "lucide-react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

export default function LabTestDetails() {
    const route = useRoute()
    const { type, id, Typeid } = route.params || {}
    const [labTest, setLabTest] = useState(null)
    const [relatedTests, setRelatedTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false)
    const [activeSlide, setActiveSlide] = useState(0)
    const [selectedLocationType, setSelectedLocationType] = useState(
        type === "Lab Tests at Your Doorstep" ? "Home" : "Clinic",
    )
    const [isFavorite, setIsFavorite] = useState(false)
    const [showFullDescription, setShowFullDescription] = useState(false)

    // Animations
    const scrollY = useRef(new Animated.Value(0)).current
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 1],
        extrapolate: "clamp",
    })

    const imageScale = scrollY.interpolate({
        inputRange: [-100, 0, 100],
        outputRange: [1.2, 1, 0.8],
        extrapolate: "clamp",
    })

    const discountAnimation = useRef(new Animated.Value(1)).current

    useEffect(() => {
        // Pulse animation for discount badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(discountAnimation, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(discountAnimation, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        ).start()
    }, [])

    const fetchLabTest = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/LabTest-product/${id}`)
            if (response.data && response.data.success) {
                setLabTest(response.data.data)
            } else {
                setError("Failed to fetch lab test details")
            }
        } catch (error) {
            setError("Error connecting to server")
            console.error("Error fetching lab test:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [id])

    const fetchRelatedTests = useCallback(async () => {
        try {
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/LabTest-products`)
            if (response.data && response.data.success) {
                const data = response.data.data.filter((item) => {
                    if (item._id === id) return false

                    const sameDog = labTest?.is_dog && item.is_dog
                    const sameCat = labTest?.is_cat && item.is_cat
                    const sameCommonCat = labTest?.is_common_for_cat && item.is_common_for_cat
                    const sameCommonDog = labTest?.is_common_for_dog && item.is_common_for_dog
                    const imagingMismatch = !labTest?.is_imaging_test && item.is_imaging_test

                    return sameDog || sameCat || sameCommonCat || sameCommonDog || imagingMismatch
                })

                setRelatedTests(data.slice(0, 5))
            }
        } catch (error) {
            console.error("Error fetching related tests:", error)
        }
    }, [id, labTest])

    useEffect(() => {
        fetchLabTest()
    }, [fetchLabTest])

    useEffect(() => {
        if (labTest) {
            fetchRelatedTests()
        }
    }, [labTest, fetchRelatedTests])

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchLabTest()
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }, [fetchLabTest])

    // Calculate prices and discounts based on selected location type
    const getPriceInfo = useCallback(() => {
        if (!labTest) return { price: 0, discountPrice: 0, percentOff: 0 }

        if (selectedLocationType === "Home" && labTest.home_price_of_package && labTest.home_price_of_package_discount) {
            const price = labTest.home_price_of_package
            const discountPrice = labTest.home_price_of_package_discount
            const percentOff = price > discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0

            return { price, discountPrice, percentOff }
        } else {
            const price = labTest.price
            const discountPrice = labTest.discount_price
            const percentOff =
                price > discountPrice ? Math.round(((price - discountPrice) / price) * 100) : labTest.off_percentage || 0

            return { price, discountPrice, percentOff }
        }
    }, [labTest, selectedLocationType])

    const toggleFavorite = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        setIsFavorite(!isFavorite)
    }

    const shareTest = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        // Share functionality would go here
    }

    const handleLocationTypeChange = (locationType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setSelectedLocationType(locationType)
    }

    const renderImageCarousel = () => {
        if (!labTest?.image || labTest.image.length === 0) {
            return (
                <View style={styles.carouselContainer}>
                    <Image
                        source={{ uri: labTest?.mainImage?.url || "/placeholder.svg?height=300&width=400" }}
                        style={styles.carouselImage}
                        resizeMode="cover"
                    />
                </View>
            )
        }

        return (
            <View style={styles.carouselContainer}>
                <Animated.View style={{ transform: [{ scale: imageScale }] }}>
                    <FlatList
                        data={labTest.image}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
                            setActiveSlide(index)
                        }}
                        renderItem={({ item }) => (
                            <Image source={{ uri: item.url }} style={styles.carouselImage} resizeMode="cover" />
                        )}
                        keyExtractor={(_, index) => index.toString()}
                    />
                </Animated.View>

                {/* Pagination Dots */}
                {labTest.image.length > 1 && (
                    <View style={styles.paginationContainer}>
                        {labTest.image.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    activeSlide === index ? styles.paginationDotActive : styles.paginationDotInactive,
                                ]}
                            />
                        ))}
                    </View>
                )}

                {/* Tags and Badges */}
                {labTest.tag && (
                    <View style={styles.tagContainer}>
                        <Text style={styles.tagText}>{labTest.tag}</Text>
                    </View>
                )}

                {labTest.is_imaging_test && (
                    <View style={styles.clinicOnlyBadge}>
                        <Building2 size={14} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.clinicOnlyText}>Clinic Only</Text>
                    </View>
                )}
            </View>
        )
    }

    const renderRelatedTestCard = (item) => {
        return (
            <TouchableOpacity
                key={item._id}
                style={styles.relatedCard}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    navigation.navigate("LabDetailsDetail", { id: item._id, type, Typeid })
                }}
                activeOpacity={0.7}
            >
                <Image source={{ uri: item.mainImage?.url }} style={styles.relatedCardImage} resizeMode="fill" />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.relatedCardGradient}>
                    <Text style={styles.relatedCardTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.relatedCardPrice}>₹{item.discount_price}</Text>
                </LinearGradient>
            </TouchableOpacity>
        )
    }

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#FF9500" />
                <Text style={styles.loadingText}>Loading lab test details...</Text>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" />
                <AlertCircle size={48} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        fetchLabTest()
                    }}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    if (!labTest) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" />
                <Text style={styles.errorText}>Lab test not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        navigation.goBack()
                    }}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        )
    }

    const { price, discountPrice, percentOff } = getPriceInfo()
    const hasDiscount = price > discountPrice

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <StatusBar barStyle="dark-content" />



            <TouchableOpacity
                style={styles.backButtonAbsolute}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    navigation.goBack()
                }}
            >
                <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>

            {/* Main Content */}
            <Animated.ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FF9500"
                        colors={["#FF9500", "#5856D6", "#FF2D55"]}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
            >
                {/* Image Carousel */}
                {renderImageCarousel()}

                {/* Main Info Container */}
                <View style={styles.infoContainer}>
                    {/* Title and Favorite */}
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{labTest.title}</Text>
                        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
                            <Heart size={24} color={isFavorite ? "#FF2D55" : "#666"} fill={isFavorite ? "#FF2D55" : "transparent"} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.smallDesc}>{labTest.small_desc}</Text>

                    {/* Common Disease Alert */}
                    {labTest.is_common_for_dog && (
                        <View style={styles.alertContainer}>
                            <AlertTriangle size={18} color="#FF9500" style={{ marginRight: 8 }} />
                            <Text style={styles.alertText}>
                                This test is for a common disease in dogs. Early detection is recommended.
                            </Text>
                        </View>
                    )}

                    {labTest.is_common_for_cat && (
                        <View style={styles.alertContainer}>
                            <AlertTriangle size={18} color="#FF9500" style={{ marginRight: 8 }} />
                            <Text style={styles.alertText}>
                                This test is for a common disease in cats. Early detection is recommended.
                            </Text>
                        </View>
                    )}

                    {/* Price Information */}
                    <View style={styles.priceSection}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.discountPrice}>₹{discountPrice}</Text>
                            {hasDiscount && (
                                <>
                                    <Text style={styles.originalPrice}>₹{price}</Text>
                                    <Animated.View style={[styles.offPercentageContainer, { transform: [{ scale: discountAnimation }] }]}>
                                        <Text style={styles.offPercentage}>{percentOff}% OFF</Text>
                                    </Animated.View>
                                </>
                            )}
                        </View>

                        {/* Hurry Up Message for Discounts */}
                        {hasDiscount && percentOff > 10 && (
                            <View style={styles.hurryUpContainer}>
                                <Clock size={16} color="#FF3B30" style={{ marginRight: 6 }} />
                                <Text style={styles.hurryUpText}>Hurry! Limited time offer. Book now to avail this discount.</Text>
                            </View>
                        )}
                    </View>

                    {/* Location Type Selection */}
                    {!labTest.is_imaging_test && labTest.home_price_of_package && (
                        <View style={styles.locationTypeContainer}>
                            <Text style={styles.locationTypeTitle}>Choose Service Location:</Text>
                            <View style={styles.locationTypeOptions}>
                                <TouchableOpacity
                                    style={[
                                        styles.locationTypeOption,
                                        selectedLocationType === "Clinic" && styles.locationTypeOptionSelected,
                                    ]}
                                    onPress={() => handleLocationTypeChange("Clinic")}
                                >
                                    <Building2
                                        size={20}
                                        color={selectedLocationType === "Clinic" ? "#fff" : "#666"}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text
                                        style={[
                                            styles.locationTypeText,
                                            selectedLocationType === "Clinic" && styles.locationTypeTextSelected,
                                        ]}
                                    >
                                        Clinic Visit
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.locationTypeOption,
                                        selectedLocationType === "Home" && styles.locationTypeOptionSelected,
                                    ]}
                                    onPress={() => handleLocationTypeChange("Home")}
                                >
                                    <Home
                                        size={20}
                                        color={selectedLocationType === "Home" ? "#fff" : "#666"}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text
                                        style={[
                                            styles.locationTypeText,
                                            selectedLocationType === "Home" && styles.locationTypeTextSelected,
                                        ]}
                                    >
                                        Home Visit
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {selectedLocationType === "Home" ? (
                                <View style={styles.locationNoteContainer}>
                                    <Check size={16} color="#34C759" style={{ marginRight: 6 }} />
                                    <Text style={styles.locationNoteText}>Our Lab technicians will visit your home to collect samples</Text>
                                </View>
                            ) : (
                                <View style={styles.locationNoteContainer}>
                                    <Check size={16} color="#34C759" style={{ marginRight: 6 }} />
                                    <Text style={styles.locationNoteText}>Visit our clinic for testing at a discounted price</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Imaging Test Clinic Only Notice */}
                    {labTest.is_imaging_test && (
                        <View style={styles.imagingTestNotice}>
                            <Microscope size={20} color="#5856D6" style={{ marginRight: 8 }} />
                            <Text style={styles.imagingTestNoticeText}>
                                This imaging test is only available at our clinic facilities
                            </Text>
                        </View>
                    )}

                    {/* Description */}
                    <View style={styles.descriptionSection}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText} numberOfLines={showFullDescription ? undefined : 4}>
                            {labTest.desc}
                        </Text>
                        {labTest.desc && labTest.desc.length > 150 && (
                            <TouchableOpacity
                                style={styles.readMoreButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    setShowFullDescription(!showFullDescription)
                                }}
                            >
                                <Text style={styles.readMoreText}>{showFullDescription ? "Show Less" : "Read More"}</Text>
                                <ChevronRight
                                    size={16}
                                    color="#5856D6"
                                    style={{
                                        marginLeft: 4,
                                        transform: [{ rotate: showFullDescription ? "90deg" : "0deg" }],
                                    }}
                                />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* For Age Information */}
                    {labTest.forage && (
                        <View style={styles.forAgeSection}>
                            <Text style={styles.sectionTitle}>Recommended Age</Text>
                            <View style={styles.ageInfoContainer}>
                                <Clock size={18} color="#5856D6" style={{ marginRight: 8 }} />
                                <Text style={styles.forAgeText}>{labTest.forage}</Text>
                            </View>
                        </View>
                    )}

                    {/* Pet Type */}
                    <View style={styles.petTypeSection}>
                        <Text style={styles.sectionTitle}>Suitable For</Text>
                        <View style={styles.petTypeContainer}>
                            {labTest.is_dog && (
                                <View style={styles.petTypeTag}>
                                    <Dog size={16} color="#5856D6" style={{ marginRight: 6 }} />
                                    <Text style={styles.petTypeText}>Dogs</Text>
                                </View>
                            )}
                            {labTest.is_cat && (
                                <View style={styles.petTypeTag}>
                                    <Cat size={16} color="#FF9500" style={{ marginRight: 6 }} />
                                    <Text style={styles.petTypeText}>Cats</Text>
                                </View>
                            )}
                            {labTest.is_package && (
                                <View style={styles.petTypeTag}>
                                    <Package size={16} color="#FF2D55" style={{ marginRight: 6 }} />
                                    <Text style={styles.petTypeText}>Package</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Related Tests */}
                {relatedTests.length > 0 && (
                    <View style={styles.relatedSection}>
                        <Text style={styles.relatedTitle}>Similar Lab Tests</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.relatedScrollContent}
                        >
                            {relatedTests.map(renderRelatedTestCard)}
                        </ScrollView>
                    </View>
                )}

                {/* Bottom Spacing for Action Bar */}
                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        navigation.navigate("add-tot-cart", {
                            id: labTest?._id,
                            title: labTest.title,
                            selectedLocationType: selectedLocationType,
                        })
                    }}
                >
                    <ShoppingCart size={20} color="#5856D6" style={{ marginRight: 8 }} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.bookNowButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                        navigation.navigate("book-now-labtest", {
                            id: labTest?._id,
                            title: labTest.title,
                            isImageing: labTest?.is_imaging_test,
                            selectedLocationType: selectedLocationType,
                        })
                    }}
                >
                    <Zap size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.bookNowText}>
                        Book Now {labTest.is_imaging_test ? "at Clinic" : `at ${selectedLocationType}`}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    floatingHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    blurView: {
        width: "100%",
        height: Platform.OS === "ios" ? 90 : 60,
        overflow: "hidden",
    },
    floatingHeaderContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 40 : 16,
        paddingBottom: 16,
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    floatingHeaderTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        marginHorizontal: 16,
        textAlign: "center",
    },
    headerRightButtons: {
        flexDirection: "row",
    },
    headerIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
        marginLeft: 8,
    },
    backButtonAbsolute: {
        position: "absolute",
        top: Platform.OS === "ios" ? 50 : 20,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.3)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    carouselContainer: {
        width: screenWidth,
        height: 350,
        position: "relative",
    },
    carouselImage: {
        width: screenWidth,
        height: 350,
    },
    paginationContainer: {
        position: "absolute",
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: "#fff",
    },
    paginationDotInactive: {
        backgroundColor: "rgba(255,255,255,0.5)",
    },
    tagContainer: {
        position: "absolute",
        top: 16,
        left: 16,
        backgroundColor: "#FF9500",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tagText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
    clinicOnlyBadge: {
        position: "absolute",
        top: 16,
        right: 16,
        backgroundColor: "#5856D6",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    clinicOnlyText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12,
    },
    infoContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    title: {
        flex: 1,
        fontSize: 24,
        fontWeight: "800",
        color: "#333",
        marginRight: 16,
    },
    favoriteButton: {
        padding: 8,
    },
    smallDesc: {
        fontSize: 16,
        color: "#666",
        marginBottom: 16,
        lineHeight: 22,
    },
    alertContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF8E1",
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FFE0B2",
    },
    alertText: {
        flex: 1,
        fontSize: 14,
        color: "#FF9500",
        fontWeight: "500",
    },
    priceSection: {
        marginBottom: 20,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 8,
    },
    discountPrice: {
        fontSize: 28,
        fontWeight: "800",
        color: "#5856D6",
    },
    originalPrice: {
        fontSize: 18,
        color: "#888",
        textDecorationLine: "line-through",
        marginLeft: 12,
        marginRight: 8,
    },
    offPercentageContainer: {
        backgroundColor: "#34C759",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    offPercentage: {
        fontSize: 12,
        fontWeight: "700",
        color: "#fff",
    },
    hurryUpContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFEBEB",
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
    },
    hurryUpText: {
        flex: 1,
        fontSize: 13,
        color: "#FF3B30",
        fontWeight: "500",
    },
    locationTypeContainer: {
        backgroundColor: "#F5F5F7",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    locationTypeTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        marginBottom: 12,
    },
    locationTypeOptions: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    locationTypeOption: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 6,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    locationTypeOptionSelected: {
        backgroundColor: "#5856D6",
        borderColor: "#5856D6",
    },
    locationTypeText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    locationTypeTextSelected: {
        color: "#fff",
    },
    locationNoteContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    locationNoteText: {
        flex: 1,
        fontSize: 13,
        color: "#666",
    },
    imagingTestNotice: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EEF1FF",
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#D1D5F9",
    },
    imagingTestNoticeText: {
        flex: 1,
        fontSize: 14,
        color: "#5856D6",
        fontWeight: "500",
    },
    descriptionSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 12,
    },
    descriptionText: {
        fontSize: 15,
        color: "#666",
        lineHeight: 22,
    },
    readMoreButton: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    readMoreText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#5856D6",
    },
    forAgeSection: {
        marginBottom: 20,
    },
    ageInfoContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F7",
        borderRadius: 12,
        padding: 12,
    },
    forAgeText: {
        fontSize: 15,
        color: "#666",
    },
    petTypeSection: {
        marginBottom: 20,
    },
    petTypeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    petTypeTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F7",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        marginBottom: 10,
    },
    petTypeText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    relatedSection: {
        marginTop: 8,
        paddingVertical: 20,
        backgroundColor: "#fff",
    },
    relatedTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    relatedScrollContent: {
        paddingLeft: 20,
        paddingRight: 8,
    },
    relatedCard: {
        width: 160,
        height: 120,
        borderRadius: 16,
        marginRight: 12,
        overflow: "hidden",
        backgroundColor: "#f5f5f7",
    },
    relatedCardImage: {
        width: "100%",
        objectFit: 'fill',
        height: "100%",
    },
    relatedCardGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    relatedCardTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 4,
    },
    relatedCardPrice: {
        fontSize: 14,
        fontWeight: "700",
        color: "#fff",
    },
    actionBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    addToCartButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 14,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#5856D6",
    },
    addToCartText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#5856D6",
    },
    bookNowButton: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#5856D6",
        borderRadius: 12,
        paddingVertical: 14,
    },
    bookNowText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: "#FF3B30",
        textAlign: "center",
        marginVertical: 16,
    },
    retryButton: {
        backgroundColor: "#5856D6",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
    backButton: {
        backgroundColor: "#5856D6",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
    },
})
