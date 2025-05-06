import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import styles from './Styls'
import { FontAwesome } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

export default function EmpetyCart() {
    const navigation = useNavigation()
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.emptyCartContainer}>
                <Image
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2038/2038854.png' }}
                    style={styles.emptyCartImage}
                />
                <Text style={styles.emptyCartTitle}>Your Cart is Empty! 🐾</Text>
                <Text style={styles.emptyCartDescription}>
                    No tests or vaccinations scheduled yet for your furry friend
                </Text>

                <View style={styles.serviceContainer}>
                    <View style={styles.serviceCard}>
                        <FontAwesome name="flask" size={24} color="#3F51B5" />
                        <Text style={styles.serviceTitle}>Lab Tests</Text>
                        <Text style={styles.serviceText}>
                            Comprehensive health screenings for your pet
                        </Text>
                    </View>

                    <View style={styles.serviceCard}>
                        <FontAwesome name="medkit" size={24} color="#3F51B5" />
                        <Text style={styles.serviceTitle}>Vaccinations</Text>
                        <Text style={styles.serviceText}>
                            Essential shots to keep your pet healthy
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Lab')} style={styles.exploreButton}>
                    <Text style={styles.exploreButtonText}>Explore Services</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}