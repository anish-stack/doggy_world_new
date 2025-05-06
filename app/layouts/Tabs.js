import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    interpolate,
} from 'react-native-reanimated';
import { useToken } from '../hooks/useToken';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TAB_WIDTH = SCREEN_WIDTH / 5;

export default function Tabs() {
    const navigation = useNavigation();
    const route = useRoute();
    const { isLoggedIn } = useToken()
    const activeIndex = useSharedValue(2);

    const tabs = [
        { id: 'Clinic', icon: 'call', label: 'Support', route: 'Support' },
        { id: 'Packages', icon: 'paper-plane-sharp', route: 'Cake-Screen', label: 'Birthday' },
        { id: 'Home', icon: 'home', route: 'Home', label: 'Home' },
        { id: 'Doctors', icon: 'calendar', route: 'Consultation', label: 'Consultation' },
        isLoggedIn
            ? { id: 'Profile', icon: 'person', route: 'Profile', label: 'Profile' }
            : { id: 'Login', icon: 'log-in', route: 'login', label: 'Login' }
    ];

    useEffect(() => {
        const currentIndex = tabs.findIndex(tab => tab.label === route.name);
        if (currentIndex !== -1) {
            activeIndex.value = withSpring(currentIndex);
        }
    }, [route]);

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: withSpring(activeIndex.value * TAB_WIDTH) },
                { scale: withSpring(1.2) }
            ],
            opacity: withSpring(1)
        };
    });

    const renderTab = (tab, index) => {
        const isActive = route.name === tab.label;
        const isHome = tab.label === 'Home';

        return (
            <TouchableOpacity
                key={tab.label}
                style={[styles.tab, isHome && styles.homeTab]}
                onPress={() => {
                    activeIndex.value = withSpring(index);
                    navigation.navigate(tab.route);
                }}
            >
                <View style={[
                    styles.iconContainer,
                    isActive && styles.activeIconContainer,
                    isHome && styles.homeIconContainer
                ]}>
                    <Ionicons
                        name={isActive ? tab.icon : `${tab.icon}`}
                        size={isHome ? 24 : 22}
                        color={isHome ? '#FFF' : isActive ? '#FF6B6B' : '#666'}
                    />
                </View>
                <Text style={[
                    styles.tabText,
                    isActive && styles.activeTabText
                ]}>
                    {tab.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <Animated.View style={[styles.indicator, indicatorStyle]} />
                {tabs.map((tab, index) => renderTab(tab, index))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 10,
    },
    tabBar: {
        flexDirection: 'row',
        height: 60,
        alignItems: 'center',
        paddingHorizontal: 10,
        position: 'relative',
    },
    indicator: {
        position: 'absolute',
        width: 6,
        height: 6,
        backgroundColor: '#FF6B6B',
        borderRadius: 3,
        bottom: 2,
        left: TAB_WIDTH / 2 - 3,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeTab: {
        marginTop: -30,
    },
    iconContainer: {
        padding: 8,
        borderRadius: 12,
        position: 'relative',
    },
    activeIconContainer: {
        backgroundColor: '#FFF0F0',
    },
    homeIconContainer: {
        backgroundColor: '#FF6B6B',
        padding: 12,
        borderRadius: 30,
        marginBottom: 4,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    tabText: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    activeTabText: {
        color: '#FF6B6B',
        fontWeight: '600',
    },
});