import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch } from 'react-redux';
import { AddingFailure, AddingStart, AddingSuccess } from '../../redux/slice/cartSlice';

export default function AdOns() {
    const [addons, setAddons] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch()
    // Fetch add-ons data
    const fetchAddons = async () => {
        setLoading(true);
        try {
            const response = await axios.get('https://admindoggy.adsdigitalmedia.com/api/ad-ons?populate=*');
            setAddons(response.data.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch add-ons.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddons();
    }, []);

    const handleAddToCart = async (item) => {
        console.log(item);


        const price = {};
        price.price = item.Price;
        price.disc_price = item.Discount_price;
        price.off_dis_percentage = item.off_dis_percentage;

    

        try {
            dispatch(AddingStart());
            const newItem = {
                ProductId: item.documentId,
                title: item.title,
                quantity: 1,
                Pricing: price,
                image: item.image?.url || 'https://your-default-image-url.com/default-image.jpg',
                isBakeryProduct: true,
                isVarientTrue: false,
            };

            dispatch(AddingSuccess({
                Cart: [newItem],
            }));

        } catch (error) {
            dispatch(AddingFailure(error.message));
        }
    };




    return (
        <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>You Might also like <Icon name='heart' color={'#F40009'} size={28} /> </Text>
            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.cardRow}>
                        {addons.map((item) => (
                            <View key={item.id} style={styles.cardContainer}>
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: item.image.url }} style={styles.image} />
                                </View>
                                <Text style={styles.tag}>{item.Tag}</Text>
                                <Text numberOfLines={2} style={styles.title}>{item.title.substring(0, 12) + '...'}</Text>

                                <View style={styles.priceContainer}>
                                    <Text style={styles.discountPrice}>₹{item.Discount_price}</Text>
                                    <Text style={styles.price}>₹{item.Price}</Text>
                                </View>
                                <TouchableOpacity
                                    activeOpacity={0.9} style={styles.addToCartButton} onPress={() => handleAddToCart(item)}>
                                    <Text style={styles.addToCartText}>Add to Cart</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        position: 'relative',
        backgroundColor: '#fff',
        marginRight: 10,
        padding: 10,
        borderRadius: 10,
        width: 120,
    },
    imageContainer: {
        width: 80,
        height: 60,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    title: {
        marginTop: 10,
        fontSize: 12,
        height: 20,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    smallDesc: {
        fontSize: 12,
        color: '#111',
        marginBottom: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    discountPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#D44B41',
        marginRight: 5,
    },
    price: {
        fontSize: 14,
        textDecorationLine: 'line-through',
        color: '#B32113',
    },
    addToCartButton: {
        backgroundColor: '#B32113',
        paddingVertical: 5,
        paddingHorizontal: 5,
        borderRadius: 5,
        alignItems: 'center',
    },
    addToCartText: {

        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
    },
    cardRow: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
    },
    tag: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#D44B41',
        padding: 4,
        borderRadius: 5,
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
