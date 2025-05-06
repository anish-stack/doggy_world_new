import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import styles from './Styls';
import { FontAwesome } from '@expo/vector-icons';

export default function ClinicCard({ clinic, selected, onSelect, test }) {
    const isAnyTestIsUltra = test.some((item) => item.isUltraSound);

    if (isAnyTestIsUltra && clinic.documentId !== 'r9qel0puc15klzfz7rj3mra9') {
        return null;
    }
    return (

        <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.clinicCard, selected && styles.selectedClinicCard]}
            onPress={() => onSelect(clinic)}
        >
            <View style={styles.clinicHeader}>
                <Text style={styles.clinicName}>{clinic.clinic_name}</Text>
                <View style={styles.ratingContainer}>
                    <FontAwesome name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{clinic.Rating}</Text>
                </View>
            </View>
            <Text style={styles.clinicAddress}>{clinic.Address}</Text>
            <Text style={styles.clinicTime}>{clinic.time}</Text>
        </TouchableOpacity>

    )
}