import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import UpperLayout from '../../../../layouts/UpperLayout';
import axios from 'axios';
import DynmaicSlider from './DynamicSlider';
import Card from '../Categories/Card';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window'); // Get screen width

export default function DynamicScreen({ Product, isSliderShow = true }) {


    const route = useRoute();
    const { title } = route.params;
    const [data, setData] = useState([]);
    const [slider, setSlider] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.get('https://admindoggy.adsdigitalmedia.com/api/products?populate=*');
                const fetchSliderData = await axios.get('https://admindoggy.adsdigitalmedia.com/api/bakery-sliders?populate=*');
                const fetchedData = res.data.data;
                const fetchSlider = fetchSliderData.data.data;
                let filteredData
                if (title) {

                    filteredData = fetchedData.filter(
                        (item) => item.catgory?.titile === title
                    );
                } else {
       
                    filteredData = fetchedData.filter(
                        (item) => item.catgory?.titile === Product
                    );
                }

                const filteredSliderData = fetchSlider.filter(
                    (item) => item.category?.titile === title || Product
                );
                setSlider(filteredSliderData);
                setData(filteredData);
            } catch (err) {
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [title, Product]);

    const imageSent = slider
        .map((item) => item.images)
        .flat()
        .filter((image) => image.url)
        .map((image) => image.url);

    const images = [{ id: 1, src: imageSent }];

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#003873" />
                <Text style={styles.loaderText}>Loading {title}...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                {isSliderShow && (

                    <UpperLayout title={title} />
                )}
                <ScrollView>
                    {isSliderShow && (

                        <DynmaicSlider navigationShow={true} autoPlay={true} Dealy={3000} isUri={true} imagesByProp={images} />
                    )}
                    {data && data.length > 0 ? (
                        <FlatList
                            data={data}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => <Card data={item} cardWidth={width * 0.45} />}
                            numColumns={2}
                            contentContainerStyle={styles.cardList}
                        />
                    ) : (
                        <Text style={styles.noData}>No products found in {title} category.</Text>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loaderText: {
        marginTop: 10,
        fontSize: 16,
        color: '#003873',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    error: {
        color: '#f44336',
        textAlign: 'center',
        fontSize: 16,
    },
    noData: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#999999',
    },
    cardList: {
        paddingHorizontal: 10,
    },
});

