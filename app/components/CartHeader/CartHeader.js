// CartHeader.js
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CartHeader() {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    
    // Check if current route is one of the valid routes
    const isProductActive = currentRoute === 'cart';
    const isLabActive = currentRoute === 'labCart';

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.7}
                >
                    <Icon 
                        name="arrow-left" 
                        size={24} 
                        color="#fff"
                    />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>My Cart</Text>
                
                <View style={styles.headerContent}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isProductActive && styles.activeButton
                            ]}
                            onPress={() => navigation.navigate('cart')}
                            activeOpacity={0.7}
                            disabled={isProductActive}
                        >
                            <Icon 
                                name="food-takeout-box-outline" 
                                size={22} 
                                color={isProductActive ? '#FF6B6B' : '#fff'} 
                                style={styles.icon} 
                            />
                            <Text style={[
                                styles.text,
                                isProductActive && styles.activeText
                            ]}>Products</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.divider} />
                        
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isLabActive && styles.activeButton
                            ]}
                            onPress={() => navigation.navigate('labCart')}
                            activeOpacity={0.7}
                            disabled={isLabActive}
                        >
                            <Icon 
                                name="doctor" 
                                size={22} 
                                color={isLabActive ? '#FF6B6B' : '#fff'} 
                                style={styles.icon} 
                            />
                            <Text style={[
                                styles.text,
                                isLabActive && styles.activeText
                            ]}>Lab And Tests</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View style={styles.bottomDecoration} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FF6B6B', // Softer red color
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    headerWrapper: {
        paddingTop: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        ...Platform.select({
            ios: {
                fontFamily: 'System',
            },
            android: {
                fontFamily: 'sans-serif-medium',
            },
        }),
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 18,
        zIndex: 10,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
    },
    headerContent: {
        paddingHorizontal: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingVertical: 6,
        marginTop: 8,
        marginHorizontal: 24,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flex: 1,
        justifyContent: 'center',
        borderRadius: 12,
    },
    activeButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    icon: {
        marginRight: 8,
    },
    text: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        ...Platform.select({
            ios: {
                fontFamily: 'System',
            },
            android: {
                fontFamily: 'sans-serif',
            },
        }),
    },
    activeText: {
        color: '#FF6B6B',
        fontWeight: '700',
    },
    divider: {
        height: 28,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 4,
    },
    bottomDecoration: {
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    }
});