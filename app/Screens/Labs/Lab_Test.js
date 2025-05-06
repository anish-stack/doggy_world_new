import { View, Text, ActivityIndicator, Image, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import UpperLayout from '../../layouts/UpperLayout';
import DynmaicSlider from '../Services/Bakery/Dynamic_Screen/DynamicSlider';

const { width } = Dimensions.get('window');

export default function Lab_Test() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [slider, setSlider] = useState([]);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.get('https://admindoggy.adsdigitalmedia.com/api/collection-types?populate=*');
                const fetchSliderData = await axios.get('https://admindoggy.adsdigitalmedia.com/api/bakery-sliders?populate=*&filters[isLab][$eq]=true');
                setSlider(fetchSliderData.data.data);
                setData(res.data.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <ActivityIndicator size="large" color="#0000ff" />;
    if (error) return <Text>{error}</Text>;

    const images = slider.flatMap((item) => item.images ? item.images.map((image) => image.url) : []);
    const imagesSent = [{ id: 1, src: images }];

    return (
        <View style={{ flex: 1 }}>
            <UpperLayout title={'Lab Test Made Easy'} isBellShow={false} />
            <ScrollView>


                {images.length > 0 ? (
                    <DynmaicSlider navigationShow={true} heightPass={170} mode={'cover'} autoPlay={true} Dealy={3000} isUri={true} imagesByProp={imagesSent} />
                ) : (
                    <Text>No images available</Text>
                )}

                <View style={styles.mainRow}>
                    <View style={styles.row}>
                        <View style={styles.textContainer}>
                            <Text style={styles.heading}>Get Tested at Your Home in</Text>
                            <Text style={styles.time}>60 Minutes</Text>
                            <TouchableOpacity activeOpacity={0.8} style={styles.button}>
                                <Text style={styles.buttonText}>Book a Test</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.iconContainer}>
                            <Icon name='home' size={20} color="#00aaa9" />
                        </View>
                    </View>
                </View>

                {data && data.length > 0 ? (
                    data.map((item, index) => (
                        <TouchableOpacity activeOpacity={0.8} onPress={()=> navigation.navigate('lab_Clinic',{type:item.Title})} key={index} style={styles.cardContainer}>
                            {item.images && item.images.length > 0 ? (
                                <ScrollView horizontal style={{ marginVertical: 10 }}>
                                    {item.images.map((imageUrl, index) => (
                                        imageUrl.url ? (
                                            <Image
                                                key={index}
                                                source={{ uri: imageUrl.url }}
                                                style={styles.image}
                                            />
                                        ) : (
                                            <Text key={index}>Image not available</Text>
                                        )
                                    ))}
                                </ScrollView>
                            ) : (
                                <Text>No images available</Text>
                            )}
                            <Text style={styles.tag}>
                                {item.isAvailable ? `${item.Off_percentage}% Off ${item.tag}` : 'Service Not Available right Now'}
                            </Text>
                            <Text style={styles.title}>{item.Title}</Text>
                            <Text numberOfLines={2} style={styles.desc}>{item.small_desc}</Text>
                            <View style={styles.detailsRow}>

                                <Text style={styles.value}>Test's Starts From Only ₹ {item.start_from}</Text>
                            </View>

                            <View style={styles.detailsRow}>
                                <Text style={styles.value}>Our Timings: {item.Timeing}</Text>



                            </View>

                        </TouchableOpacity>
                    ))
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainRow: {
        backgroundColor: '#fff',
        padding: 10,
    },
    row: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        alignItems: 'start',
        backgroundColor: 'rgba(240, 240, 240,0.7)', // Background color
        padding: 14,
        borderRadius: 20,
    },
    textContainer: {
        flexDirection: 'column',
        gap: 7,
    },
    heading: {
        fontSize: 14,
        fontWeight: '700',
        color: '#003873',
    },
    time: {
        fontSize: 18,
        fontWeight: '800',
        color: '#b32113',
    },
    iconContainer: {
        marginTop: 14,
        width: 60,
        height: 60,
        borderRadius: 40,
        elevation: 2,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#000',
        padding: 6,
        borderRadius: 42,
        width: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    cardContainer: {
        backgroundColor: '#fff',
        marginVertical: 15,
        padding: 15,
        borderRadius: 10,
        elevation: 3,
        marginHorizontal: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
    },
    desc: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
    },
    detailsRow: {
        // backgroundColor:'##ffeacf',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom:2,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: '#b32113',
    },
    image: {
        width: 150,
        aspectRatio: 1.5,
        resizeMode: 'cover',
        objectFit: 'center',
        borderRadius: 10,
        height: 100,
        marginHorizontal: 10,
    },
    tag: {
        position: 'absolute',
        top: 0,
        left: 0,
        alignContent: 'center',
        zIndex: 99,
        transform: 'rotate(-5deg)',
        backgroundColor: '#B32113',
        color: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 'bold',
    },
});
