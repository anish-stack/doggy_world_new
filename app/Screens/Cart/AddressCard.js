import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

const AddressCard = ({ address, selected, onSelect }) => {
  return (
    <TouchableOpacity style={[styles.container, selected && styles.selectedContainer]} onPress={onSelect}>
      <View style={styles.radioContainer}>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.addressDetails}>
          <Text style={styles.addressText}>
            {address.street}, {address.city}, {address.state} - {address.zipCode}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  selectedContainer: {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  radioContainer: {
    marginRight: 12,
    justifyContent: "center",
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#666",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#4CAF50",
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
  },
  content: {
    flex: 1,
  },
  addressDetails: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
})

export default AddressCard
