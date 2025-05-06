import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import axios from 'axios';
import Card from '../Services/Bakery/Categories/Card';

const { width } = Dimensions.get('window');

export default function AllProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setError(null); // Clear previous errors
                const response = await axios.get(
                    'https://admindoggy.adsdigitalmedia.com/api/products?populate=*'
                );
                setProducts(response.data.data); 
            } catch (err) {
                setError('Failed to fetch products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0d6efd" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <Card data={item} cardWidth={width * 0.45} />}
                numColumns={2}
                contentContainerStyle={styles.cardList}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
    
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    cardList: {
        paddingVertical: 5,
    },
});
