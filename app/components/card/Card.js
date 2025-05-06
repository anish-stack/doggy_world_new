import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Pressable,
    Image,
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Platform,
    Animated,
    Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_SIZE = Platform.OS === 'ios' ? 80 : 85;
const IMAGE_SIZE = Platform.OS === 'ios' ? 55 : 40;

export default function Card({ data }) {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    if (!data) {
        return (
            <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No Data Found</Text>
            </View>
        );
    }

    const navigationRoutes = {
        "Pet Bakery": "Bakery",
        "Consultation": "Consultation",
        "Pet Shop": "Pet_Shop",
        "Dog Grooming": "Grooming",
        "Physiotherapy": "Physiotherapy",
        "Vaccination": "vaccination",
        "Lab_Test": "Lab",
        "Pharmacy": "Coming_soon",
        "Coming_soon": "Coming_soon",
    };

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handleNavigation = () => {
        if (loading) return;

        setLoading(true);
        const route = navigationRoutes[data.route] || "Category_Screens";
        const params = route === "Category_Screens" ? { item: data.route } : undefined;
        navigation.navigate(route, params);

        setTimeout(() => {
            setLoading(false);
        }, 300);
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[
                styles.card,
                { transform: [{ scale: scaleAnim }] }
            ]}>
                {loading ? (
                    <ActivityIndicator size="small" color="#B32113" />
                ) : (
                    <Pressable
                        onPress={handleNavigation}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        style={({ pressed }) => [
                            styles.pressable,
                            Platform.OS === 'ios' && {
                                opacity: pressed ? 0.8 : 1
                            }
                        ]}
                        android_ripple={{
                            color: 'rgba(179, 33, 19, 0.1)',
                            borderless: true,
                            foreground: true
                        }}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: data.image.url }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                            {Platform.OS === 'ios' && (
                                <View style={styles.shine} />
                            )}
                        </View>
                    </Pressable>
                )}
            </Animated.View>
            <Text numberOfLines={data.title === 'Physiotherapy' ? 1 :2} style={styles.cardTitle} >
                {data.title || "Category Title"}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginHorizontal: 8,
        width: CARD_SIZE,
    },
    card: {
        width: CARD_SIZE - 20,
        height: CARD_SIZE - 20,
        backgroundColor: '#fff',
        borderRadius: CARD_SIZE / 2,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    pressable: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: CARD_SIZE / 2,
        overflow: 'hidden',
    },
    imageContainer: {
        width: IMAGE_SIZE - 5,
        height: IMAGE_SIZE - 5,

        overflow: 'hidden',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: IMAGE_SIZE / 2,
    },
    shine: {
        position: 'absolute',
        top: -20,
        left: -20,
        width: 40,
        height: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        transform: [{ rotate: '45deg' }],
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
        paddingHorizontal: 4,
        ...Platform.select({
            ios: {
                letterSpacing: -0.3,
            },
        }),
    },
    noDataContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        margin: 8,
    },
    noDataText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '500',
    },
});
