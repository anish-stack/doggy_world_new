import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import UpperLayout from '../../layouts/UpperLayout';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome'
import Product_Slider from '../Pet_Shop/_Shop/Product_Slider';
import { useRoute } from '@react-navigation/native';
const Lab_Clinic = ({ navigation }) => {
    const route = useRoute()
    const { type } = route.params
    const [clinics, setClinics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClinic, setSelectedClinic] = useState({
        id: '',
        ScanTestAvailable: false
    });
    const [lastClickedIndex, setLastClickedIndex] = useState(null);
    const fetchClinics = async () => {
        try {
            const response = await axios.get('https://admindoggy.adsdigitalmedia.com/api/clinics?populate=*');
            setClinics(response.data.data);
        } catch (error) {
            console.error('Error fetching clinics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinics();
    }, []);

    const handleCardPress = (index, clinicId, ScanTestAvailable) => {
        if (lastClickedIndex === index) {
            // Prevent toggle if already selected
            if (selectedClinic.id === clinicId) {
                return; // Do nothing if the card is already selected
            }
            // Otherwise, update the selected card
            setSelectedClinic({ id: clinicId, ScanTestAvailable });
        } else {
            // Update last clicked index if it's a new click
            setLastClickedIndex(index);
            setSelectedClinic({ id: clinicId, ScanTestAvailable });
        }
    };

    const sortedClinics = clinics.sort((a, b) => {

        return (a.Position || 0) - (b.Position || 0);
    });
    const renderClinicCard = ({ item, index }) => {

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.card, selectedClinic.id === item.documentId && styles.selectedCard]}
                onPress={() => handleCardPress(index, item.documentId, item.ScanTestAvailable)}
            >
                {item?.images?.length > 0 && <Product_Slider PassHeight={180} images={item.images} />}


                <Text style={styles.rating}> {item.Rating || 'N/A'}✨</Text>
                <View style={styles.cardContent}>
                    <View style={styles.row}>
                        <Text style={styles.clinicName}>{item.clinic_name}</Text>
                        <View style={styles.iconcontainer}>
                            <TouchableOpacity onPress={() => Linking.openURL(item.Map_Location)} style={styles.iconName}><Icon size={28} style={styles.iconText} color={'#fff'} name="map-marker" /></TouchableOpacity>
                        </View>
                    </View>
                    <Text numberOfLines={2} style={styles.details}>{item.time}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const handleNextPress = () => {
        if (selectedClinic) {

            navigation.navigate('TestPage', { clinicId: selectedClinic.id, ScanTestAvailable: selectedClinic.ScanTestAvailable, type: type });
        } else {
            alert('Please select a clinic first!');
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#b32131" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <UpperLayout title="Choose your Clinic" isBellShow={false} />
            <FlatList
                data={sortedClinics}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderClinicCard}

                contentContainerStyle={styles.list}
            />
            <TouchableOpacity
                style={[styles.nextButton, !selectedClinic && styles.disabledButton]}
                onPress={handleNextPress}
                disabled={!selectedClinic}
            >
                <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    rating: {
        alignContent: 'center',
        position: 'absolute',
        top: 0,
        color: 'black',
        borderRadius: 22,
        backgroundColor: 'rgba(255, 252, 253,1)',
        paddingVertical: 5,
        paddingHorizontal: 10,
        minWidth: 45,
        textAlign: 'center',
        alignSelf: 'start',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 10,
        flex: 1,
        elevation: 5,
        shadowColor: '#b32131',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    selectedCard: {
        borderWidth: 2,
        borderColor: '#b32131',
        elevation: 8,
    },
    image: {
        width: '100%',
        height: 180,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    cardContent: {
        padding: 12,
    },
    clinicName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    details: {

        fontSize: 13,
        color: '#555',
        marginBottom: 4,
    },
    nextButton: {
        backgroundColor: '#B32113',
        paddingVertical: 8,
        borderRadius: 30,
        margin: 10,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#9e6c71',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    iconText: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconName: {
        position: 'absolute',
        width: 40,
        // padding:4,
        right: 0,
        height: 40,
        borderRadius: 22, // Circular shape
        backgroundColor: '#b32131',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#b32131',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        textAlign: 'center',
    },

});

export default Lab_Clinic;
