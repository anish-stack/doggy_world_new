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
                                color={isProductActive ? '#E53935' : '#fff'} 
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
                                color={isLabActive ? '#E53935' : '#fff'} 
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
           
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E53935', // Red 600
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    headerWrapper: {
        paddingTop: 16,
        paddingBottom: 12,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 0,
        zIndex: 10,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        paddingHorizontal: 18,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        paddingVertical: 10,
        marginTop: 8,
        marginLeft: 24,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12, // Slightly reduced to accommodate back button
        paddingVertical: 8,
        flex: 1,
        justifyContent: 'center',
    },
    activeButton: {
        backgroundColor: '#fff',
        borderRadius: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
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
        color: '#E53935',
        fontWeight: '700',
    },
    divider: {
        height: 24,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    bottomDecoration: {
        height: 4,
        backgroundColor: '#C62828', // Darker red for the bottom accent
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    }
});