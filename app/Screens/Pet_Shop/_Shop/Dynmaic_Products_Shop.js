import { View, Text, ScrollView, StatusBar, Dimensions, TouchableOpacity, Image, ActivityIndicator, StyleSheet, FlatList, Linking } from 'react-native'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import useGetBannersHook from '../../../hooks/GetBannersHook'
import TopHeadPart from '../../../layouts/TopHeadPart'
import ImageSlider from '../../../layouts/ImageSlider'
import axios from 'axios'
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import { API_END_POINT_URL_LOCAL } from '../../../constant/constant'
import ProductCard from './ProductCard'

const { width } = Dimensions.get('window')
const PHONE_NUMBER = 'tel:9811299059'

export default function Dynmaic_Products_Shop() {
  const route = useRoute()
  const { category, title } = route.params || {}
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const [error, setError] = useState(null)
  const navigation = useNavigation()

  const { fetchBanners, sliders } = useGetBannersHook()

  const handleCallPress = useCallback(() => {
    Linking.openURL(PHONE_NUMBER)
  }, [])

  const handlePetShopProducts = useCallback(() => {
    const products = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/petshop-get-product-category/${category}`)
        if (response.data.success) {
          setData(response.data.data)
        }
      } catch (error) {
        setData([])
        console.log(error.response.data.message)
        setError(error.response.data.message)
      } finally {
        setLoading(false)
      }
    }

    products()
  }, [category])

  useEffect(() => {
    handlePetShopProducts()
    console.log("title", title)
    fetchBanners(title)
  }, [fetchBanners, handlePetShopProducts, title])

  const navigateToScreen = useCallback((item) => {
    navigation.navigate('Dynamic_Details_Shop', {
      id: item._id,
      title: item.name
    })
  }, [navigation])

  const renderItem = useCallback(
    ({ item }) => <ProductCard item={item} navigateToScreen={navigateToScreen} styles={styles} />,
    [navigateToScreen]
  );

  const keyExtractor = useCallback((item) => item._id, [])

  const productList = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          {error === "No pet shop products found for this category" ? (
            <>
              <MaterialCommunityIcons name="dog-side-off" size={50} color="#FFA726" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.retryButtonText}>Explore Other Categories</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <MaterialIcons name="error-outline" size={50} color="#E53935" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handlePetShopProducts}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      );
    }


    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-basket" size={50} color="#E53935" />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      )
    }

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    )
  }, [data, loading, error, renderItem, keyExtractor, handlePetShopProducts])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TopHeadPart title={title} fnc={handleCallPress} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Slider */}
        {sliders && sliders.length > 0 ? (
          <View style={styles.sliderContainer}>
            <ImageSlider images={sliders} height={170} />
          </View>
        ) : null}

        {/* Category Title */}
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{title}</Text>
          <View style={styles.divider} />
        </View>

        {/* Products */}
        {productList}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sliderContainer: {
    marginBottom: 15,
  },
  categoryHeader: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 5,
  },
  divider: {
    height: 3,
    width: 50,
    backgroundColor: '#E53935',
    borderRadius: 2,
  },
  listContainer: {
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 30) / 2,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  tagContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  tagText: {
    backgroundColor: '#E53935',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
  },
  discountTag: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  productImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 5,
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
    marginRight: 5,
  },
  originalPrice: {
    fontSize: 12,
    color: '#757575',
    textDecorationLine: 'line-through',
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 5,
    marginTop: 5,
  },
  freshBadge: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 10,
    color: '#E53935',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  errorText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 10,
    color: '#757575',
    fontSize: 16,
    textAlign: 'center',
  },
})