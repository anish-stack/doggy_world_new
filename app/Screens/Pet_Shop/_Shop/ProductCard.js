// ProductCard.js
import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';

const ProductCard = ({ item, navigateToScreen, styles }) => {
const [imageUri, setImageUri] = useState(
  item?.imageUrl?.[item.imageUrl.length - 1]?.url
);


  const handleImageError = () => {
    if (imageUri?.endsWith('.avif')) {
      setImageUri(imageUri.replace('.avif', '.jpg'));
    } else {
      setImageUri(require('./placeholder.jpg')); // Local fallback image
    }
  };

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigateToScreen(item)}
      activeOpacity={0.7}
    >
      <View style={styles.tagContainer}>
        {item.tag && <Text style={styles.tagText}>{item.tag}</Text>}
        {item.offPercentage > 0 && (
          <Text style={styles.discountTag}>{item.offPercentage}% OFF</Text>
        )}
      </View>

      <Image
        source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri}
        onError={handleImageError}
        style={styles.productImage}
        resizeMode="cover"
      />

      <View style={styles.productInfo}>
        <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
          {item.price !== item.discountPrice && (
            <Text style={styles.originalPrice}>₹{item.price}</Text>
          )}
        </View>

        <View style={styles.badgeContainer}>
          {item.freeDelivery && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Free Delivery</Text>
            </View>
          )}
          {item.freshStock && (
            <View style={[styles.badge, styles.freshBadge]}>
              <Text style={styles.badgeText}>Fresh</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;
