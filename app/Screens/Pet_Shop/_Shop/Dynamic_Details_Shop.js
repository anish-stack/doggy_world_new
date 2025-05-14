import { View, Text, ScrollView, StatusBar, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Linking, FlatList, Vibration } from 'react-native'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { AddingFailure, AddingStart, AddingSuccess } from '../../../redux/slice/cartSlice';
import axios from 'axios'
import { Ionicons, MaterialIcons, AntDesign, Feather, FontAwesome } from '@expo/vector-icons'
import { API_END_POINT_URL_LOCAL } from '../../../constant/constant'
import { useDispatch, useSelector } from 'react-redux';
const { width } = Dimensions.get('window')
const PHONE_NUMBER = 'tel:9811299059'
const MAX_QUANTITY = 99 // Maximum 2-digit quantity

export default function Dynamic_Details_Shop() {
    const route = useRoute()
    const { id, title } = route.params || {}
    const navigation = useNavigation()
    const autoSlideRef = useRef(null)
    const dispatch = useDispatch()


    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const imageSliderRef = useRef(null)

    const fetchProductDetails = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/petshop-get-product/${id}`)
            if (response.data.success) {
                setProduct(response.data.product)

                if (response.data.product.variants && response.data.product.variants.length > 0) {
                    setSelectedVariant(response.data.product.variants[0])
                }
            }
        } catch (error) {
            console.log(error)
            setError('Failed to load product details')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchProductDetails()
    }, [fetchProductDetails])

    // Auto slide functionality
    useEffect(() => {
        if (product?.imageUrl && product.imageUrl.length > 1) {
            const totalImages = product.imageUrl.length
            autoSlideRef.current = setInterval(() => {
                setCurrentImageIndex(prevIndex => (prevIndex + 1) % totalImages)

                // Scroll to the next image in the FlatList
                if (imageSliderRef.current) {
                    imageSliderRef.current.scrollToIndex({
                        index: (currentImageIndex + 1) % totalImages,
                        animated: true
                    })
                }
            }, 3000)
        }

        return () => {
            if (autoSlideRef.current) {
                clearInterval(autoSlideRef.current)
            }
        }
    }, [product, currentImageIndex])

    const handleCallPress = useCallback(() => {
        Linking.openURL(PHONE_NUMBER)
    }, [])

    const handleGoBack = useCallback(() => {
        navigation.goBack()
    }, [navigation])

    const handleVariantSelect = useCallback((variant) => {
        setSelectedVariant(variant)
    }, [])

    const handleQuantityChange = useCallback((action) => {
        if (action === 'increase' && quantity < MAX_QUANTITY) {
            setQuantity(prev => prev + 1)
        } else if (action === 'decrease' && quantity > 1) {
            setQuantity(prev => prev - 1)
        }
    }, [quantity])

    const handleAddToCart = useCallback((item) => {
        const price = {};
        const isVarientTrue = item.variants.length > 0 ? true : false;


        if (isVarientTrue && selectedVariant.stock !== 0) {
            price.price = selectedVariant.price;
            price.disc_price = selectedVariant.discountPrice;
            price.off_dis_percentage = selectedVariant.offPercentage;
        } else {
            price.price = item.price;
            price.disc_price = item.discountPrice;
            price.off_dis_percentage = item.offPercentage;
        }

        // Prepare new item to be added to cart
        const newItem = {
            ProductId: item._id,
            title: item.name,
            isPetShopProduct: true,
            freeDelivery: item?.freeDelivery,
            isCod: item?.isCod,
            isReturn: item?.isReturn,
            quantity: quantity ? quantity : 1,
            varientSize: selectedVariant?.size,
            varientId: selectedVariant?._id,
            Pricing: price,
            image: item.imageUrl[0]?.url,
            isVarientTrue: isVarientTrue,
        };

        try {

            dispatch(AddingStart());


            dispatch(AddingSuccess({
                Cart: [newItem],
            }));


            Vibration.vibrate(150);


            navigation.navigate('cart');

            // Show a success alert
            alert('Product added to cart!');
        } catch (error) {
            // Dispatch failure action in case of error
            dispatch(AddingFailure(error.message));
        }
    }, [selectedVariant, dispatch, navigation]);





    const handleImageChange = useCallback((index) => {
        setCurrentImageIndex(index)

        // Stop auto-slide when user manually changes image
        if (autoSlideRef.current) {
            clearInterval(autoSlideRef.current)

            // Restart auto-slide after 5 seconds of inactivity
            setTimeout(() => {
                if (product?.imageUrl && product.imageUrl.length > 1) {
                    autoSlideRef.current = setInterval(() => {
                        setCurrentImageIndex(prevIndex => (prevIndex + 1) % product.imageUrl.length)

                        if (imageSliderRef.current) {
                            imageSliderRef.current.scrollToIndex({
                                index: (currentImageIndex + 1) % product.imageUrl.length,
                                animated: true
                            })
                        }
                    }, 3000)
                }
            }, 5000)
        }

        // Scroll to the selected image in the FlatList
        if (imageSliderRef.current) {
            imageSliderRef.current.scrollToIndex({
                index: index,
                animated: true
            })
        }
    }, [product, currentImageIndex])

    const currentPrice = useMemo(() => {
        if (selectedVariant) {
            return selectedVariant.discountPrice
        }
        return product?.discountPrice || 0
    }, [product, selectedVariant])

    const originalPrice = useMemo(() => {
        if (selectedVariant) {
            return selectedVariant.price
        }
        return product?.price || 0
    }, [product, selectedVariant])

    const discount = useMemo(() => {
        if (selectedVariant) {
            return selectedVariant.offPercentage
        }
        return product?.offPercentage || 0
    }, [product, selectedVariant])

    // Get reversed image array for display
    const displayImages = useMemo(() => {
        if (product?.imageUrl && product.imageUrl.length > 0) {
            return [...product.imageUrl].reverse()
        }
        return []
    }, [product])

    // Handle FlatList scroll events
    const handleScroll = useCallback((event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width
        const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize)
        if (index !== currentImageIndex) {
            setCurrentImageIndex(index)
        }
    }, [currentImageIndex])

    // Render image item for FlatList
    const renderImageItem = useCallback(({ item, index }) => (
        <Image
            source={{ uri: item.url.replace('.avif', '.jpg') }}
            style={styles.carouselImage}
            resizeMode="cover"
        />
    ), [])

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <ActivityIndicator size="large" color="#E53935" />
                <Text style={styles.loadingText}>Loading product details...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <MaterialIcons name="error-outline" size={50} color="#E53935" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchProductDetails}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        )
    }

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <MaterialIcons name="error-outline" size={50} color="#E53935" />
                <Text style={styles.errorText}>Product not found</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleGoBack}
                >
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />


            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#212121" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>

            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Carousel */}
                <View style={styles.carouselContainer}>
                    <FlatList
                        ref={imageSliderRef}
                        data={displayImages.length > 0 ? displayImages : [{ url: product.mainImage.url }]}
                        renderItem={renderImageItem}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    />

                    {/* Pagination Dots */}
                    <View style={styles.paginationContainer}>
                        {displayImages.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    index === currentImageIndex && styles.paginationDotActive
                                ]}
                            />
                        ))}
                    </View>

                    {product.tag && (
                        <View style={styles.tagContainer}>
                            <Text style={styles.tagText}>{product.tag}</Text>
                        </View>
                    )}

                    {discount > 0 && (
                        <View style={styles.discountContainer}>
                            <Text style={styles.discountText}>{discount}% OFF</Text>
                        </View>
                    )}
                </View>

                {/* Image Thumbnails */}
                {displayImages.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailContainer}
                    >
                        {displayImages.map((img, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleImageChange(index)}
                                style={[
                                    styles.thumbnailWrapper,
                                    currentImageIndex === index && styles.activeThumbnail,
                                ]}
                            >
                                <Image
                                    source={{
                                        uri: img.url.replace('.avif', '.jpg')
                                    }}
                                    style={styles.thumbnail}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Product Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.productName}>{product.name}</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.currentPrice}>₹{currentPrice}</Text>
                        {originalPrice !== currentPrice && (
                            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                        )}
                        {discount > 0 && (
                            <View style={styles.savingBadge}>
                                <Text style={styles.savingText}>
                                    Save ₹{(originalPrice - currentPrice).toFixed(2)}
                                </Text>
                            </View>
                        )}

                    </View>

                    {/* Availability Status */}
                    <View style={styles.availabilityContainer}>
                        {product.isProductAvailable ? (
                            <View style={styles.availableStatus}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.availableText}>In Stock</Text>
                                <View style={styles.hurryBadge}>
                                    <Text style={styles.hurryText}>Hurry Up!</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.unavailableStatus}>
                                <MaterialIcons name="cancel" size={18} color="#E53935" />
                                <Text style={styles.unavailableText}>Out of Stock</Text>
                            </View>
                        )}
                    </View>

                    {/* Badges */}
                    <View style={styles.badgeRow}>
                        {product.freeDelivery && (
                            <View style={styles.badge}>
                                <Feather name="truck" size={14} color="#E53935" />
                                <Text style={styles.badgeText}>Free Delivery</Text>
                            </View>
                        )}
                        {product.freshStock && (
                            <View style={[styles.badge, styles.freshBadge]}>
                                <MaterialIcons name="verified" size={14} color="#4CAF50" />
                                <Text style={[styles.badgeText, styles.freshText]}>Fresh Stock</Text>
                            </View>
                        )}
                        {product.isCod && (
                            <View style={styles.badge}>
                                <MaterialIcons name="payments" size={14} color="#E53935" />
                                <Text style={styles.badgeText}>COD Available</Text>
                            </View>
                        )}
                        {!product.isReturn && (
                            <View style={[styles.badge, styles.noReturnBadge]}>
                                <MaterialIcons name="block" size={14} color="#FF9800" />
                                <Text style={[styles.badgeText, styles.noReturnText]}>No Returns</Text>
                            </View>
                        )}
                    </View>

                    {/* Variants */}
                    {product.variants && product.variants.length > 0 && (
                        <View style={styles.variantsContainer}>
                            <Text style={styles.sectionTitle}>Available Options</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={product.variants}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.variantCard,
                                            selectedVariant && selectedVariant._id === item._id && styles.selectedVariant
                                        ]}
                                        onPress={() => handleVariantSelect(item)}
                                    >
                                        <View style={styles.variantHeader}>
                                            <Text style={styles.variantSize}>{item.size}</Text>
                                            {item.offPercentage > 0 && (
                                                <View style={styles.variantDiscount}>
                                                    <Text style={styles.variantDiscountText}>{item.offPercentage}% OFF</Text>
                                                </View>
                                            )}
                                        </View>

                                        {item.flavour && item.flavour !== "No Flavour" && (
                                            <View style={styles.variantFlavorContainer}>
                                                <FontAwesome name="cutlery" size={12} color="#757575" />
                                                <Text style={styles.variantFlavor}>{item.flavour}</Text>
                                            </View>
                                        )}

                                        <View style={styles.variantPriceContainer}>
                                            <Text style={styles.variantPrice}>₹{item.discountPrice}</Text>
                                            {item.price !== item.discountPrice && (
                                                <Text style={styles.variantOriginalPrice}>₹{item.price}</Text>
                                            )}
                                        </View>

                                        {selectedVariant && selectedVariant._id === item._id && (
                                            <View style={styles.selectedCheck}>
                                                <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={styles.variantsScroll}
                            />
                        </View>
                    )}

                    {/* Quantity */}
                    <View style={styles.quantityContainer}>
                        <Text style={styles.sectionTitle}>Quantity</Text>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity
                                style={[
                                    styles.quantityButton,
                                    quantity <= 1 && styles.quantityButtonDisabled
                                ]}
                                onPress={() => handleQuantityChange('decrease')}
                                disabled={quantity <= 1}
                            >
                                <AntDesign name="minus" size={16} color={quantity <= 1 ? "#bdbdbd" : "#212121"} />
                            </TouchableOpacity>
                            <View style={styles.quantityTextContainer}>
                                <Text style={styles.quantityText}>{quantity}</Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.quantityButton,
                                    quantity >= MAX_QUANTITY && styles.quantityButtonDisabled
                                ]}
                                onPress={() => handleQuantityChange('increase')}
                                disabled={quantity >= MAX_QUANTITY}
                            >
                                <AntDesign name="plus" size={16} color={quantity >= MAX_QUANTITY ? "#bdbdbd" : "#212121"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.descriptionText}>{product.description}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[
                        styles.cartButton,
                        !product.isProductAvailable && styles.disabledButton
                    ]}
                    onPress={() => handleAddToCart(product)}
                    disabled={!product.isProductAvailable}
                >
                    <Feather name="shopping-cart" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Add to Cart</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
                    style={[
                        styles.buyButton,
                        !product.isProductAvailable && styles.disabledButton
                    ]}
                    onPress={handleBookNow}
                    disabled={!product.isProductAvailable}
                >
                    <Feather name="shopping-bag" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Book Now</Text>
                </TouchableOpacity> */}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        color: '#757575',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorText: {
        marginTop: 10,
        marginBottom: 20,
        color: '#757575',
        textAlign: 'center',
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        elevation: 2,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginLeft: 10,
    },
    callButton: {
        padding: 5,
    },
    carouselContainer: {
        width: width,
        height: 320,
        position: 'relative',
    },
    carouselImage: {
        width: width,
        height: 320,
        backgroundColor: '#f5f5f5',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 10,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: '#E53935',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    tagContainer: {
        position: 'absolute',
        top: 10,
        left: 0,
        backgroundColor: '#E53935',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
        elevation: 3,
    },
    tagText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    discountContainer: {
        position: 'absolute',
        top: 10,
        right: 0,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
        elevation: 3,
    },
    discountText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    thumbnailContainer: {
        paddingHorizontal: 10,
        paddingVertical: 15,
        backgroundColor: '#f9f9f9',
    },
    thumbnailWrapper: {
        width: 60,
        height: 60,
        borderRadius: 5,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 2,
        backgroundColor: '#fff',
        elevation: 1,
    },
    activeThumbnail: {
        borderColor: '#E53935',
        borderWidth: 2,
        transform: [{ scale: 1.05 }],
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 3,
    },
    infoContainer: {
        padding: 15,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 10,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    currentPrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#E53935',
        marginRight: 10,
    },
    originalPrice: {
        fontSize: 16,
        color: '#757575',
        textDecorationLine: 'line-through',
        marginRight: 10,
    },
    savingBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    savingText: {
        fontSize: 12,
        color: '#E53935',
        fontWeight: '500',
    },
    availabilityContainer: {
        marginBottom: 15,
    },
    availableStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    availableText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
        marginLeft: 5,
    },
    unavailableStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unavailableText: {
        fontSize: 14,
        color: '#E53935',
        fontWeight: '500',
        marginLeft: 5,
    },
    hurryBadge: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        marginLeft: 10,
    },
    hurryText: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: 'bold',
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginRight: 10,
        marginBottom: 10,
        elevation: 1,
    },
    freshBadge: {
        backgroundColor: '#E8F5E9',
    },
    noReturnBadge: {
        backgroundColor: '#FFF3E0',
    },
    badgeText: {
        fontSize: 12,
        color: '#E53935',
        fontWeight: '500',
        marginLeft: 5,
    },
    freshText: {
        color: '#4CAF50',
    },
    noReturnText: {
        color: '#FF9800',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 10,
    },
    variantsContainer: {
        marginBottom: 20,
    },
    variantsScroll: {
        paddingBottom: 5,
    },
    variantCard: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 10,
        marginRight: 12,
        minWidth: 120,
        backgroundColor: '#fff',
        elevation: 2,
        position: 'relative',
    },
    selectedVariant: {
        borderColor: '#4CAF50',
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
    },
    variantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    variantSize: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212121',
    },
    variantFlavorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    variantFlavor: {
        fontSize: 12,
        color: '#757575',
        marginLeft: 5,
    },
    variantPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    variantPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#E53935',
    },
    variantOriginalPrice: {
        fontSize: 12,
        color: '#757575',
        textDecorationLine: 'line-through',
        marginLeft: 5,
    },
    variantDiscount: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    variantDiscountText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold',
    },
    selectedCheck: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 2,
    },
    quantityContainer: {
        marginBottom: 20,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 1,
    },
    quantityButtonDisabled: {
        backgroundColor: '#f5f5f5',
        borderColor: '#e0e0e0',
    },
    quantityTextContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginHorizontal: 10,
        borderRadius: 5,
        minWidth: 60,
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
    },
    descriptionContainer: {
        marginBottom: 80,
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#424242',
    },
    actionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 15,
        elevation: 5,
    },
    cartButton: {
        flex: 1,
        backgroundColor: '#FF5252',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 10,
        elevation: 2,
    },
    buyButton: {
        flex: 1,
        backgroundColor: '#E53935',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
    },
    disabledButton: {
        backgroundColor: '#bdbdbd',
        elevation: 0,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 8,
    },
})