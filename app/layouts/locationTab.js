import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import React from 'react';
import { MapPin } from 'lucide-react-native';

export default function LocationTab({ data }) {
    const renderContent = () => {


        if (!data?.address) {
            return (
                <View style={styles.centerContent}>
                    <MapPin color="#fff" size={20} />
                    <Text style={styles.locationText}>Doggy World is Best</Text>
                </View>
            );
        }

        const { area, city, postalCode, district } = data.address;
        const formattedAddress = [area, city, postalCode, district]
            .filter(Boolean)
            .join(', ');

        return (
            <View style={styles.locationInfo}>
                <MapPin color="#fff" size={20} />
                <Text style={styles.locationText} numberOfLines={1}>
                    {formattedAddress}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {renderContent()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#B32113',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    content: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    centerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
        flex: 1,
    },
    loadingText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
        opacity: 0.9,
    },
    errorText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
        opacity: 0.9,
    },
});