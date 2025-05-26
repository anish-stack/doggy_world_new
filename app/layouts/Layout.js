import { View, StyleSheet, ScrollView, RefreshControl, Text, Dimensions, StatusBar } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from './Header';
import Tabs from './Tabs';
import Popup from '../components/PopUp/Popup';
import { useToken } from '../hooks/useToken';
import LottieView from 'lottie-react-native';
const { width, height } = Dimensions.get("window");

export default function Layout({ children, isHeaderShow = true, onRefresh, refreshing }) {
    const navigation = useNavigation();
    const { isLoggedIn, getToken } = useToken();
    const [loading, setLoading] = useState(true); // New loading state

    // Fetch token on screen focus
    useEffect(() => {
        const fetchTokenOnFocus = async () => {
            setLoading(true);
            await getToken();
            setLoading(false);
        };

        const unsubscribe = navigation.addListener('focus', fetchTokenOnFocus);
        fetchTokenOnFocus(); // Also call on initial mount

        return () => unsubscribe();
    }, [navigation]);

    // Re-check token every 30 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            await getToken();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle='dark-content' />
            {isHeaderShow && <Header />}

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
                contentContainerStyle={styles.childContainer}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={typeof refreshing === 'function' ? false : refreshing}
                            onRefresh={() => {
                                if (typeof refreshing === 'function') {
                                    refreshing();
                                }
                                if (onRefresh) {
                                    onRefresh();
                                }
                            }}
                            colors={['#0066cc']}
                        />
                    ) : null
                }
            >
                {children}
            </ScrollView>

            <Tabs />

            {/* Show loading indicator before showing Popup */}
            {!loading && !isLoggedIn && <Popup navigation={navigation} />}

            {loading && (
                <View style={styles.loadingContainer}>
                    <LottieView
                        source={require("../animations/loading.json")}
                        autoPlay
                        loop
                        style={styles.loadingAnimation}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    childContainer: {
        alignItems: 'center',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        flex: 1,
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingAnimation: {
        width: 200,
        height: 200,
    },
});
