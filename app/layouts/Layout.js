import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from './Header';
import Tabs from './Tabs';
import Popup from '../components/PopUp/Popup';
import { useToken } from '../hooks/useToken';

export default function Layout({ children, isHeaderShow = true, onRefresh, refreshing }) {
    const navigation = useNavigation();
    const { isLoggedIn, getToken } = useToken();


    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getToken();
        });

        return () => {
            unsubscribe();
        };
    }, [navigation]);


    useEffect(() => {
        const interval = setInterval(() => {
            getToken();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return (

        <View style={styles.container}>
            {isHeaderShow && (
                <Header />
            )}

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
            {!isLoggedIn && <Popup navigation={navigation} />}
        </View>




    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    childContainer: {

        alignItems: 'center',
    },
});
