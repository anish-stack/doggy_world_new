import { View, Text } from 'react-native'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';

export default function TestAddOns() {
    const [addons, setAddons] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch()
    //https://admindoggy.adsdigitalmedia.com/api/lab-tests?populate=*&filters[common_disease_cat][$eq]=true&filters[isAdsOnTest][$eq]=true&filters[clinics][documentId][$eq]=fuod62lb5rr6ceh1t0b2cf6j
    const fetchAddons = async () => {
        setLoading(true);
        try {
            const response = await axios.get('https://admindoggy.adsdigitalmedia.com/api/ad-ons?populate=*');
            setAddons(response.data.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch add-ons.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddons();
    }, []);
    const handleAddToCart = async (item) => {
        const price = {};
        price.price = item.Price;
        price.disc_price = item.Discount_price;
        try {
            dispatch(AddingStart());
            const newItem = {
                ProductId: item.documentId,
                title: item.title,
                quantity: 1,
                Pricing: price,
                image: item.image?.url,


            };

            dispatch(AddingSuccess({
                Cart: [newItem],
            }));

        } catch (error) {
            dispatch(AddingFailure(error.message));  
        }
    };
    return (
    <View>
      <Text>TestAddOns</Text>
    </View>
  )
}