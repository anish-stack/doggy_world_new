import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import Product_Slider from '../Pet_Shop/_Shop/Product_Slider';
import DatePicker from '../Vaccination/DatePicker';

export default function PhysiotherapyDetails() {
    const route = useRoute();
    const { serviceId } = route.params || {};
    const [data, setData] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [appointmentDetails, setAppointmentDetails] = useState(null);

    const handleFormSubmit = (data) => {
        setAppointmentDetails(data);
        setIsModalOpen(false);
      };
   
    const fetchData = async () => {
        try {
            const res = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/physiotherapies?filters[documentId][$eq]=${serviceId}&populate=*`);
            setData(res.data.data[0] || {});
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [serviceId]);

    return (
        <View style={styles.container}>

            <ScrollView scrollEventThrottle={16} overScrollMode="never" decelerationRate="normal" showsVerticalScrollIndicator={false} >
                {/* Image Slider with "Popular" tag */}
                {data?.images?.length > 0 && (
                    <View style={styles.sliderContainer}>
                        <Product_Slider PassHeight={300} images={data.images} />
                        {data?.Popular && <View style={styles.popularTag}><Text style={styles.popularTagText}>Popular</Text></View>}
                    </View>
                )}

                {/* Service Title and Small Description */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>{data?.title}</Text>
                    <Text style={styles.smallDesc}>{data?.small_desc}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <View style={styles.priceDetails}>
                        <Text style={styles.discountPrice}>₹{data?.discount_price}/{data?.price_minute}</Text>
                        <Text style={styles.originalPrice}>₹{data?.price}/{data?.price_minute}</Text>
                    </View>
                    <View style={styles.bestPriceContainer}>
                        <Text style={styles.bestPriceText}>Best Price Compared to Others!</Text>
                    </View>
                </View>

                {/* Detailed Description */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.descriptionTitle}>Description</Text>
                    <Text style={styles.description}>{data?.Description}</Text>


                </View>
            </ScrollView>


            <TouchableOpacity style={styles.bookNowButton} onPress={() => setIsModalOpen(true)}>
                <Text style={styles.bookNowText}>Book Now</Text>
            </TouchableOpacity>

            <DatePicker
                isOpen={isModalOpen}
                vaccineItem={data}
                TypeOfBooking={'Clinic'}
                isPhysiotherapy={true}
                onClosed={() => setIsModalOpen(false)}
                onFormSubmit={handleFormSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 12,
        backgroundColor: '#f9f9f9',

    },
    sliderContainer: {
        position: 'relative',
    },
    popularTag: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#B32113',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        zIndex: 2,
    },
    popularTagText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    smallDesc: {
        fontSize: 16,
        color: '#777',
        marginTop: 10,
    },
    detailsContainer: {
        backgroundColor: '#fff',
        paddingVertical:12,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,

    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
     
    },
    priceDetails: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    discountPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#B32113',  // Highlighted discount price color
    },
    originalPrice: {
        fontSize: 16,
        textDecorationLine: 'line-through',  // Strikethrough to show original price
        color: '#888',  // Light grey for original price
        marginTop: 5,
    },
    bestPriceContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#17B169',  // Background color to make the message pop
        borderRadius: 15,
        padding: 8,

    },
    bestPriceText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',  // White text for visibility
    },
    bookNowButton: {
        position: 'absolute',
        bottom: 10,
        left: '10%',
        transform: [{ translateX: -25 }],
        backgroundColor: '#B32113',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
        alignItems: 'center',
        zIndex: 10,
        width: '100%',
        elevation: 10, 
    },
    bookNowText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },

});
