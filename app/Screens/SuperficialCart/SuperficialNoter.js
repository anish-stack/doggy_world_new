import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Animated, Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';

export default function SuperficialNoter({ isShow = false }) {
    const navigation = useNavigation();
    const { labTests, labTestsCount } = useSelector((state) => state.labCart);

    const [isVisible, setIsVisible] = useState(isShow);
    const slideUp = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.parallel([
                Animated.timing(slideUp, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideUp, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isVisible]);

    const handleClose = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setIsVisible(false));
    };

    return (
        <>
            {isVisible && (
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [
                                {
                                    translateY: slideUp.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [200, 0],
                                    }),
                                },
                            ],
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <View style={styles.content}>
                        <View style={styles.leftSection}>
                            <View style={styles.iconBadge}>
                                <Icon name="test-tube" size={24} color="#fff" />
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{labTestsCount}</Text>
                                </View>
                            </View>
                            <View style={styles.textContainer}>

                                <Text style={styles.subtitle}>Ready for checkout</Text>
                            </View>
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => navigation.navigate('labCart')}
                            >
                                <Text style={styles.viewButtonText}>View Cart</Text>
                                <Icon name="arrow-right" size={20} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleClose}
                            >
                                <Icon name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            )}

            {!isVisible && (
                <TouchableOpacity
                    style={styles.floatingButton}
                    onPress={() => setIsVisible(true)}
                    activeOpacity={0.9}
                >
                    <Icon name="test-tube" size={26} color="#EF4444" />
                    <View style={styles.floatingBadge}>
                        <Text style={styles.floatingBadgeText}>{labTestsCount}</Text>
                    </View>
                </TouchableOpacity>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: '4%',
        right: '4%',
        backgroundColor: '#B32113',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#6366F1',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1000,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBadge: {
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 12,
        borderRadius: 12,
        marginRight: 12,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 13,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    viewButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 8,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 70,
        right: 20,
        backgroundColor: '#fff',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
    },
    floatingBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        paddingHorizontal: 6,
    },
    floatingBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
