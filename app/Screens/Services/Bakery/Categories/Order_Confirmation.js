import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function OrderConfirmation() {
    const route = useRoute();
    const navigation = useNavigation();
    const { data } = route.params || {};

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleWhatsApp = () => {
        const message = `Hi! I'd like to confirm my cake order #${data.id} for ${data.Caketitle}`;
        Linking.openURL(`https://wa.me/+919354122063?text=${encodeURIComponent(message)}`);
    };

    const handleCall = () => {
        Linking.openURL('tel:+919354122063');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Section with Image */}
                <Animated.View
                    entering={FadeInDown.duration(800)}
                    style={styles.heroSection}
                >
                    <Image
                        source={{ uri: 'https://i.ibb.co/MyxNWB9V/a-red-and-white-order-confirmation-image-butg-HCHe-SAOda-Ml-HGmhsow-NK2636dn-Tp6-Ua-BSz-WCo2t-A.jpg' }}
                        style={styles.heroImage}
                    />
                    <View style={styles.orderBadge}>
                        <Text style={styles.orderNumber}>Order #{data.id}</Text>
                    </View>
                </Animated.View>

                {/* Status Section */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(200)}
                    style={styles.statusSection}
                >
                    <View style={styles.statusIcon}>
                        <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                    </View>
                    <Text style={styles.statusTitle}>Order Confirmed!</Text>
                    <Text style={styles.statusMessage}>
                        Your delicious cake is being prepared with love
                    </Text>
                </Animated.View>

                {/* Order Details */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(400)}
                    style={styles.detailsCard}
                >
                    <Text style={styles.sectionTitle}>Order Details</Text>
                    <DetailItem icon="calendar" label="Delivery Date" value={formatDate(data.Delivery_Date)} />
                    <DetailItem icon="ice-cream" label="Cake" value={data.Caketitle} />
                    <DetailItem icon="color-palette" label="Design" value={data.Design} />
                    <DetailItem icon="restaurant" label="Flavour" value={data.flavour} />
                    <DetailItem icon="resize" label="Size" value={data.size} />
                    <DetailItem icon="pricetag" label="Price" value={`₹${data.price}`} />
                    <DetailItem icon="time" label="Status" value={data.Order_Stauts} />
                </Animated.View>

                {/* Contact Options */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(600)}
                    style={styles.contactSection}
                >
                    <Text style={styles.sectionTitle}>Need Help?</Text>
                    <View style={styles.contactButtons}>
                        <TouchableOpacity style={styles.contactButton} onPress={handleWhatsApp}>
                            <Ionicons name="logo-whatsapp" size={24} color="#4CAF50" />
                            <Text style={styles.contactButtonText}>WhatsApp</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
                            <Ionicons name="call" size={24} color="#8B0000" />
                            <Text style={styles.contactButtonText}>Call Us</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Bottom Button */}
                <Animated.View
                    entering={FadeInUp.duration(800).delay(800)}
                    style={styles.bottomSection}
                >
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Ionicons name="home" size={24} color="white" />
                        <Text style={styles.buttonText}>Return to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const DetailItem = ({ icon, label, value }) => (
    <View style={styles.detailItem}>
        <View style={styles.labelContainer}>
            <Ionicons name={icon} size={20} color="#8B0000" style={styles.icon} />
            <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {

        flex: 1,
        backgroundColor: '#fff',
    },
    heroSection: {
        height: 500,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    orderBadge: {
        position: 'absolute',
        bottom: -20,
        right: 20,
        backgroundColor: '#8B0000',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    orderNumber: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusSection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    statusIcon: {
        marginBottom: 10,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 5,
    },
    statusMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    detailsCard: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FFE4E4',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    detailItem: {
        marginBottom: 15,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    icon: {
        marginRight: 8,
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginLeft: 28,
    },
    contactSection: {
        padding: 20,
    },
    contactButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        width: '45%',
        justifyContent: 'center',
    },
    contactButtonText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    bottomSection: {
        padding: 20,
        paddingBottom: 30,
    },
    homeButton: {
        backgroundColor: '#8B0000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
});