import { View, Text, Image, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import React, { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
export default function BakeryCategories() {
    const [data, setData] = useState([])
    const navigation = useNavigation()
    const fetchData = async () => {
        try {
            const res = await axios.get(`https://admindoggy.adsdigitalmedia.com/api/pet-bakeries?populate=*`)
            if (res.data) {
                // console.log(res.data)
                setData(res.data.data)
            } else {
                setData([])
            }
        } catch (error) {
            console.log(error)
        }
    }
    useEffect(() => {
        fetchData()
    }, [])


    return (
        <>

            {/* <Text style={styles.text}>Items in Bakery</Text> */}


            <View style={styles.container}>
                {
                    data

                        .sort((a, b) => a.position - b.position)
                        .map((item, index) => {
                            return (
                                <TouchableOpacity
                                    onPress={() =>
                                        navigation.navigate(
                                            item.titile === 'Cakes' ? 'Cake-Screen' : 'dynamic_screen',
                                            { title: item.titile }
                                        )
                                    }
                                    key={item.id || index}
                                    style={styles.itemContainer}
                                >
                                    <Image
                                        source={{
                                            uri: item?.image?.formats?.thumbnail?.url || 'https://www.royalpoochpetbakery.com/wp-content/uploads/2024/06/pizza.jpg',
                                        }}
                                        style={styles.image}
                                    />
                                    <Text style={styles.title}>{item.titile
                                    }</Text>
                                </TouchableOpacity>
                            );
                        })
                }

            </View>

            {/* <View>
                <Image source={{ uri: 'https://i.ibb.co/MMKYWCJ/op.jpg' }} resizeMode='contain' style={styles.images} />
            </View> */}
        </>
    );
}

const styles = StyleSheet.create({
    image: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
    },
    text: {
        color: '#B21321',
        fontSize: 24,
        padding: 10,

        lineHeight: 24,
        fontWeight: 'bold',
        textAlign: 'center',

    },

    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    itemContainer: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
        borderRadius: 5,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden',
    },
    image: {
        width: "100%",
        height: 80,
        marginBottom: 10,
        resizeMode: 'fill',
    },
    title: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    images: {
        flex: 1,
        width: "100%",
        height: 200,
        marginBottom: 10,
        resizeMode: 'contain',

    }
});
