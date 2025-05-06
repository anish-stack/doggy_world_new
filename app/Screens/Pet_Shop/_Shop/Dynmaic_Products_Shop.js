import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, FlatList } from 'react-native';
import axios from 'axios';
import UpperLayout from '../../../layouts/UpperLayout'
import { useNavigation, useRoute } from '@react-navigation/native'
import DynmaicSlider from '../../Services/Bakery/Dynamic_Screen/DynamicSlider';
import Card_Shop from './Card_Shop';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Dynmaic_Products_Shop() {
  const route = useRoute()
  const { heading, id } = route.params || {}
  const [loading, setLoading] = useState(false);
  const [slider, setSlider] = useState(false);

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const navigation = useNavigation()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/pet-shop-products?populate=*`);
        const fetchSliderData = await axios.get('https://admindoggy.adsdigitalmedia.com/api/bakery-sliders?populate=*');
        const resdata = response.data.data;
        const fetchSlider = fetchSliderData.data.data;
        const filterData = resdata.filter(item =>
          item.category_foods.some(category_foods => category_foods.documentId === id)
        );

        const filteredSliderData = fetchSlider.filter(
          (item) => item.isPetShopProduct === true && item.pet_shop_category.documentId === id
        );

        setSlider(filteredSliderData)
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


  const imageSent = slider && slider.map((item) => item?.images).flat().filter((image) => image.url).map((image) => image.url);
  const images = [{ id: 1, src: imageSent }];

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#003873" />
        <Text style={styles.loaderText}>Loading {heading}...</Text>
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
    <SafeAreaView>
      <UpperLayout title={heading} isBellShow={false} />
      <ScrollView>
        <DynmaicSlider navigationShow={true} mode={'cover'} heightPass={230} autoPlay={true} Dealy={4500} isUri={true} imagesByProp={images} />
        {data && data.length > 0 ? (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <Card_Shop navigation={navigation} data={item} />}
            numColumns={2}
            contentContainerStyle={styles.cardList}
          />
        ) : (
          <Text style={styles.noData}>No products found in {heading} category.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fffe',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#003873',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef2f2',
  },
  error: {
    fontSize: 16,
    color: '#d64444',
    textAlign: 'center',
  },
  noData: {
    fontSize: 18,
    color: '#003873',
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  sliderContainer: {
    marginBottom: 15,
  },
  scrollView: {
    paddingHorizontal: 10,
    backgroundColor: '#f0fffe',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003873',
    marginVertical: 15,
    marginLeft: 10,
  },
  flatListContent: {
    paddingBottom: 20,
  },
});
