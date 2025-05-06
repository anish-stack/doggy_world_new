import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/AntDesign';
const { width } = Dimensions.get('window')
export default function Card_Shop({ data, navigation }) {
    return (
        <TouchableOpacity
            activeOpacity={0.9} onPress={() => navigation.navigate('Dynamic_Details_Shop', { id: data?.documentId, title: data?.Title })} style={styles.cardContainer}>
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: data?.Images[0]?.url }}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.tagContainer}>
                <Text style={styles.tag}>{data?.Tag}</Text>
            </View>
            <Text numberOfLines={2} style={styles.title}>{data?.Title}</Text>

            {data.isVarient ? (
                <View style={styles.variantContainer}>

                    <View style={styles.priceContainer}>
                        <View style={styles.row}>
                            <Text style={styles.discountedPrice}>
                                ₹{data?.Variants_price[0]?.disc_price || 0}
                            </Text>
                            <Text style={styles.price}>
                                ₹{data?.Variants_price[0]?.price || 0}
                            </Text>

                        </View>
                        <TouchableOpacity>
                            <Text style={styles.variantText}>  <Icon name="shoppingcart" size={22} color="#d64444" /></Text>
                        </TouchableOpacity>
                    </View>

                </View>
            ) : (
                <View style={styles.priceContainer}>
                    <View style={styles.row}>
                        <Text style={styles.discountedPrice}>
                            ₹{data?.Disc_Price || 0}
                        </Text>
                        <Text style={styles.price}>
                            ₹{data?.Price || 0}
                        </Text>

                    </View>
                    <TouchableOpacity>
                        <Text style={styles.variantText}>  <Icon name="shoppingcart" size={22} color="#d64444" /></Text>
                    </TouchableOpacity>
                </View>
            )}
            <TouchableOpacity
                activeOpacity={0.9} style={styles.favoriteIcon}>
                <Icon name="hearto" size={22} color="#d64444" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        overflow: 'hidden',
        margin: 13,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: (width - 50) / 2,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    image: {
        width: '100%',
        height: 120,
        borderRadius: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#003873',
        marginBottom: 5,
    },
    tagContainer: {
        backgroundColor: '#b5e7e6',
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 15,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    tag: {
        fontSize: 12,
        color: '#003873',
    },
    variantContainer: {
        marginBottom: 10,

    },
    variantSize: {
        fontSize: 12,
        color: '#212529',
        marginBottom: 5,

    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',

        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: 7,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#999',
        textDecorationLine: 'line-through',
    },
    discountedPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#25d366',
    },
    favoriteIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
});
