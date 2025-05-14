import { View, Text, ScrollView, Dimensions } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import BakeryCategories from './Categories/BakeryCategories';
import UpperLayout from '../../../layouts/UpperLayout';
import { useNavigation } from '@react-navigation/native';
import useGetBannersHook from '../../../hooks/GetBannersHook';
import ImageSlider from '../../../layouts/ImageSlider';

const { width } = Dimensions.get('window');
const PHONE_NUMBER = 'tel:9811299059';
const BANNER_TYPE = 'Pet Bakery';

export default function Bakery() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    const { fetchBanners, sliders } = useGetBannersHook();

    const handleCallPress = useCallback(() => {
        Linking.openURL(PHONE_NUMBER);
    }, []);


    useEffect(() => {

        fetchBanners(BANNER_TYPE);
    }, [fetchBanners]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <UpperLayout title={"Our Pet Bakery"} />
            <ScrollView>

                <ImageSlider height={200} images={sliders} />

                <BakeryCategories />

            </ScrollView>
        </SafeAreaView>


    )
}