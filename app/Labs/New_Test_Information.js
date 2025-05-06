import { View, Text } from 'react-native'
import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native';

export default function New_Test_Information() {
    const navigation = useNavigation();
    const Route = useRoute();
    const { Test, typeOfTest, isUltraSound = false } = Route.params || {};
    
    return (
        <View>
            <Text>New_Test_Information</Text>
        </View>
    )
}