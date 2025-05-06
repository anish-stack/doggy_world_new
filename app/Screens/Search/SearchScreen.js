import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function SearchScreen() {
    const navigation  = useNavigation()
  const [searchQuery, setSearchQuery] = useState('');
  
  const items = [
    'Henlo Baked Food',
    'Royal Canin',
    'Pedigree Pro',
    'Kennel Kitchen',
    'Farmina',
    'Sheba',
    'Wet Food',
    'Drools Focus',
    'Skartrs',
    'Toys',
    'Dog Treats',
  ];

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Go Back Button */}
   

      {/* Search Input */}
      <View style={styles.header}>
      <TouchableOpacity 
 activeOpacity={0.9}onPress={() => navigation.goBack()} style={styles.backButton}>
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for products, brands etc."
        value={searchQuery}
        onChangeText={text => setSearchQuery(text)}
      />
    </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your past searches</Text>
          <View style={styles.itemContainer}>
            <MaterialIcons name="access-time" size={20} color="#EC4C3C" />
            <Text style={styles.itemText}>Pedigree Pro</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Most searched and bought</Text>
          {filteredItems.map((item, index) => (
            <View style={styles.itemContainer} key={index}>
              <MaterialIcons name="trending-up" size={20} color="#EC4C3C" />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff', // Change as needed
    elevation: 2, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  backButton: {
    marginRight: 10, // Space between button and input
  },
  searchInput: {
    flex: 1, // Take up remaining space
    // borderColor: '#EC4C3C',
    // borderWidth: 1,
    borderRadius: 4,
    padding: 8,
  },
  scrollContainer: {
    paddingHorizontal: 15,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
});
