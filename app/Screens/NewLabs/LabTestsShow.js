
import { useCallback, useEffect, useState, useMemo } from "react"
import {
    View,
    Text,
    Linking,
    RefreshControl,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    TextInput,
    Animated,
    Dimensions,
    Platform,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import axios from "axios"
import { API_END_POINT_URL_LOCAL } from "../../constant/constant"
import {
    Search,
    ArrowRight,
    Phone,
    ChevronLeft,
    Star,
    Zap,
    Microscope,
    Cat,
    Dog,
    Heart,
    RefreshCw,
} from "lucide-react-native"
import { LinearGradient } from "expo-linear-gradient"
import * as Haptics from "expo-haptics"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width * 0.75
const PHONE_NUMBER = "tel:9811299059"
const SECTIONS = ["All", "Popular", "Imaging", "Commoncats", "CommonDogs", "Cat", "Dog"]

export default function LabTestsShow() {
    const route = useRoute()
    const { type, id } = route.params || {}
    const [labTests, setLabTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false)
    const [searchText, setSearchText] = useState("")
    const [activeSection, setActiveSection] = useState("Popular")
    const scrollY = new Animated.Value(0)
    const searchOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0.8],
        extrapolate: "clamp",
    })

    const handleCallPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        Linking.openURL(PHONE_NUMBER)
    }, [])

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchLabTests()
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }, [])

    const fetchLabTests = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/LabTest-products`)
            if (response.data && response.data.success) {
                const data = response.data.data.filter((item) =>
                    item.WhichTypeOfvaccinations.some((it) => it.title === type || it?._id === id),
                )
                setLabTests(data)
            } else {
                setError("Failed to fetch lab tests")
            }
        } catch (error) {
            setError("Error connecting to server")
            console.error("Error fetching lab tests:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [type, id])

    useEffect(() => {
        fetchLabTests()
    }, [fetchLabTests])

    // Group lab tests by category for section layout
    const categorizedLabTests = useMemo(() => {
        if (!labTests.length) return {}

        // Filter by search text if it's provided
        let filteredResults = [...labTests]
        if (searchText) {
            filteredResults = filteredResults.filter((test) => test.title.toLowerCase().includes(searchText.toLowerCase()))
        }

        const AllItems = filteredResults
            .sort((a, b) => a.position - b.position)
        const popularItems = filteredResults
            .filter((v) => v.is_popular && !v.is_imaging_test)
            .sort((a, b) => a.position - b.position)

        const commonCats = filteredResults
            .filter((v) => v.is_common_for_cat && !v.is_imaging_test)
            .sort((a, b) => a.position - b.position)

        const commonDogs = filteredResults
            .filter((v) => v.is_common_for_dog && !v.is_imaging_test)
            .sort((a, b) => a.position - b.position)

        // Identify and sort package items (imaging tests)
        const packageItems = filteredResults.filter((v) => v.is_imaging_test).sort((a, b) => a.position - b.position)

        // Get a set of package IDs to exclude from other categories
        const packageIds = new Set(packageItems.map((item) => item._id))

        // Filter cat and dog items, excluding any that are packages
        const catItems = filteredResults
            .filter((v) => v.is_cat && !packageIds.has(v._id))
            .sort((a, b) => a.position - b.position)

        const dogItems = filteredResults
            .filter((v) => v.is_dog && !packageIds.has(v._id))
            .sort((a, b) => a.position - b.position)

        const result = {
            All: AllItems.length > 0 ? AllItems : undefined,
            Popular: popularItems.length > 0 ? popularItems : undefined,
            Imaging: packageItems.length > 0 ? packageItems : undefined,
            Cat: catItems.length > 0 ? catItems : undefined,
            Commoncats: commonCats.length > 0 ? commonCats : undefined,
            CommonDogs: commonDogs.length > 0 ? commonDogs : undefined,
            Dog: dogItems.length > 0 ? dogItems : undefined,
        }

        return result
    }, [labTests, searchText])

    const getSectionIcon = (section) => {
        switch (section) {
            case "Popular":
                return <Star size={18} color="#FF9500" />
            case "Imaging":
                return <Microscope size={18} color="#5856D6" />
            case "Commoncats":
                return <Heart size={18} color="#FF2D55" />
            case "CommonDogs":
                return <Heart size={18} color="#FF2D55" />
            case "Cat":
                return <Cat size={18} color="#FF9500" />
            case "Dog":
                return <Dog size={18} color="#5856D6" />
            default:
                return <Zap size={18} color="#FF9500" />
        }
    }

    const getSectionColor = (section) => {
        switch (section) {
            case "Popular":
                return ["#FF9500", "#FF2D55"]
            case "Imaging":
                return ["#5856D6", "#007AFF"]
            case "Commoncats":
                return ["#FF2D55", "#FF9500"]
            case "CommonDogs":
                return ["#5856D6", "#34C759"]
            case "Cat":
                return ["#FF9500", "#FF2D55"]
            case "Dog":
                return ["#5856D6", "#007AFF"]
            default:
                return ["#007AFF", "#5856D6"]
        }
    }

    const renderLabTestCard = (item, section) => {
        const isHomeTest = type === "Lab Tests at Your Doorstep" ? true : false

        // Determine which prices to display based on test type
        let displayPrice, displayDiscountPrice

        if (isHomeTest && item.home_price_of_package && item.home_price_of_package_discount) {
            displayPrice = item.home_price_of_package
            displayDiscountPrice = item.home_price_of_package_discount
        } else {
            displayPrice = item.price
            displayDiscountPrice = item.discount_price
        }

        // Calculate percentage off
        const percentOff =
            displayDiscountPrice < displayPrice ? Math.round(((displayPrice - displayDiscountPrice) / displayPrice) * 100) : 0

        const cardStyle = getCardStyle(section)

        return (
            <TouchableOpacity
                key={item._id}
                style={[styles.card, cardStyle.card]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    navigation.navigate("LabDetailsDetail", { id: item._id, type, Typeid: id })
                }}
                activeOpacity={0.9}
            >
                <View style={styles.cardImageContainer}>
                    <Image source={{ uri: item.mainImage?.url }} style={styles.cardImage} resizeMode="fill" />
                    {item.tag && (
                        <View style={styles.tagContainer}>
                            <Text style={styles.tagText}>{item.tag}</Text>
                        </View>
                    )}
                    {percentOff > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>{percentOff}% OFF</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.small_desc}
                    </Text>

                    <View style={styles.priceContainer}>
                        {displayDiscountPrice < displayPrice ? (
                            <>
                                <Text style={styles.discountPrice}>₹{displayDiscountPrice}</Text>
                                <Text style={styles.originalPrice}>₹{displayPrice}</Text>
                            </>
                        ) : (
                            <Text style={styles.price}>₹{displayPrice}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            navigation.navigate("LabDetailsDetail", { id: item._id, type, Typeid: id })
                        }}
                        style={[styles.bookButton, { backgroundColor: cardStyle.buttonColor }]}
                    >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                        <ArrowRight size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }

    const getCardStyle = (section) => {
        switch (section) {
            case "Popular":
                return {
                    card: { borderColor: "rgba(255, 149, 0, 0.3)" },
                    buttonColor: "#FF9500",
                }
            case "Imaging":
                return {
                    card: { borderColor: "rgba(88, 86, 214, 0.3)" },
                    buttonColor: "#5856D6",
                }
            case "Commoncats":
                return {
                    card: { borderColor: "rgba(255, 45, 85, 0.3)" },
                    buttonColor: "#FF2D55",
                }
            case "CommonDogs":
                return {
                    card: { borderColor: "rgba(52, 199, 89, 0.3)" },
                    buttonColor: "#34C759",
                }
            case "Cat":
                return {
                    card: { borderColor: "rgba(255, 149, 0, 0.3)" },
                    buttonColor: "#FF9500",
                }
            case "Dog":
                return {
                    card: { borderColor: "rgba(0, 122, 255, 0.3)" },
                    buttonColor: "#007AFF",
                }
            default:
                return {
                    card: { borderColor: "rgba(0, 122, 255, 0.3)" },
                    buttonColor: "#007AFF",
                }
        }
    }

    const renderSectionHeader = (title, hasItems) => {
        // Don't render Imaging if type is "Lab Tests at Your Doorstep"
        if (type === "Lab Tests at Your Doorstep" && title === "Imaging") {
            return null
        }

        let displayTitle = ""
        switch (title) {
            case "Popular":
                displayTitle = "Popular Lab Tests"
                break
            case "Imaging":
                displayTitle = "Imaging Tests"
                break
            case "Commoncats":
                displayTitle = "Common Diseases Test for Cats"
                break
            case "CommonDogs":
                displayTitle = "Common Diseases Test for Dogs"
                break
            case "Cat":
                displayTitle = "Cat Lab Tests"
                break
            case "Dog":
                displayTitle = "Dog Lab Tests"
                break
            default:
                displayTitle = `${title} Lab Tests`
        }

        const colors = getSectionColor(title)

        return (
            <View style={[styles.sectionHeader, !hasItems && styles.emptySection]}>
                <View style={styles.sectionTitleContainer}>
                    {getSectionIcon(title)}
                    <Text style={styles.sectionTitle}>{displayTitle}</Text>
                </View>


            </View>
        )
    }

    const renderCategoryTabs = () => {
        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryTabsContainer}
            >
                {SECTIONS.map((section) => {
                    // Skip Imaging if type is "Lab Tests at Your Doorstep"
                    if (type === "Lab Tests at Your Doorstep" && section === "Imaging") {
                        return null
                    }

                    const isActive = activeSection === section
                    const sectionItems = categorizedLabTests[section] || []
                    if (!sectionItems.length) return null

                    return (
                        <TouchableOpacity
                            key={section}
                            style={[styles.categoryTab, isActive && styles.activeCategoryTab]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                setActiveSection(section)
                            }}
                        >
                            {getSectionIcon(section)}
                            <Text style={[styles.categoryTabText, isActive && styles.activeCategoryTabText]}>
                                {section === "Commoncats" ? "Common Cats" : section === "CommonDogs" ? "Common Dogs" : section}
                            </Text>
                        </TouchableOpacity>
                    )
                })}
            </ScrollView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: searchOpacity }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        navigation.goBack()
                    }}
                >
                    <ChevronLeft size={24} color="#333" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>{type || "Pet Lab Tests"}</Text>

                <TouchableOpacity style={styles.callButton} onPress={handleCallPress}>
                    <Phone size={20} color="#FF9500" />
                </TouchableOpacity>
            </Animated.View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Search size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for lab tests..."
                        value={searchText}
                        onChangeText={(text) => {
                            setSearchText(text)
                            if (text.length > 0) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            }
                        }}
                        placeholderTextColor="#888"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                setSearchText("")
                            }}
                            style={styles.clearButton}
                        >
                            <View style={styles.clearButtonInner}>
                                <Text style={styles.clearButtonText}>×</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Tabs */}
            {renderCategoryTabs()}

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
                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FF9500" />
                        <Text style={styles.loadingText}>Loading lab tests...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                                fetchLabTests()
                            }}
                        >
                            <RefreshCw size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {SECTIONS.map((section) => {
                            // Only show the active section
                            if (section !== activeSection) return null

                            const sectionItems = categorizedLabTests[section] || []

                            // Skip Imaging if type is "Lab Tests at Your Doorstep"
                            if (type === "Lab Tests at Your Doorstep" && section === "Imaging") {
                                return null
                            }

                            return (
                                <View key={section} style={styles.section}>
                                    {renderSectionHeader(section, sectionItems.length > 0)}

                                    {sectionItems.length > 0 ? (
                                        <View style={styles.cardsGrid}>{sectionItems.map((item) => renderLabTestCard(item, section))}</View>
                                    ) : (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>No {section.toLowerCase()} lab tests found</Text>
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </>
                )}
            </Animated.ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#f5f5f5",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    callButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#fff8ee",
        borderWidth: 1,
        borderColor: "#FFE0B2",
    },
    searchContainer: {
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f7",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "ios" ? 12 : 4,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        paddingVertical: 8,
    },
    clearButton: {
        padding: 4,
    },
    clearButtonInner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#ddd",
        alignItems: "center",
        justifyContent: "center",
    },
    clearButtonText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "bold",
        lineHeight: 20,
    },
    categoryTabsContainer: {
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: "#fff",
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    categoryTab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        height: 40,
        paddingVertical: 10,
        marginRight: 10,
        borderRadius: 20,
        backgroundColor: "#f5f5f7",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    activeCategoryTab: {
        backgroundColor: "#fff8ee",
        borderColor: "#FFE0B2",
    },
    categoryTabText: {
        marginLeft: 6,
        fontSize: 10,
        fontWeight: "600",
        color: "#666",
    },
    activeCategoryTabText: {
        color: "#FF9500",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: "#fff",
    },
    sectionTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    emptySection: {
        borderBottomWidth: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginLeft: 8,
    },
    viewAllButton: {
        borderRadius: 20,
        overflow: "hidden",
    },
    viewAllGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    viewAllText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        marginRight: 4,
    },
    cardsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        minHeight: 300,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        minHeight: 300,
    },
    errorText: {
        color: "#FF3B30",
        fontSize: 16,
        marginBottom: 16,
        textAlign: "center",
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FF9500",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    retryButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
    emptyContainer: {
        padding: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        margin: 16,
        minHeight: 150,
        borderWidth: 1,
        borderColor: "#f0f0f0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    emptyText: {
        color: "#888",
        fontSize: 16,
        textAlign: "center",
    },
    card: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        overflow: "hidden",
        borderWidth: 1,
    },
    cardImageContainer: {
        position: "relative",
        width: "100%",
        height: 140,
    },
    cardImage: {
        width: "100%",
        objectFit: 'fill',
        height: "90%",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    tagContainer: {
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: "rgba(255, 149, 0, 0.9)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 10,
    },
    discountBadge: {
        position: "absolute",
        top: 5,
        right: 10,
        backgroundColor: "rgba(52, 199, 89, 0.9)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    discountBadgeText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 8,
    },
    cardContent: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 11,
        color: "#666",
        marginBottom: 8,
        lineHeight: 18,
        height: 36,
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 12,
    },
    price: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF9500",
    },
    discountPrice: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FF9500",
    },
    originalPrice: {
        fontSize: 13,
        color: "#888",
        textDecorationLine: "line-through",
        marginLeft: 8,
    },
    bookButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 10,
    },
    bookButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
        marginRight: 4,
    },
})
