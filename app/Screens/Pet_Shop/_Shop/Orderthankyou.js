import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrderThankYou() {
    const route = useRoute();
    const { booking } = route.params;
    const navigation = useNavigation()
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.get(`http://192.168.1.24:8000/api/v1/booking-details/${booking}`);
                if (response.data.success) {
                    setOrderData(response.data.data);
                } else {
                    setError('Failed to fetch order details');
                }
            } catch (err) {
                setError('Error connecting to server');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF5252" />
                <Text style={styles.loadingText}>Loading your order details...</Text>
            </View>
        );
    }

    if (error ) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={60} color="#FF5252" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.reset({
                      index: 0,
                      routes: [{ name: "home" }],
                })}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={['#FF5252', '#FF8080']}
                style={styles.headerContainer}
            >
                <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={80} color="white" />
                </View>
                <Text style={styles.thankYouText}>Thank You!</Text>
                <Text style={styles.orderConfirmedText}>Your order has been confirmed</Text>
                <Text style={styles.orderNumber}>Order #{orderData.orderNumber}</Text>
            </LinearGradient>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.divider} />

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order Status:</Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{orderData.status}</Text>
                    </View>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method:</Text>
                    <Text style={styles.detailValue}>{capitalizeFirstLetter(orderData.paymentMethod)}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Status:</Text>
                    <Text style={styles.detailValue}>{orderData.paymentStatus}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expected Delivery:</Text>
                    <Text style={styles.detailValue}>{formatDate(orderData.deliveryDate)}</Text>
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Pet Information</Text>
                <View style={styles.divider} />

                <View style={styles.petInfoContainer}>
                    <View style={styles.petImagePlaceholder}>
                        <Ionicons name="paw" size={40} color="#FF5252" />
                    </View>
                    <View style={styles.petDetails}>
                        <Text style={styles.petName}>{orderData.petId.petname}</Text>
                        <Text style={styles.petBreed}>{orderData.petId.petbreed}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Items Ordered</Text>
                <View style={styles.divider} />

                {orderData.items.map((item, index) => (
                    <View key={index} style={styles.itemContainer}>
                        <View style={styles.itemImagePlaceholder}>
                            {item?.itemId.mainImage?.url ? (
                                <Image source={{ uri: item?.itemId.mainImage?.url?.replace(".avif", ".jpg") }} style={{ width: 50, height: 50 }} />
                            ) : (
                                <Ionicons name="cube" size={30} color="#FF5252" />
                            )}


                        </View>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.itemId?.name}</Text>
                            <Text style={styles.itemName}>{item.variantName}</Text>
                            <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                            <Text style={styles.itemPrice}>₹{item.unitPrice.toFixed(2)}</Text>
                        </View>
                    </View>
                ))}
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <View style={styles.divider} />

                <View style={styles.addressContainer}>
                    <Ionicons name="location" size={24} color="#FF5252" style={styles.addressIcon} />
                    <View style={styles.addressDetails}>
                        <Text style={styles.addressText}>{orderData.deliveryInfo.street}</Text>
                        <Text style={styles.addressText}>{orderData.deliveryInfo.city}, {orderData.deliveryInfo.state} {orderData.deliveryInfo.zipCode}</Text>
                        <Text style={styles.addressText}>{orderData.deliveryInfo.country}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Price Details</Text>
                <View style={styles.divider} />

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal:</Text>
                    <Text style={styles.priceValue}>₹{orderData.subtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Discount:</Text>
                    <Text style={styles.discountValue}>-₹{orderData.discountAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Tax:</Text>
                    <Text style={styles.priceValue}>₹{orderData.taxAmount.toFixed(2)}</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Shipping:</Text>
                    <Text style={styles.priceValue}>₹{orderData.shippingFee.toFixed(2)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>₹{orderData.totalAmount.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.primaryButtonText}>Back to Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('OrderTracking', { orderId: orderData._id })}>
                    <Text style={styles.secondaryButtonText}>Track Order</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.supportContainer}>
                <Text style={styles.supportText}>Need help with your order?</Text>
                <TouchableOpacity>
                    <Text style={styles.supportLink}>Contact Support</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#333',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f8f8',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#FF5252',
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerContainer: {
        padding: 32,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    checkmarkContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    thankYouText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    orderConfirmedText: {
        fontSize: 18,
        color: 'white',
        marginBottom: 16,
    },
    orderNumber: {
        fontSize: 16,
        color: 'white',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    sectionContainer: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 16,
        color: '#666',
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    statusBadge: {
        backgroundColor: '#4CAF50',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 16,
    },
    statusText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
    petInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    petImagePlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    petDetails: {
        flex: 1,
    },
    petName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    petBreed: {
        fontSize: 16,
        color: '#666',
    },
    itemContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    itemImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF5252',
        marginTop: 2,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    addressDetails: {
        flex: 1,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    priceLabel: {
        fontSize: 16,
        color: '#666',
    },
    priceValue: {
        fontSize: 16,
        color: '#333',
    },
    discountValue: {
        fontSize: 16,
        color: '#4CAF50',
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF5252',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: 16,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#FF5252',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginLeft: 8,
        borderWidth: 1,
        borderColor: '#FF5252',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    secondaryButtonText: {
        color: '#FF5252',
        fontSize: 16,
        fontWeight: 'bold',
    },
    supportContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    supportText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    supportLink: {
        fontSize: 16,
        color: '#FF5252',
        fontWeight: '500',
    },
});