import { View, Text, ActivityIndicator, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DynmaicSlider from '../Services/Bakery/Dynamic_Screen/DynamicSlider';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function Physiotherapy() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [slider, setSlider] = useState([]);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get('https://admindoggy.adsdigitalmedia.com/api/physiotherapies?populate=*');
        const fetchSliderData = await axios.get('https://admindoggy.adsdigitalmedia.com/api/bakery-sliders?populate=*');

        const fetchedData = res.data.data;
        const fetchSlider = fetchSliderData.data.data;

        const filteredSliderData = fetchSlider.filter((item) => item.isPhysiotherapy === true);

        setSlider(filteredSliderData);
        setData(fetchedData);
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

  const images = slider.flatMap((item) => item.images).map((images) => images.url);
  const imagesSent = [{ id: 1, src: images }];

  return (
    <ScrollView>
      {/* Slider Component */}
      <DynmaicSlider
        navigationShow={true}
        heightPass={200}
        mode={'cover'}
        autoPlay={true}
        Dealy={3000}
        isUri={true}
        imagesByProp={imagesSent}
      />

      <Text style={styles.heading}>Physiotherapy For A Pets</Text>

      {/* Cards Section */}
      <View style={styles.cardContainer}>
        {data.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PhysiotherapyDetails', { serviceId: item.documentId })} 
          >
            <Image source={{ uri: item.images[0]?.url }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
              {/* <Text numberOfLines={2} style={styles.cardDesc}>{item.small_desc}</Text> */}
              <Text style={styles.cardPrice}>Start at @ {item.discount_price}/{item.price_minute}</Text>
            </View>
            <Text style={styles.cardBtn}>Book Now</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
    color: '#333',
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
    width: width / 2 - 20, // Two cards per row
    marginTop: 10,
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B32113',
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
    color: '#111',
    marginBottom: 10,
  },
  cardPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#802820',
  },
  cardBtn:{
    backgroundColor: '#B32113',
    padding:7,
    borderRadius: 4,
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',

  
  }
});
