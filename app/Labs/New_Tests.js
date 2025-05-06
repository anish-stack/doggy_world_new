import { View, Text, ActivityIndicator, FlatList, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import axios from 'axios';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import UpperLayout from '../layouts/UpperLayout';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tabs from '../layouts/Tabs';

const { width } = Dimensions.get('window');

export default function NewTests() {
    const [loading, setLoading] = useState(false);
    const [allTests, setAllTests] = useState([]);
    const [dogTests, setDogTests] = useState([]);
    const [catTests, setCatTests] = useState([]);
    const [branchTests, setBranchTests] = useState([]);
    const [popularTests, setPopularTests] = useState([]);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const navigation = useNavigation()
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [
                    allResponse,
                    dogResponse,
                    catResponse,
                    branchResponse,
                    popularResponse,
                ] = await Promise.all([
                    axios.get('https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*'),
                    axios.get('https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[common_disease_dog][$eq]=true&filters[isPopular][$eq]=false'),
                    axios.get('https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[common_disease_cat][$eq]=true&filters[isPopular][$eq]=false'),
                    axios.get('https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[is_available_at_main_branch][$eq]=true'),
                    axios.get('https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[isPopular][$eq]=true'),
                ]);

                setAllTests(allResponse.data.data);
                setDogTests(dogResponse.data.data);
                setCatTests(catResponse.data.data);
                setBranchTests(branchResponse.data.data);
                setPopularTests(popularResponse.data.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    const handleTestSelection = (testId, types, isUltraSound) => {
        navigation.navigate('TestSelection', { Test: testId, typeOfTest: types, isUltraSound })
    }

    const renderTestItem = ({ item }) => (
        <TouchableOpacity
            style={styles.testCard}
            activeOpacity={0.9}
            onPress={() => handleTestSelection(item.documentId, selectedCategory, selectedCategory === 'branch' ? true : false)}
        >
            <Image
                source={{ uri: item.Sample_Image?.url || 'https://via.placeholder.com/150' }}
                style={styles.testImage}
            />
            <View style={styles.testInfo}>
                <Text style={styles.testName} numberOfLines={1}>{item.test_name}</Text>
                <View style={styles.testDetails}>
                    <Icon name="science" size={scale(16)} color="#666" />
                    <Text style={styles.testType}>Lab Test</Text>
                </View>
            </View>
        </TouchableOpacity>
    );


    const renderCategories = () => (
        <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
                { id: 'all', title: 'All Tests', icon: 'science' },
                { id: 'dog', title: 'Dog Tests', icon: 'pets' },
                { id: 'cat', title: 'Cat Tests', icon: 'pets' },
                { id: 'branch', title: 'Imaging Test', icon: 'location-on' },
                { id: 'popular', title: 'Popular', icon: 'star' }
            ]}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={[styles.categoryButton, selectedCategory === item.id && styles.selectedCategory]}
                    onPress={() => setSelectedCategory(item.id)}
                    activeOpacity={0.8}
                >
                    <Icon
                        name={item.icon}
                        size={scale(24)}
                        color={selectedCategory === item.id ? "#fff" : "#EC4C3C"}
                    />
                    <Text
                        style={[
                            styles.categoryText,
                            selectedCategory === item.id && styles.selectedCategoryText
                        ]}
                    >
                        {item.title}
                    </Text>
                </TouchableOpacity>
            )}
            style={styles.categoryList}
            contentContainerStyle={styles.categoryContainer}
        />
    );

    if (loading) {
        return (
            <Layout>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#EC4C3C" />
                    <Text style={styles.loadingText}>Loading Tests...</Text>
                </View>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <View style={styles.centered}>
                    <Icon name="error-outline" size={scale(50)} color="#EC4C3C" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </Layout>
        );
    }

    const getCurrentData = () => {
        switch (selectedCategory) {
            case 'dog': return dogTests;
            case 'cat': return catTests;
            case 'branch': return branchTests;
            case 'popular': return popularTests;
            default: return allTests;
        }
    };

    return (

        <Layout>

        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>

                <Text style={styles.mainHeading}>Laboratory Tests</Text>

                {renderCategories()}

                <FlatList
                    data={getCurrentData()}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderTestItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    numColumns={2}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="inbox" size={scale(50)} color="#ccc" />
                            <Text style={styles.emptyText}>No tests available</Text>
                        </View>
                    }
                    columnWrapperStyle={styles.columnWrapper}
                />
            </View>
          
        </SafeAreaView>
        </Layout>




    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 60,
        // backgroundColor: '#fff',
    },
    mainHeading: {
        fontSize: scale(16),
        fontWeight: 'bold',
        display: 'none',
        color: '#333',
        marginVertical: verticalScale(15),
        paddingHorizontal: scale(15),
    },
    categoryList: {
        maxHeight: verticalScale(50),
        minHeight: verticalScale(60),
    },
    categoryContainer: {
        backgroundColor: '#fff',

        paddingVertical: scale(5),
        paddingHorizontal: scale(15),
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: scale(15),
        paddingVertical: verticalScale(8),
        borderRadius: scale(25),
        marginRight: scale(10),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    selectedCategory: {
        backgroundColor: '#EC4C3C',
    },
    categoryText: {
        marginLeft: scale(5),
        color: '#EC4C3C',
        fontSize: scale(14),
        fontWeight: '600',
    },
    selectedCategoryText: {
        color: '#fff',
    },
    listContainer: {
        paddingHorizontal: scale(10),
        paddingBottom: verticalScale(20),
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    testCard: {
        marginTop: scale(10),
        backgroundColor: '#fff',
        borderRadius: scale(5),
        margin: scale(5),
        width: (width - scale(40)) / 2,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    testImage: {
        width: '100%',
        height: verticalScale(80),
        resizeMode: 'cover',
    },
    testInfo: {
        padding: scale(10),
    },
    testName: {
        fontSize: scale(14),
        fontWeight: '600',
        color: '#333',
        // marginBottom: verticalScale(5),
        height: verticalScale(25),
    },
    testDetails: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    testType: {
        fontSize: scale(12),
        color: '#666',
        marginLeft: scale(5),
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: verticalScale(10),
        color: '#666',
        fontSize: scale(14),
    },
    errorText: {
        color: '#EC4C3C',
        fontSize: scale(16),
        marginTop: verticalScale(10),
        textAlign: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(50),
    },
    emptyText: {
        color: '#666',
        fontSize: scale(14),
        marginTop: verticalScale(10),
    },
});