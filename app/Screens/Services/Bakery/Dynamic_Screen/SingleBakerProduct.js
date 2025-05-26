import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Vibration,
    ToastAndroid,
    Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AddingStart, AddingSuccess, AddingFailure } from '../../../../redux/slice/cartSlice';
import { API_END_POINT_URL_LOCAL } from '../../../../constant/constant';

const { width, height } = Dimensions.get('window');
const MAX_QUANTITY = 99;

// Toast helper
const showToast = (message) => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
        Alert.alert('', message, [{ text: 'OK' }], { cancelable: true });
    }
};

export default function ProductDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { id, productType,title } = route.params || {};

    // State management
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    // API endpoint based on product type
    const getApiEndpoint = () => {
        const baseUrl = API_END_POINT_URL_LOCAL;
        return `${baseUrl}/api/v1/get-bakery-product/${id}`;
    };

    // Fetch product data
    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(getApiEndpoint());
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch product');
            }

            if (data.success && data.product) {
                setProduct(data.product);
                // Set first variant as default if variants exist
                if (data.product.variants && data.product.variants.length > 0) {
                    setSelectedVariant(data.product.variants[0]);
                }
            } else {
                throw new Error('Product not found');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching product:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchProduct();
        } else {
            setError('Product ID not provided');
            setLoading(false);
        }
    }, [id]);

    // Check if product is out of stock
    const isOutOfStock = useCallback(() => {
        if (!product) return true;
        
        if (selectedVariant) {
            return selectedVariant.stock === 0 || !selectedVariant.inStock;
        }
        
        return !product.isProductAvailable || product.stock === 0;
    }, [product, selectedVariant]);

    // Handle variant selection
    const handleVariantSelect = (variant) => {
        if (variant.stock > 0 && variant.inStock) {
            setSelectedVariant(variant);
            setQuantity(1); // Reset quantity when variant changes
        }
    };

    // Handle quantity changes
    const handleQuantityChange = (delta) => {
        const newQuantity = quantity + delta;
        const maxStock = selectedVariant?.stock || product?.stock || MAX_QUANTITY;
        
        if (newQuantity >= 1 && newQuantity <= Math.min(MAX_QUANTITY, maxStock)) {
            setQuantity(newQuantity);
        }
    };

    // Handle add to cart
    const handleAddToCart = async () => {
        if (isOutOfStock()) {
            showToast("Sorry, this product is out of stock!");
            return;
        }

        try {
            setAddingToCart(true);
            dispatch(AddingStart());

            const hasVariants = product.variants && product.variants.length > 0;
            const pricing = {
                price: selectedVariant?.price || product.price,
                disc_price: selectedVariant?.discountPrice || product.discountPrice,
                off_dis_percentage: selectedVariant?.offPercentage || product.offPercentage,
            };

            const cartItem = {
                ProductId: product._id,
                title: product.name,
                isPetShopProduct: false,
                freeDelivery: product.freeDelivery,
                isCod: product.isCod,
                isReturn: product.isReturn,
                quantity: quantity,
                varientSize: selectedVariant?.size,
                varientId: selectedVariant?._id,
                Pricing: pricing,
                image: product.mainImage?.url || product.imageUrl?.[0]?.url,
                isVarientTrue: hasVariants,
            };

            dispatch(AddingSuccess({ Cart: [cartItem] }));
            
            Vibration.vibrate(100);
            showToast(`${product.name} added to cart!`);

      

        } catch (error) {
            dispatch(AddingFailure(error.message));
            showToast("Failed to add to cart. Please try again.");
        } finally {
            setAddingToCart(false);
        }
    };

    // Get current price based on selected variant
    const getCurrentPrice = () => {
        return selectedVariant?.discountPrice || product?.discountPrice || 0;
    };

    const getOriginalPrice = () => {
        return selectedVariant?.price || product?.price || 0;
    };

    const getDiscountPercentage = () => {
        return selectedVariant?.offPercentage || product?.offPercentage || 0;
    };

    // Loading state
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#D00000" />
                    <Text style={styles.loadingText}>Loading product...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
                    <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchProduct}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // No product found
    if (!product) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="cube-outline" size={64} color="#999" />
                    <Text style={styles.errorTitle}>Product Not Found</Text>
                    <Text style={styles.errorMessage}>The product you're looking for doesn't exist.</Text>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const images = product.imageUrl || (product.mainImage ? [product.mainImage] : []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title || 'Product Details' }</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                {/* Image Section */}
                <View style={styles.imageSection}>
                    {images.length > 0 && (
                        <Image
                            source={{ uri: images[currentImageIndex]?.url }}
                            style={styles.mainImage}
                            resizeMode="cover"
                        />
                    )}
                    
                    {isOutOfStock() && (
                        <View style={styles.outOfStockOverlay}>
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        </View>
                    )}

                    {/* Image thumbnails */}
                    {images.length > 1 && (
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.thumbnailContainer}
                        >
                            {images.map((image, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => setCurrentImageIndex(index)}
                                    style={[
                                        styles.thumbnail,
                                        currentImageIndex === index && styles.selectedThumbnail
                                    ]}
                                >
                                    <Image
                                        source={{ uri: image.url }}
                                        style={styles.thumbnailImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                    {/* Product Type Badge */}
                    <View style={[
                        styles.badge, 
                        { backgroundColor: productType === 'pet' ? '#FF6B6B' : '#D00000' }
                    ]}>
                        <Text style={styles.badgeText}>
                            {productType === 'pet' ? 'Pet Product' : 'Bakery Product'}
                        </Text>
                    </View>

                    {/* Title and Tag */}
                    <View style={styles.titleSection}>
                        <Text style={styles.productName}>{product.name}</Text>
                        {product.tag && (
                            <View style={styles.tagContainer}>
                                <Text style={styles.tagText}>{product.tag}</Text>
                            </View>
                        )}
                    </View>

                    {/* Flavor */}
                    {product.flavour && (
                        <Text style={styles.flavor}>Flavor: {product.flavour}</Text>
                    )}

                    {/* Description */}
                    <Text style={styles.description}>{product.description}</Text>

                    {/* Price */}
                    <View style={styles.priceSection}>
                        <Text style={styles.currentPrice}>₹{getCurrentPrice()}</Text>
                        {getDiscountPercentage() > 0 && (
                            <>
                                <Text style={styles.originalPrice}>₹{getOriginalPrice()}</Text>
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>{getDiscountPercentage()}% OFF</Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Variants */}
                    {product.variants && product.variants.length > 0 && (
                        <View style={styles.variantsSection}>
                            <Text style={styles.sectionTitle}>Available Sizes:</Text>
                            <View style={styles.variantsList}>
                                {product.variants.map((variant) => {
                                    const isSelected = selectedVariant?._id === variant._id;
                                    const isDisabled = variant.stock === 0 || !variant.inStock;
                                    
                                    return (
                                        <TouchableOpacity
                                            key={variant._id}
                                            style={[
                                                styles.variantButton,
                                                isSelected && styles.selectedVariantButton,
                                                isDisabled && styles.disabledVariantButton
                                            ]}
                                            onPress={() => handleVariantSelect(variant)}
                                            disabled={isDisabled}
                                        >
                                            <Text style={[
                                                styles.variantButtonText,
                                                isSelected && styles.selectedVariantButtonText,
                                                isDisabled && styles.disabledVariantButtonText
                                            ]}>
                                                {variant.size}
                                            </Text>
                                            {isDisabled && (
                                                <Text style={styles.outOfStockLabel}>Out of Stock</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Quantity */}
                    <View style={styles.quantitySection}>
                        <Text style={styles.sectionTitle}>Quantity:</Text>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity
                                style={[
                                    styles.quantityButton,
                                    quantity <= 1 && styles.disabledQuantityButton
                                ]}
                                onPress={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1 || isOutOfStock()}
                            >
                                <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#333"} />
                            </TouchableOpacity>
                            
                            <Text style={styles.quantityText}>{quantity}</Text>
                            
                            <TouchableOpacity
                                style={[
                                    styles.quantityButton,
                                    (quantity >= MAX_QUANTITY || quantity >= (selectedVariant?.stock || product?.stock || MAX_QUANTITY)) && styles.disabledQuantityButton
                                ]}
                                onPress={() => handleQuantityChange(1)}
                                disabled={quantity >= MAX_QUANTITY || quantity >= (selectedVariant?.stock || product?.stock || MAX_QUANTITY) || isOutOfStock()}
                            >
                                <Ionicons name="add" size={20} color={
                                    (quantity >= MAX_QUANTITY || quantity >= (selectedVariant?.stock || product?.stock || MAX_QUANTITY)) ? "#ccc" : "#333"
                                } />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresSection}>
                        <Text style={styles.sectionTitle}>Features:</Text>
                        <View style={styles.featuresList}>
                            {product.isCod && (
                                <View style={styles.featureItem}>
                                    <Ionicons name="cash-outline" size={16} color="#D00000" />
                                    <Text style={styles.featureText}>Cash on Delivery</Text>
                                </View>
                            )}
                            {product.isReturn && (
                                <View style={styles.featureItem}>
                                    <Ionicons name="return-up-back-outline" size={16} color="#D00000" />
                                    <Text style={styles.featureText}>Easy Returns</Text>
                                </View>
                            )}
                            {product.freshStock && (
                                <View style={styles.featureItem}>
                                    <Ionicons name="leaf-outline" size={16} color="#D00000" />
                                    <Text style={styles.featureText}>Fresh Stock</Text>
                                </View>
                            )}
                            {product.freeDelivery && (
                                <View style={styles.featureItem}>
                                    <Ionicons name="car-outline" size={16} color="#D00000" />
                                    <Text style={styles.featureText}>Free Delivery</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Add to Cart Button */}
            <View style={styles.bottomSection}>
                <View style={styles.totalPriceContainer}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalPrice}>₹{(getCurrentPrice() * quantity).toFixed(0)}</Text>
                </View>
                
                <TouchableOpacity
                    style={[
                        styles.addToCartButton,
                        (isOutOfStock() || addingToCart) && styles.disabledAddToCartButton
                    ]}
                    onPress={handleAddToCart}
                    disabled={isOutOfStock() || addingToCart}
                >
                    {addingToCart ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons 
                                name="cart-outline" 
                                size={20} 
                                color="#fff" 
                                style={styles.cartIcon} 
                            />
                            <Text style={styles.addToCartButtonText}>
                                {isOutOfStock() ? "Out of Stock" : "Add to Cart"}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
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
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 24,
    },
    retryButton: {
        backgroundColor: '#D00000',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 24,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    backButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    imageSection: {
        backgroundColor: '#f8f9fa',
    },
    mainImage: {
        width: width,
        height: width,
    },
    outOfStockOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    thumbnailContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedThumbnail: {
        borderColor: '#D00000',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
    productInfo: {
        padding: 16,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
        marginBottom: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    titleSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 12,
    },
    tagContainer: {
        backgroundColor: '#e3f2fd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 12,
        color: '#1976d2',
        fontWeight: '600',
    },
    flavor: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 16,
    },
    priceSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    currentPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginRight: 12,
    },
    originalPrice: {
        fontSize: 18,
        color: '#999',
        textDecorationLine: 'line-through',
        marginRight: 8,
    },
    discountBadge: {
        backgroundColor: '#ff5722',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    variantsSection: {
        marginBottom: 24,
    },
    variantsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    variantButton: {
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    selectedVariantButton: {
        borderColor: '#D00000',
        backgroundColor: '#D00000',
    },
    disabledVariantButton: {
        borderColor: '#e9ecef',
        backgroundColor: '#f8f9fa',
    },
    variantButtonText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    selectedVariantButtonText: {
        color: '#fff',
    },
    disabledVariantButtonText: {
        color: '#999',
    },
    outOfStockLabel: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
    },
    quantitySection: {
        marginBottom: 24,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    disabledQuantityButton: {
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
    },
    quantityText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 20,
        minWidth: 30,
        textAlign: 'center',
    },
    featuresSection: {
        marginBottom: 24,
    },
    featuresList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
        backgroundColor: '#fff',
    },
    totalPriceContainer: {
        flex: 1,
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    addToCartButton: {
        backgroundColor: '#D00000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 140,
    },
    disabledAddToCartButton: {
        backgroundColor: '#ccc',
    },
    cartIcon: {
        marginRight: 8,
    },
    addToCartButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});