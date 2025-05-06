import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export default function Orderconfirm() {
    const route = useRoute();
    const { order } = route.params || {};
    const navigation = useNavigation()

    useEffect(() => {
        setTimeout(() => {
            navigation.navigate('Home')
        }, 3000)
    }, [])

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <Animated.View
                    entering={FadeInDown.duration(800)}
                    style={styles.heroSection}
                >
                    <Image
                        source={{ uri: 'https://ideogram.ai/assets/image/lossless/response/butgHCHeSAOdaMlHGmhsow' }}
                        style={styles.heroImage}
                    />
                    <View style={styles.heroOverlay}>
                        <Text style={styles.heroTitle}>Order Confirmed!</Text>
                        <Text style={styles.heroSubtitle}>Your treats are on the way</Text>
                    </View>
                </Animated.View>

                {/* Order Summary */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(200)}
                    style={styles.summaryCard}
                >
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <Text style={styles.itemCount}>{order.length} items in your order</Text>
                </Animated.View>

                {/* Order Items */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(400)}
                    style={styles.itemsContainer}
                >
                    {order.map((item, index) => (
                        <View key={index} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                                <Ionicons name="cafe-outline" size={24} color="#8B4513" />
                                <Text style={styles.itemTitle}>{item.title}</Text>
                            </View>

                            <View style={styles.itemDetails}>
                                <DetailRow
                                    label="Quantity"
                                    value={item.quantity.toString()}
                                />
                                {item.isVarientTrue && (
                                    <DetailRow
                                        label="Size"
                                        value={item.varientSize}
                                    />
                                )}
                                <DetailRow
                                    label="Type"
                                    value={item.isBakeryProduct ? "Bakery Item" : "Other"}
                                />
                            </View>
                        </View>
                    ))}
                </Animated.View>

                {/* Additional Info */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(600)}
                    style={styles.infoCard}
                >
                    <Text style={styles.infoText}>
                        We'll notify you when your order is ready for pickup
                    </Text>

                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F3',
    },
    heroSection: {
        height: 400,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))',
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    heroSubtitle: {
        fontSize: 18,
        color: 'white',
        marginTop: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    summaryCard: {
        backgroundColor: 'white',
        margin: 20,
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8B4513',
        marginBottom: 8,
    },
    itemCount: {
        fontSize: 16,
        color: '#666',
    },
    itemsContainer: {
        paddingHorizontal: 20,
        gap: 15,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#8B4513',
        flex: 1,
    },
    itemDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    infoCard: {
        backgroundColor: '#FFF',
        margin: 20,
        padding: 20,
        borderRadius: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#8B4513',
        marginTop: 20,
    },
    infoText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    estimateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    estimateText: {
        fontSize: 14,
        color: '#8B4513',
        fontWeight: '500',
    },
});