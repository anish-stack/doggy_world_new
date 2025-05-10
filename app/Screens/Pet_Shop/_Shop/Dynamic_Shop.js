"use client"

import { useEffect, useState } from "react"
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
} from "react-native"
import axios from "axios"
import { useNavigation, useRoute } from "@react-navigation/native"
import UpperLayout from "../../../layouts/UpperLayout"
import { API_END_POINT_URL_LOCAL } from "../../../constant/constant"
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

export default function Dynamic_Shop() {
    const route = useRoute()
    const { title, id } = route.params || {}
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState([])
    const [error, setError] = useState(null)
    const navigation = useNavigation()

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/petshop-subs/${id}`)
                const resdata = response.data.data

                // Filter active items and sort by position
                const filteredData = resdata.filter((item) => item.active).sort((a, b) => a.position - b.position)

                setData(filteredData)
            } catch (err) {
                console.error(err)
                setError("Failed to load data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    const navigateToProducts = (item) => {
        // Navigate to products screen (placeholder)
        console.log("Navigate to products for:", item.name)
        navigation.navigate('Dynamic_Products_Shop', { category: item._id, title: item.name });
    }

    const renderPlaceholderImage = (name) => {

        const colors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#6A5ACD", "#FF8C42", "#06D6A0"]
        const colorIndex = name.length % colors.length
        const backgroundColor = colors[colorIndex]

        // Get first letter of each word
        const initials = name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()

        return (
            <View style={[styles.placeholderImage, { backgroundColor }]}>
                <Text style={styles.placeholderText}>{initials}</Text>
            </View>
        )
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <UpperLayout title={title} isBellShow={false} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>Loading categories...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <UpperLayout title={title} isBellShow={false} />
                <View style={styles.centered}>
                    <MaterialIcons name="error-outline" size={50} color="#FF6B6B" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <UpperLayout title={title} isBellShow={false} />

                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={["#FF6B6B", "#FF8E53"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.headerGradient}
                    >
                        <Text style={styles.heading}>
                            Shop By <Text style={styles.headingHighlight}>Categories</Text>
                        </Text>
                        <Text style={styles.subheading}>Find the perfect products for your pet</Text>
                    </LinearGradient>
                </View>

                {data.length === 0 ? (
                    <View style={styles.noDataContainer}>
                        <FontAwesome5 name="box-open" size={50} color="#ccc" />
                        <Text style={styles.noData}>No categories available</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
                        <View style={styles.gridContainer}>
                            {data.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={styles.itemContainer}
                                    onPress={() => navigateToProducts(item)}
                                    activeOpacity={0.7}
                                >
                                    {item.imageUrl && item.imageUrl.url ? (
                                        <Image source={{ uri: item.imageUrl.url }} style={styles.image} resizeMode="contain" />
                                    ) : (
                                        renderPlaceholderImage(item.name)
                                    )}
                                    <Text style={styles.itemTitle}>{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        color: "#666",
        fontSize: 16,
    },
    errorText: {
        marginTop: 10,
        color: "#666",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: "#FF6B6B",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    headerContainer: {
        marginBottom: 20,
    },
    headerGradient: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
    },
    headingHighlight: {
        color: "#FFD166",
    },
    subheading: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.8)",
        textAlign: "center",
        marginTop: 5,
    },
    scrollViewContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    gridContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignContent: 'flex-start',
        alignItems: 'flex-start',
        justifyContent: "space-between",
    },
    itemContainer: {
        width: (width - 48) / 3,
        marginBottom: 20,
        alignItems: "center",
        backgroundColor: "white",
        alignContent: 'flex-start',

        borderRadius: 12,
        padding: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    image: {
        width: "100%",
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
    },
    placeholderImage: {
        width: "100%",
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        color: "white",
        fontSize: 24,
        fontWeight: "bold",
    },
    itemTitle: {
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
        color: "#333",
    },
    noDataContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    noData: {
        textAlign: "center",
        fontSize: 16,
        color: "#666",
        marginTop: 10,
    },
})
