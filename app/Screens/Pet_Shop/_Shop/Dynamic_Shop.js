import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import UpperLayout from '../../../layouts/UpperLayout';
import { TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function Dynamic_Shop() {
    const route = useRoute();
    const { title, id } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const navigation = useNavigation()
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/pet-shop-categories?populate=*`);
                const resdata = response.data.data;

                const filterData = resdata.filter(item =>
                    item.petshops.some(petshop => petshop.documentId === id)
                );

                setData(filterData);
            } catch (err) {
                console.error(err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{flex:1 ,paddingBottom:40}}>
            <View style={styles.container}>
            <UpperLayout title={title} isBellShow={false} />
            <Text style={styles.heading}>Shop By <Text style={styles.headingTwo}>Categories</Text></Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
                {data.length > 0 ? (
                    <View style={styles.gridContainer}>
                        {data.sort((a, b) => a.postion - b.postion).map((item, index) => (
                            <TouchableOpacity
                                activeOpacity={0.9} onPress={() => navigation.navigate('Dynamic_Products_Shop', { id: item.documentId, heading: item.title })} key={index} style={styles.itemContainer}>
                                {item.image?.url ? (
                                    <Image
                                        source={{ uri: item.image.url }}
                                        style={styles.image}
                                    />
                                ) : (
                                    <View style={styles.placeholderImage} />
                                )}
                                <Text style={styles.itemTitle}>{item.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noData}>No matching data found.</Text>
                )}
            </ScrollView>
        </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollViewContent: {
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        justifyContent: 'start',
    },
    itemContainer: {
        padding: 14,
        width: (width - 40) / 3,
        marginBottom: 15,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 100,
        resizeMode: 'contain',
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    placeholderImage: {
        width: '100%',
        height: 100,
        resizeMode: 'contain',
        borderRadius: 10,
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
        textAlign: 'center',
    },
    noData: {
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
        marginTop: 20,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        padding: 10,
        textAlign: 'center',
    },
    headingTwo: {
        fontSize: 22,
        color: '#B32113',
        fontWeight: 'bold',
        padding: 10,
        textAlign: 'center',
    },
});
