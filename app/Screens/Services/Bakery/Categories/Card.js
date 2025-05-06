import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
  } from 'react-native';
  import React, { useState } from 'react';
  import { useNavigation } from '@react-navigation/native';
  import { MaterialIcons } from '@expo/vector-icons';
  import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
  import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withSequence,
  } from 'react-native-reanimated';
  
  const { width } = Dimensions.get('window');
  const cardWidth = (width - scale(48)) / 2;
  
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  
  export default function Card({ data }) {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const scale = useSharedValue(1);
  
    const {
      title,
      price,
      disc_price,
      off_dis_percentage,
      images,
      variant,
      varient_stauts,
      documentId,
    } = data;
  
    const displayPrice = varient_stauts ? variant?.[0].price : price;
    const displayDiscPrice = varient_stauts ? variant?.[0].disc_price : disc_price;
    const displayDiscount = off_dis_percentage || variant?.[0].off_perce;
  
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));
  
    const handlePress = async (action) => {
      // Trigger press animation
      scale.value = withSequence(
        withSpring(0.95),
        withSpring(1)
      );
  
      setLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigation.navigate('product_details', {
        id: documentId,
        title: title,
        action: action // 'view' or 'cart'
      });
      
      setLoading(false);
    };
  
    return (
      <AnimatedTouchable
        style={[styles.cardContainer, animatedStyle]}
        onPress={() => handlePress('view')}
        activeOpacity={0.9}
      >
        {/* Discount Badge */}
        {displayDiscount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{displayDiscount}% OFF</Text>
          </View>
        )}
  
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images?.url }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
  
        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
  
          {/* Price and Rating Section */}
          <View style={styles.detailsContainer}>
            <View style={styles.priceContainer}>
              <Text style={styles.discountPrice}>₹{displayDiscPrice || 0}</Text>
              {displayPrice > displayDiscPrice && (
                <Text style={styles.originalPrice}>₹{displayPrice || 0}</Text>
              )}
            </View>
  
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>4.5 ⭐</Text>
            </View>
          </View>
  
          {/* Add to Cart Button */}
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handlePress('cart')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="shopping-cart" size={moderateScale(18)} color="#FFFFFF" />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </AnimatedTouchable>
    );
  }
  
  const styles = StyleSheet.create({
    cardContainer: {
      width: cardWidth,
      backgroundColor: '#FFFFFF',
      borderRadius: moderateScale(16),
      margin: scale(12),
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: verticalScale(2) },
      shadowOpacity: 0.1,
      shadowRadius: moderateScale(8),
    },
    imageContainer: {
      width: '100%',
      height: verticalScale(80),
      backgroundColor: '#F8F9FA',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    discountBadge: {
      position: 'absolute',
      top: verticalScale(8),
      left: scale(8),
      backgroundColor: '#FF3B30',
      paddingHorizontal: scale(8),
      paddingVertical: verticalScale(4),
      borderRadius: moderateScale(12),
      zIndex: 1,
    },
    discountText: {
      color: '#FFFFFF',
      fontSize: moderateScale(12),
      fontWeight: '700',
    },
    contentContainer: {
      padding: moderateScale(12),
    },
    title: {
      fontSize: moderateScale(12),
      fontWeight: '600',
      color: '#1A1A1A',
      marginBottom: verticalScale(4),
      lineHeight: verticalScale(20),
    },
    detailsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: verticalScale(12),
    },
    priceContainer: {
      flex: 1,
    },
    discountPrice: {
      fontSize: moderateScale(14),
      fontWeight: '700',
      color: '#1A1A1A',
    },
    originalPrice: {
      fontSize: moderateScale(12),
      color: '#999999',
      textDecorationLine: 'line-through',
      marginTop: verticalScale(2),
    },
    ratingContainer: {
      backgroundColor: '#F8F9FA',
      paddingHorizontal: scale(8),
      paddingVertical: verticalScale(4),
      borderRadius: moderateScale(8),
    },
    ratingText: {
      fontSize: moderateScale(12),
      fontWeight: '600',
      color: '#1A1A1A',
    },
    addToCartButton: {
      backgroundColor: '#FF3B30',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: verticalScale(10),
      borderRadius: moderateScale(8),
      marginTop: verticalScale(2),
    },
    addToCartText: {
      color: '#FFFFFF',
      fontSize: moderateScale(14),
      fontWeight: '600',
      marginLeft: scale(8),
    },
  });