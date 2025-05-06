import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Vibration, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import UpperLayout from '../../../layouts/UpperLayout';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Product_Slider from './Product_Slider';
import Icon from 'react-native-vector-icons/AntDesign';
import { AddingFailure, AddingStart, AddingSuccess } from '../../../redux/slice/cartSlice';
import PolicyCards from './Policy_cards';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');

export default function Dynamic_Details_Shop() {
    const route = useRoute();
    const { title, id } = route.params || {};
    const dispatch = useDispatch()

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVariants, setSelectedVariants] = useState({
        price: 0,
        disc_price: 0,
        size: '',
        off_dis_percentage: 0,
    });
    const navigataion = useNavigation()

    const allOutOfStock = product?.isVarient
        ? product?.Variants_price?.every(item => !item?.in_stock)
        : (product?.isOutOfStock ?? false);

    const fetchProduct = async () => {
        try {
            const res = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/pet-shop-products/${id}?populate=*`);
            setProduct(res.data.data);

        } catch (error) {
            setError('Failed to load product details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (product?.Variants_price?.length > 0) {
            setSelectedVariants({
                price: product.Variants_price[0].price,
                disc_price: product.Variants_price[0].disc_price,
                size: product.Variants_price[0].size,
                off_dis_percentage: product.Variants_price[0].off_perce,
            });
        }
    }, [product]);

    const handleAddToCart = async (item) => {

        const price = {};
        const isVarientTrue = item.isVarient;

        if (isVarientTrue) {
            price.price = selectedVariants.price;
            price.disc_price = selectedVariants.disc_price;
            price.off_dis_percentage = selectedVariants.off_dis_percentage;
        } else {
            price.price = item.Price;
            price.disc_price = item.Disc_Price;
            price.off_dis_percentage = item.Discount_Percentage;
        }


        try {
            dispatch(AddingStart());
            const newItem = {
                ProductId: item.documentId,
                title: item.Title,
                isPetShopProduct: true,
                quantity: 1,
                varientSize: selectedVariants?.size,
                Pricing: price,
                image: item.Images[0]?.url,
                isVarientTrue: isVarientTrue,

            };


            dispatch(AddingSuccess({
                Cart: [newItem],
            }));

            Vibration.vibrate(150)
            navigataion.navigate('cart')
        } catch (error) {
            dispatch(AddingFailure(error.message));
        }
    };


    const handleSelect = (price, size, discount_price, off_dis_percentage) => {
        setSelectedVariants({
            price,
            size,
            disc_price: discount_price,
            off_dis_percentage,
        })
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, paddingBottom: 20 }}>
            <UpperLayout title={title?.substring(0, 15) + '...'} isBellShow={false} />

            <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} contentContainerStyle={styles.container}>

                {product?.Images?.length > 0 && <Product_Slider images={product.Images} />}

                <Text style={styles.title} numberOfLines={2}>
                    {product?.Title}
                </Text>
                <View style={styles.tagContainer}>
                    <Text style={styles.tag}>{product?.Tag}</Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.9} style={styles.favoriteIcon}>
                    <Icon name="hearto" size={22} color="#d64444" />
                </TouchableOpacity>
                <View style={styles.priceAndButton}>
                    <View style={styles.priceInfo}>

                        {product?.isVarient === true && (
                            <>
                                <View style={styles.priceSection}>
                                    <Text style={styles.bigPrice}>₹{selectedVariants?.disc_price}</Text>
                                    <Text style={styles.SmallPrice}>₹{selectedVariants?.price}</Text>
                                    <Text style={styles.off}>{selectedVariants?.off_dis_percentage}% off</Text>

                                </View>


                            </>

                        )}


                        {product?.isVarient === false && (

                            <View style={styles.priceSection}>
                                <Text style={styles.bigPrice}>₹{product?.Disc_Price}</Text>
                                <Text style={styles.SmallPrice}>₹{product?.Price}</Text>
                                <Text style={styles.off}>{product?.Discount_Percentage}% off</Text>

                            </View>
                        )}
                    </View>
                    <View style={styles.addButton}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => handleAddToCart(product)}
                            style={[styles.btn, allOutOfStock && styles.disabledButton]}
                            disabled={allOutOfStock}
                        >
                            <Text style={[styles.addCartText, allOutOfStock && styles.disabledText]}>
                                {allOutOfStock ? 'Out Of Stock' : 'Buy Now'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {product?.isVarient === true && (
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        <View style={styles.variantSection}>
                            {product?.Variants_price?.map((item, index) => {
                                const isSelected = selectedVariants?.price === item.price;
                                const isOutOfStock = !item.in_stock;

                                return (
                                    <TouchableOpacity
                                        onPress={() => !isOutOfStock && handleSelect(item.price, item.size, item.disc_price, item.off_perce)}
                                        key={index}
                                        style={[
                                            styles.variantButton,
                                            isSelected && styles.selectedVariant,
                                            isOutOfStock && styles.disabledVariant, // Apply disabled style
                                        ]}
                                        disabled={isOutOfStock} // Disable if out of stock
                                    >
                                        <Text
                                            style={[
                                                styles.variantText,
                                                isSelected && styles.selectedVariantText,
                                                isOutOfStock && styles.outOfStockText, // Change text color for out of stock
                                            ]}
                                        >
                                            {item.size} - {item.flavour || "No Flavour"} - {item.price ? `₹${item.price}` : 'Price Unavailable'}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.variantDiscount,
                                                isSelected && styles.selectedVariantDiscount,
                                            ]}
                                        >
                                            {item.disc_price ? `Discounted Price: ₹${item.disc_price}` : 'No Discount'}
                                        </Text>

                                        {isOutOfStock && (
                                            <View style={styles.outOfStockBadge}>
                                                <Text style={styles.outOfStockBadgeText}>Out of Stock</Text>
                                            </View>
                                        )}

                                        {isSelected && !isOutOfStock && <Text style={styles.selectedTag}>Selected</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}

                <PolicyCards Free_Delivery={product?.Free_Delivery} Exchange_policy={product?.Exchange_policy} COD_AVAILABLE={product?.COD_AVAILABLE} />


                <View>
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Product Description</Text>
                        <Text style={styles.descriptionText}>{product?.Descrption}</Text>
                    </View>
                </View>
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    bg: {
        backgroundColor: '#fff',
        paddingHorizontal: 10,
    },
    imageContainer: {
        paddingHorizontal: 8,
        marginTop: 20,
        width: width * 0.95,
        height: 300,
        marginBottom: 20,
        borderRadius: 10,
        overflow: 'hidden',

    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    detailsContainer: {
        marginTop: 20,
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    smallDesc: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
    },
    suitableFor: {
        fontSize: 14,
        color: '#777',
        marginBottom: 15,
    },
    categoryLink: {
        marginBottom: 15,
    },
    categoryText: {
        fontSize: 16,
        color: '#B21133',
        fontWeight: 'bold',
    },
    variantSection: {
        marginTop: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 0,
    },
    variantButton: {
        margin: 5,
        padding: 15,
        borderRadius: 10,
        backgroundColor: 'rgba(179, 33, 19, 0.1)',
        borderWidth: 1,
        borderColor: '#ccc',
        alignItems: 'center',

        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    },
    variantText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
    },
    variantDiscount: {
        fontSize: 12,
        color: '#ff4d4d',
        marginTop: 5,
        textAlign: 'center',
    },
    selectedVariant: {
        borderColor: '#0d6efd',
        backgroundColor: '#e7f1ff',
    },
    selectedVariantText: {
        color: '#003873',
    },
    selectedVariantDiscount: {
        color: '#003873',
    },
    selectedTag: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#ff4d4d',
        color: '#fff',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 8,
        fontSize: 10,
        fontWeight: 'bold',
        overflow: 'hidden',
    },
    priceSection: {
        display: 'flex',
        marginBottom: 0,
        gap: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceAndButton: {
        marginTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',

    },
    gram: {
        fontSize: 10,
        color: '#111',
        fontWeight: 'bold',
    },
    bigPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 2,
    },
    SmallPrice: {
        textDecorationLine: 'line-through',
        fontSize: 14,
        color: '#777',
        marginBottom: 2,
    },
    btn: {
        backgroundColor: '#DA291C',
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderRadius: 5,
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addCartText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        borderRadius: 5,
        textAlign: 'center',
    },
    off: {
        backgroundColor: '#DA291C',
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderRadius: 5,

        color: '#fff',
        marginBottom: 5,
        fontSize: 10,
        fontWeight: 'bold',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 10,

    },
    tagContainer: {
        backgroundColor: '#d64444',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 15,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    tag: {
        fontSize: 12,
        color: '#fff',
    },
    favoriteIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    heading: {
        marginVertical: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginHorizontal: 12,
        marginBottom: 10,
    },
    headingLevel6: {
        fontSize: 18,
    },
    listContainer: {
        marginTop: 10,
    },
    listItem: {
        fontSize: 14,
        color: '#333',
        marginVertical: 5,
        paddingLeft: 10,
    },
    paragraph: {
        fontSize: 16,
        color: '#333',
        marginVertical: 5,
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    underline: {
        textDecorationLine: 'underline',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
    },
    link: {
        color: '#0d6efd',
        textDecorationLine: 'underline',
    },
    codeBlock: {
        fontFamily: 'monospace',
        backgroundColor: '#f4f4f4',
        padding: 10,
        borderRadius: 5,
        color: '#d6336c',
        marginVertical: 5,
    },
    bt: {
        backgroundColor: '#F5F6F7',
        marginTop: 20,
        height: 10,

        width: '100%',

    },
    descriptionContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f8f8f8',


    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        textAlign: 'justify',
    },
    outOfStockText: {
        color: "#aaa",
    },
    outOfStockBadge: {
        position: "absolute",
        top: 5,
        right: 5,
        backgroundColor: "#f44336",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    outOfStockBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    disabledVariant: {
        backgroundColor: "#f0f0f0",
        borderColor: "#ccc",
    },
    disabledButton: {
        backgroundColor: "#ccc",
    },
    disabledText: {
        fontSize: 14,
        color: "#888",
    },

});
