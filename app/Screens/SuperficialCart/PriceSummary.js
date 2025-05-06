import { View, Text } from 'react-native'
import React from 'react'
import styles from './Styls'

export default function PriceSummary({ totalPrice, totalDiscount, selectedOffer, payableAmount }) {
  console.log("totalPrice, totalDiscount, selectedOffer, payableAmount", totalPrice, totalDiscount, selectedOffer, payableAmount)
  return (
    <View style={styles.priceBreakdown}>
      <Text style={styles.priceBreakdownTitle}>Price Summary</Text>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Total Price</Text>
        <Text style={styles.priceValue}>₹{totalPrice}</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Total Discount</Text>
        <Text style={styles.discountValue}>- ₹{totalDiscount}</Text>
      </View>
      {selectedOffer && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Offer ({selectedOffer.Code})</Text>
          <Text style={styles.discountValue}>- ₹{selectedOffer.upto_off}</Text>
        </View>
      )}
      <View style={[styles.priceRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Payable Amount</Text>
        <Text style={styles.totalValue}>₹{payableAmount}</Text>
      </View>
    </View>
  )
}