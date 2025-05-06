import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Popup({ navigation }) {
    const [visible, setVisible] = useState(true);
    const fadeAnim = useMemo(() => new Animated.Value(0), []);

    // Simple fade animation
    React.useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const handleNavigation = (route) => {
        handleClose();
        // Delay navigation slightly to ensure smooth animation
        setTimeout(() => navigation.navigate(route), 100);
    };

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <SafeAreaView style={styles.content}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>

                <View style={styles.popup}>
                    <MaterialIcons name="pets" size={40} color="#E34234" />

                    <Text style={styles.title}>Welcome to Doggy Wold Care</Text>
                    <Text style={styles.subtitle}>Your pet healthcare partner</Text>

                    <View style={styles.features}>
                        {[
                            { icon: 'video-camera-front', text: 'Online Consultations' },
                            { icon: 'schedule', text: 'Best Doctors' },
                            { icon: 'local-pharmacy', text: 'Pet Medicine' },
                        ].map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <MaterialIcons name={feature.icon} size={24} color="#FA5F55" />
                                <Text style={styles.featureText}>{feature.text}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={() => handleNavigation('login')}
                        >
                            <Text style={styles.signInText}>Sign In</Text>
                            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => handleNavigation('register')}
                        >
                            <Text style={styles.createText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.terms}>
                        By continuing, you agree to our Terms of Service
                    </Text>
                </View>
            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: width,
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: -45,
        right: 0,
        backgroundColor: '#FFF',
        padding: 8,
        borderRadius: 20,
        zIndex: 1,
    },
    popup: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 24,
    },
    features: {
        width: '100%',
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    featureText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#4B5563',
    },
    buttons: {
        width: '100%',
        gap: 12,
        marginBottom: 16,
    },
    signInButton: {
        backgroundColor: '#E34234',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    signInText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    createButton: {
        backgroundColor: '#F3F4F6',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    createText: {
        color: '#4B5563',
        fontSize: 16,
        fontWeight: '600',
    },
    terms: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});