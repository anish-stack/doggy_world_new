import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Image,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToken } from '../../hooks/useToken';
import { getUser } from '../../hooks/getUserHook';

export default function Address() {
    const [address, setAddress] = useState({
        fullName: '',
        street: '',
        city: '',
        HouseNo: '',
    
        zipCode: '',
        phone: '',
    });

    const { token, isLoggedIn, deleteToken } = useToken()
    const { user } = getUser()
    const [loading, setLoading] = useState(false)
    const navigation = useNavigation()
    const route = useRoute();
    const { data } = route.params || {};
    const orderItems = Object.entries(data)
        .filter(([key]) => !isNaN(Number(key)))
        .map(([_, value]) => value);

    const handleSubmit = async () => {
        if (!isLoggedIn) {
            Alert.alert('Login Required', 'Please log in to place your order.');
            return;
        }

        // Check if any address field is empty
        const missingFields = Object.entries(address).filter(([key, value]) => !value.trim());

        if (missingFields.length > 0) {
            const missingFieldNames = missingFields.map(([key]) => key).join(', ');
            Alert.alert('Missing Address Details', `Please fill in the following fields: ${missingFieldNames}`);
            return;
        }

        setLoading(true);

        const OrderDetails = { Product: { ...data }, address, user };

        try {
            const response = await axios.post(
                `https://admindoggy.adsdigitalmedia.com/api/create_order_of_product`,
                OrderDetails
            );

            navigation.navigate('Order-confirm', {
                order: response.data.order
            });

            setLoading(false);
            Alert.alert('Success', 'Your order has been placed successfully.');
        } catch (error) {
            console.log("Error Response:", error.response?.data?.error?.message);

            if (error.response?.data?.error?.message === 'User not found.') {
                await deleteToken();
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again to continue.',
                    [{
                        text: 'Login', onPress: () => navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }]
                        })
                    }]
                );
                return;
            } else {
                Alert.alert('Order Failed', error.response?.data?.error?.message || 'Something went wrong. Please try again.');
            }
            setLoading(false);
        }
    };



    const calculateTotal = () => {
        return orderItems.reduce((total, item) => {
            return total + (item.Pricing.disc_price * item.quantity);
        }, 0);
    };

    const renderOrderSummary = () => {
        return orderItems.map((item, index) => (
            <View key={index} style={styles.orderItem}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
                <View style={styles.productInfo}>
                    <Text style={styles.productTitle}>{item.title}</Text>
                    <Text style={styles.variantInfo}>Size: {item.varientSize}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.discountPrice}>₹{item.Pricing.disc_price}</Text>
                        <Text style={styles.originalPrice}>₹{item.Pricing.price}</Text>
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{item.Pricing.off_dis_percentage}% OFF</Text>
                        </View>
                    </View>
                    <Text style={styles.quantity}>Quantity: {item.quantity}</Text>
                </View>
            </View>
        ));
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Order Summary Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Icon name="truck" size={24} color="#FF3131" />

                        <Text style={styles.sectionTitle}>Order Summary</Text>
                    </View>
                    {renderOrderSummary()}


                    {data.Code && (
                        <View style={styles.promoSection}>

                            <Icon name="tag" size={20} color="#4CAF50" />

                            <Text style={styles.promoSaving}>
                                Promo code <Text style={styles.promoCode}>{data.Code}</Text> applied
                                Save up to ₹{data.upto_off} on min. order of ₹{data.minimum_amount}
                            </Text>
                        </View>
                    )}

                    {/* Total Amount */}
                    <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>₹{calculateTotal()}</Text>
                    </View>
                </View>

                {/* Delivery Address Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Icon name="map-pin" size={24} color="#000" />

                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                    </View>

                    <View style={styles.formGroup}>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={address.fullName}
                            onChangeText={(text) => setAddress({ ...address, fullName: text })}
                            placeholderTextColor="#666"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            value={address.phone}
                            onChangeText={(text) => setAddress({ ...address, phone: text })}
                            keyboardType="phone-pad"
                            placeholderTextColor="#666"
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Street Address"
                            value={address.street}
                            onChangeText={(text) => setAddress({ ...address, street: text })}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#666"
                        />
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, styles.halfInput]}
                                placeholder="City"
                                value={address.city}
                                onChangeText={(text) => setAddress({ ...address, city: text })}
                                placeholderTextColor="#666"
                            />
                            <TextInput
                                style={[styles.input, styles.halfInput]}
                                placeholder="State"
                                value={address.state}
                                onChangeText={(text) => setAddress({ ...address, state: text })}
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, styles.halfInput]}
                                placeholder="ZIP Code"
                                value={address.zipCode}
                                onChangeText={(text) => setAddress({ ...address, zipCode: text })}
                                keyboardType="numeric"
                                placeholderTextColor="#666"
                            />
                            <TextInput
                                style={[styles.input, styles.halfInput]}
                                placeholder="House No"
                                value={address.HouseNo}
                                onChangeText={(text) => setAddress({ ...address, HouseNo: text })}

                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.submitButton} disabled={loading} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>{loading ? 'Please Wait ...' : 'Placed Order'}</Text>
                    <Icon name="angle-right" size={24} color="#fff" />

                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    section: {
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#f5f5f5',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    orderItem: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 12,
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
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    variantInfo: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    discountPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: '#2e7d32',
        fontSize: 12,
        fontWeight: '600',
    },
    quantity: {
        fontSize: 14,
        color: '#666',
    },
    promoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f8e9',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        gap: 8,
    },
    promoText: {
        flex: 1,
        fontSize: 14,
        color: '#1b5e20',
    },
    promoCode: {
        fontWeight: '700',
    },
    promoSaving: {
        fontSize: 12,
        color: '#2e7d32',
        marginTop: 4,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    totalLabel: {
        fontSize: 16,
        color: '#666',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
    },
    formGroup: {
        gap: 16,
    },
    input: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#000',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    halfInput: {
        flex: 1,
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    submitButton: {
        backgroundColor: '#FF3131',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});