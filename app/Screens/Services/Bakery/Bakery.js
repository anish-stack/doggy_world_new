import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomSlider from './Slider'
import BakeryCategories from './Categories/BakeryCategories';
import UpperLayout from '../../../layouts/UpperLayout';

export default function Bakery() {
    const images = [
        { id: 1, src: require('./Captures.jpg') },
        { id: 2, src: require('./royalpooch.jpg') },
    ];
    return (
        <SafeAreaView style={{flex:1}}>
            <UpperLayout title={"Our Pet Bakery"} />
            <ScrollView>

                <CustomSlider autoPlay={true} Dealy={3000} imagesByProp={images} />
                <BakeryCategories />

            </ScrollView>
        </SafeAreaView>


    )
}