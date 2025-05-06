import { View, Text, Dimensions, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import UpperLayout from '../../layouts/UpperLayout'
import axios from 'axios'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/FontAwesome'

const { width, height } = Dimensions.get('window')

export default function TestPage() {
    const navigation = useNavigation()
    const [selectedTest, setSelectedTest] = useState([])
    const [mainBranch, setMainBranch] = useState([])
    const [popularTest, setPopularTest] = useState([])
    const [normalTest, setNormalTest] = useState([])
    const [catTests, setCatTests] = useState([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const route = useRoute()

    const { clinicId, type, ScanTestAvailable } = route.params || {}

    const fetchMainBranchTest = async () => {
        try {
            const { data } = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[is_available_at_main_branch][$eq]=true`)
            setMainBranch(data.data || [])
        } catch (error) {
            console.log(error)
        }
    }

    const fetchPopularTest = async () => {
        setLoading(true)
        try {
            const { data } = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[isPopular][$eq]=true&filters[clinics][documentId][$eq]=${clinicId}`)
            setPopularTest(data.data || [])
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    }

    const fetchOtherTest = async () => {
        setLoading(true)
        try {
            const { data } = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[common_disease_dog][$eq]=true&filters[isPopular][$eq]=false&filters[clinics][documentId][$eq]=${clinicId}`)
            setNormalTest(data.data || [])
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    }

    const fetchOtherTestForcat = async () => {
        setLoading(true)
        try {
            const { data } = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[common_disease_cat][$eq]=true&filters[isPopular][$eq]=false&filters[clinics][documentId][$eq]=${clinicId}`)
            setCatTests(data.data || [])
            setLoading(false)
        } catch (error) {
            setLoading(false)
            console.log(error)
        }
    }

    useEffect(() => {
        fetchMainBranchTest()
        fetchPopularTest()
        fetchOtherTest()
        fetchOtherTestForcat()
    }, [clinicId])

 

    const handleTestSelection = (testId, types, isUltraSound) => {
        navigation.navigate('TestSelection', { Test: testId, typeOfTest: type,petType:types, ClinicId: clinicId,isUltraSound })
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#b32113" />
            </View>
        )
    }


    return (
        <>
            <UpperLayout title={'Available Test'} isBellShow={false} />
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.bottom}>
                    <View style={styles.popularContainer}>
                        <Text style={styles.popularText}>Our Popular Test For Both Dog & Cat</Text>
                        <ScrollView horizontal>
                            {popularTest.map((test, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleTestSelection(test.documentId, 'popular')}
                                    style={[styles.testItem, selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'popular') && styles.selectedTestItem]}
                                >
                                    {selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'popular') && (
                                        <Text style={styles.tag}>Selected</Text>
                                    )}
                                    <Image source={{ uri: test.Sample_Image.url }} style={styles.PopularImages} />
                                    <Text>{test.test_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Main Branch Test Section */}
                    {type === 'Sample Collection At Home' || ScanTestAvailable === false ? null : (
                        <View style={styles.popularContainer}>
                            <Text style={styles.mainBranchText}>Scans And Imaging Test For Both Dog & Cat</Text>
                            <ScrollView horizontal>
                                {mainBranch.map((test, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleTestSelection(test.documentId, 'mainBranch', test.test_name === 'Ultrasound' ? true : false)}
                                        style={[styles.testItem, selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'mainBranch') && styles.selectedTestItem]}
                                    >
                                        {selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'mainBranch') && (
                                            <Text style={styles.tag}>Selected</Text>
                                        )}
                                        <Image source={{ uri: test.Sample_Image.url }} style={styles.PopularImages} />
                                        <Text>{test.test_name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Tests for Dogs */}
                    <View style={styles.AvailableContainer}>
                        <Text style={styles.mainBranchText}>Common Disease Test For Dog</Text>
                        <View style={styles.testsGrid}>
                            {normalTest.map((test, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleTestSelection(test.documentId, 'dog')}
                                    style={[styles.AvailabletestItem, selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'dog') && styles.selectedTestItem]}
                                >
                                    {selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'dog') && (
                                        <Text style={styles.tag}>Selected</Text>
                                    )}
                                    <Image source={{ uri: test.Sample_Image.url }} style={styles.AvailableImages} />
                                    <Text style={styles.testName}>{test.test_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Tests for Cats */}
                    <View style={styles.AvailableContainer}>
                        <Text style={styles.mainBranchText}>Common Disease Test For Cat</Text>
                        <View style={styles.testsGrid}>
                            {catTests.map((test, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleTestSelection(test.documentId, 'cat')}
                                    style={[styles.AvailabletestItem, selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'cat') && styles.selectedTestItem]}
                                >
                                    {selectedTest.some(selTest => selTest.testId === test.documentId && selTest.type === 'cat') && (
                                        <Text style={styles.tag}>Selected</Text>
                                    )}
                                    <Image source={{ uri: test.Sample_Image.url }} style={styles.AvailableImages} />
                                    <Text style={styles.testName}>{test.test_name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {selectedTest.length > 0 && (
                <TouchableOpacity style={styles.ButtonBook}>
                    <TouchableOpacity onPress={() => navigation.navigate('next-step_booking_lab', { selectedTests: selectedTest, clinicId, type })} style={styles.button}>
                        <Text style={styles.buttonText}>Book Now <Icon name='calendar' color={'#fff'} size={16} /> </Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}
        </>
    )
}



const styles = StyleSheet.create({

    popularContainer: {
        marginTop: 10,
        paddingHorizontal: 16,
    },
    popularText: {
        alignSel: "center",

        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    testItem: {
        marginRight: 16,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 10,
        padding: 8,
    },
    PopularImages: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
        borderRadius: 8,
        marginBottom: 8,
    },
    AvailableContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    popularText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    testsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    AvailabletestItem: {
        width: width / 3.4,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    AvailableImages: {
        width: '100%',
        height: 70,
        resizeMode: 'contain',
        borderRadius: 8,

    },
    testName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
    },
    selectedTestItem: {
        borderWidth: 2,
        borderColor: '#B32113',
    },
    tag: {
        overflow: 'hidden',
        position: 'absolute',
        top: -5,
        zIndex: 9999,
        right: 0,
        width: 50,
        height: 20,
        backgroundColor: '#B32113',
        color: '#fff',
        padding: 4,
        borderRadius: 12,
        fontSize: 10,
        fontWeight: '600',
        alignSelf: 'start',
        textAlign: 'center',
    },
    ButtonBook: {

        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',

    },

    button: {
        backgroundColor: '#B32113',
        borderRadius: 8,
        width: width,
        paddingVertical: 12,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },

    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    mainBranchText: {
        alignSel: "center",
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    }
})