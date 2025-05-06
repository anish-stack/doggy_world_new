import { View, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { FontAwesome } from '@expo/vector-icons'
import styles from './Styls'

export default function CartItem({ item, onRemove }) {
  return (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.testImage} />
      <View style={styles.testDetails}>
        <Text style={styles.testName}>{item.test_name}</Text>
        {item.serviceType && (
          <Text style={styles.test_type}>{item.serviceType}</Text>
        )}
        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>₹{item.discountPrice}</Text>
          <Text style={styles.originalPrice}>₹{item.test_price}</Text>discountPrice
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(item.documentId)}
      >
        <FontAwesome name="trash" size={20} color="#ff4444" />
      </TouchableOpacity>
    </View>
  )
}