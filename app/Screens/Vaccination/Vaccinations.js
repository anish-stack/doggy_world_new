import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Layout from '../../layouts/Layout';

const { width } = Dimensions.get('window');

export default function Vaccinations() {
    const [dataAll, setAllData] = useState([]);
    const [dogData, setDogData] = useState([]);
    const [CatData, setCatData] = useState([]);
    const [Packages, setPackages] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // Filter state
    const navigation = useNavigation();

    const fetchData = async () => {
        try {
            const response = await axios.get('https://admindoggy.adsdigitalmedia.com/api/vaccinations?populate=*');
            const data = response.data.data;
            const DogData = data.filter((item) => item.isDog === true);
            const CatData = data.filter((item) => item.isCat === true);
            const PackagesData = data.filter((item) => item.isPackage === true);

            setAllData(data);
            setDogData(DogData);
            setCatData(CatData);
            setPackages(PackagesData);
            setFilteredData(data);  // Set initial data to All
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Filter the data based on the selected filter
        if (filter === 'Dog') {
            setFilteredData(dogData);
        } else if (filter === 'Cat') {
            setFilteredData(CatData);
        } else if (filter === 'Packages') {
            setFilteredData(Packages);
        } else {
            setFilteredData(dataAll);  // Show All Data if 'All' filter is selected
        }
    }, [filter, dogData, CatData, Packages, dataAll]); // Add dataAll as dependency

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#B32113" />
                <Text style={styles.loadingText}>Loading Vaccinations...</Text>
            </View>
        );
    }

    return (
        <Layout>

            <ScrollView scrollEventThrottle={16} overScrollMode="never" decelerationRate="normal" showsVerticalScrollIndicator={false}>
                <View style={{ paddingBottom: 120 }}>
                    <ScrollView scrollEventThrottle={5} showsHorizontalScrollIndicator={false} horizontal={true}>
                        <View style={styles.filterContainer}>
                            <TouchableOpacity
                                style={[styles.filterButton, filter === 'All' && styles.activeFilter]}
                                onPress={() => setFilter('All')}
                            >
                                <Text style={[styles.filterText, filter === 'All' && styles.activeText]}>All</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterButton, filter === 'Dog' && styles.activeFilter]}
                                onPress={() => setFilter('Dog')}
                            >
                                <Text style={[styles.filterText, filter === 'Dog' && styles.activeText]}>Dog</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterButton, filter === 'Cat' && styles.activeFilter]}
                                onPress={() => setFilter('Cat')}
                            >
                                <Text style={[styles.filterText, filter === 'Cat' && styles.activeText]}>Cat</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.filterButton, filter === 'Packages' && styles.activeFilter]}
                                onPress={() => setFilter('Packages')}
                            >
                                <Text style={[styles.filterText, filter === 'Packages' && styles.activeText]}>Packages</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Conditional Rendering of Cards based on Filter */}
                    {filter !== 'Cat' && filter !== 'Dog' && (
                        <View style={styles.HeadingPhase}>
                            <Text style={styles.HeadingTitle}>Packages</Text>
                            <Text style={styles.HeadingTag}>Popular</Text>
                        </View>
                    )}
                    <ScrollView scrollEventThrottle={5} showsHorizontalScrollIndicator={false} horizontal={true}>
                        {filter !== 'Cat' && filter !== 'Dog' && Packages.length > 0 && (
                            Packages.map((pkg, index) => (
                                <View key={index}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('VaccineDetails', { id: pkg.documentId })}
                                        activeOpacity={0.7}
                                        style={styles.Card}
                                    >
                                        <Image source={{ uri: pkg.image?.url || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
                                        <View style={styles.cardContent}>
                                            <Text numberOfLines={1} style={styles.cardTitle}>{pkg.title}</Text>
                                            <Text style={styles.cardForage}>{pkg.forage}</Text>
                                            <View style={styles.priceContainer}>
                                                <Text style={styles.cardPrice}>₹{pkg.discount_price}</Text>
                                                <Text style={styles.cardStrikePrice}>₹{pkg.price}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {filter !== 'Cat' && filter !== 'Packages' && (
                        <View style={styles.HeadingPhase}>
                            <Text style={styles.HeadingTitle}>Vaccines For Dog</Text>
                        </View>
                    )}
                    <ScrollView scrollEventThrottle={5} showsHorizontalScrollIndicator={false} horizontal={true}>
                        {filter !== 'Cat' && filter !== 'Packages' && dogData.length > 0 && (
                            dogData.map((dog, index) => (
                                <View key={index}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('VaccineDetails', { id: dog.documentId })}
                                        activeOpacity={0.7}
                                        style={styles.Card}
                                    >
                                        <Image source={{ uri: dog.image?.url || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
                                        <View style={styles.cardContent}>
                                            <Text numberOfLines={1} style={styles.cardTitle}>{dog.title}</Text>
                                            <Text style={styles.cardForage}>{dog.forage}</Text>
                                            <View style={styles.priceContainer}>
                                                <Text style={styles.cardPrice}>₹{dog.discount_price}</Text>
                                                <Text style={styles.cardStrikePrice}>₹{dog.price}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {filter !== 'Dog' && filter !== 'Packages' && (
                        <View style={styles.HeadingPhase}>
                            <Text style={styles.HeadingTitle}>Vaccines For Cat</Text>
                        </View>
                    )}
                    <ScrollView scrollEventThrottle={5} showsHorizontalScrollIndicator={false} horizontal={true}>
                        {filter !== 'Dog' && filter !== 'Packages' && CatData.length > 0 && (
                            CatData.map((cat, index) => (
                                <View key={index}>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('VaccineDetails', { id: cat.documentId })}
                                        activeOpacity={0.7}
                                        style={styles.Card}
                                    >
                                        <Image source={{ uri: cat.image?.url || 'https://via.placeholder.com/150' }} style={styles.cardImage} />
                                        <View style={styles.cardContent}>
                                            <Text numberOfLines={1} style={styles.cardTitle}>{cat.title}</Text>
                                            <Text style={styles.cardForage}>{cat.forage}</Text>
                                            <View style={styles.priceContainer}>
                                                <Text style={styles.cardPrice}>₹{cat.discount_price}</Text>
                                                <Text style={styles.cardStrikePrice}>₹{cat.price}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </ScrollView>
        </Layout>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,

        backgroundColor: '#f9f9f9',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003873',
        textAlign: 'center',
        marginBottom: 5,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#555',
        fontSize: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 20,

    },
    filterButton: {
        backgroundColor: '#e0e0e0',
        paddingVertical: 6,
        paddingHorizontal: 36,
        marginHorizontal: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',

    },
    activeFilter: {
        backgroundColor: '#B32113',
        borderColor: '#B32113',
        elevation: 5,
    },
    filterText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
    },
    activeText: {
        color: '#fff',
        fontWeight: '700',
    },
    HeadingPhase: {
        elevation: 2,
        backgroundColor: '#fff',
        shadowColor: 'rgba(0, 0, 0,0.65)',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        marginBottom: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    HeadingTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#B32113',
        marginBottom: 5,
    },
    HeadingTag: {
        position: 'absolute',
        right: 0,
        bottom: 15,
        fontSize: 16,
        transform: 'rotate(10deg)',
        fontWeight: 'bold',
        backgroundColor: '#B32113',
        paddingHorizontal: 20,
        paddingVertical: 3,
        borderRadius: 42,
        color: '#fff',
        marginTop: 5,
        marginBottom: 10,
    },
    Card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        marginHorizontal: 10,
        elevation: 5,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        width: width * 0.55,
        overflow: 'hidden',
        marginBottom: 20,
    },
    cardImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    cardContent: {
        padding: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003873',
        marginBottom: 5,
    },
    cardForage: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    cardPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#B32113',
    },
    cardStrikePrice: {
        fontSize: 14,
        color: '#888',
        textDecorationLine: 'line-through',
    },
});
