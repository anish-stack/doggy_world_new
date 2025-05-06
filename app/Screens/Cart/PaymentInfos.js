import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform
} from 'react-native';
import React, { useState } from 'react';
import { Feather, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useToken } from '../../hooks/useToken';
import { useNavigation } from '@react-navigation/native';

export default function PaymentInfos({ cartItems, offer }) {
    const { isLoggedIn } = useToken();
    const navigation = useNavigation();
    const [instructions, setInstructions] = useState('');
    const [buttonScale] = useState(new Animated.Value(1));

    const { Code, minimum_amount, upto_off, active } = offer || {};

    const handlePressIn = () => {
        Animated.spring(buttonScale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(buttonScale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const calculateTotalPrice = () => {
        return cartItems.reduce((total, item) => total + item.Pricing.price * item.quantity, 0);
    };

    const calculateTotalDiscount = () => {
        return cartItems.reduce((total, item) =>
            total + (item.Pricing.price - item.Pricing.disc_price) * item.quantity, 0);
    };

    const calculatePayablePrice = () => {
        return cartItems.reduce((total, item) => total + item.Pricing.disc_price * item.quantity, 0);
    };

    const calculateAfterAppliedCode = () => {
        const payable = calculatePayablePrice();
        if (active && payable >= minimum_amount) {
            return Math.max(0, payable - upto_off);
        }
        return payable;
    };

    const renderPriceRow = (icon, label, amount, type = 'regular') => (
        <View style={styles.priceRow}>
            <View style={styles.priceLabel}>
                <MaterialIcons
                    name={icon}
                    size={18}
                    color={type === 'savings' ? '#22C55E' : '#64748B'}
                />
                <Text style={[
                    styles.priceText,
                    type === 'savings' && styles.savingsText,
                    type === 'total' && styles.totalText
                ]}>
                    {label}
                </Text>
            </View>
            <Text style={[
                styles.priceAmount,
                type === 'savings' && styles.savingsAmount,
                type === 'total' && styles.totalAmount
            ]}>
                <FontAwesome name="rupee" size={14} /> {amount.toFixed(2)}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="delivery-dining" size={24} color="#0F172A" />
                    <Text style={styles.sectionTitle}>Delivery Instructions</Text>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Add special instructions for delivery (optional)"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={2}
                    value={instructions}
                    onChangeText={setInstructions}
                />
            </View>

            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <MaterialIcons name="receipt-long" size={24} color="#0F172A" />
                    <Text style={styles.sectionTitle}>Price Details</Text>
                </View>

                <View style={styles.priceBreakdown}>
                    {renderPriceRow('shopping-cart', 'Cart Total', calculateTotalPrice())}
                    {renderPriceRow('local-offer', 'Total Discount', calculateTotalDiscount(), 'savings')}

                    {active && calculatePayablePrice() >= minimum_amount && (
                        renderPriceRow('loyalty', `Coupon Applied (${Code})`, upto_off, 'savings')
                    )}

                    <View style={styles.separator} />

                    {renderPriceRow('payment', 'Total Amount',
                        active ? calculateAfterAppliedCode() : calculatePayablePrice(),
                        'total'
                    )}
                </View>
            </View>

            <Animated.View style={[styles.checkoutContainer, {
                transform: [{ scale: buttonScale }]
            }]}>
                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={() => navigation.navigate(
                        isLoggedIn ? 'select_address_and_order' : 'login',
                        isLoggedIn ? {
                            data: { ...cartItems, Code, minimum_amount, upto_off, active }
                        } : undefined
                    )}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.9}
                >
                    <View style={styles.checkoutContent}>
                        <View>
                            <Text style={styles.checkoutAmount}>
                                <FontAwesome name="rupee" size={18} /> {calculateAfterAppliedCode().toFixed(2)}
                            </Text>

                        </View>
                        <View style={styles.checkoutAction}>
                            <Text style={styles.checkoutText}>
                                {isLoggedIn ? 'Proceed to Checkout' : 'Login to Continue'}
                            </Text>
                            <Feather name="arrow-right" size={20} color="#FFF" />
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingBottom: 100
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0'
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0F172A',
        marginLeft: 8
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 40,
        textAlignVertical: 'top'
    },
    priceBreakdown: {
        marginTop: 8
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8
    },
    priceLabel: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    priceText: {
        fontSize: 16,
        color: '#64748B',
        marginLeft: 8
    },
    priceAmount: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500'
    },
    savingsText: {
        color: '#22C55E'
    },
    savingsAmount: {
        color: '#22C55E',
        fontWeight: '600'
    },
    totalText: {
        color: '#0F172A',
        fontWeight: '600'
    },
    totalAmount: {
        color: '#0F172A',
        fontWeight: '700',
        fontSize: 18
    },
    separator: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 12
    },
    checkoutContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 12
            },
            android: {
                elevation: 8
            }
        })
    },
    checkoutButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 16,
        overflow: 'hidden'
    },
    checkoutContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16
    },
    checkoutAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    viewDetailText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4
    },
    checkoutAction: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    checkoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginRight: 8
    }
});