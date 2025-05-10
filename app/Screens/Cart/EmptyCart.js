import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const EmptyCart = ({ onContinueShopping }) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="cart-outline" size={80} color="#ccc" />
      <Text style={styles.title}>Your cart is empty</Text>
      <Text style={styles.subtitle}>Looks like you haven't added anything to your cart yet</Text>
      <TouchableOpacity style={styles.shopButton} onPress={onContinueShopping}>
        <Text style={styles.shopButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default EmptyCart
