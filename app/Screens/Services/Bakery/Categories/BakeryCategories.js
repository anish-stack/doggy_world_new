import { View, Text, Image, StyleSheet, FlatList } from 'react-native';
import React, { useEffect, useState, useCallback, memo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../../../../constant/constant';

// Memoized item component for better performance
const CategoryItem = memo(({ item, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.itemContainer}
  >
    <Image
      source={{ uri: item?.imageUrl?.url || 'https://www.royalpoochpetbakery.com/wp-content/uploads/2024/06/pizza.jpg' }}
      style={styles.image}

      fadeDuration={300}
      defaultSource={require('./placeholder.png')}
    />
    <Text style={styles.title}>{item.title}</Text>
  </TouchableOpacity>
));

export default function BakeryCategories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-all-pet-bakery`, {
        // Add timeout to prevent long loading times
        timeout: 5000
      });

      if (res.data) {
        const sort = res.data.data.sort((a, b) => a.position - b.position);
        setData(sort);
      } else {
        setData([]);
      }
    } catch (error) {
      console.log('Error fetching bakery data:', error);
      // Handle error state if needed
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleItemPress = useCallback((title ,id) => {
    navigation.navigate(
      title === 'Cakes' ? 'Cake-Screen' : 'dynamic_screen',
      { title: title, id: id }
    );
  }, [navigation]);

  const renderItem = useCallback(({ item }) => (
    <CategoryItem
      item={item}
      onPress={() => handleItemPress(item.title, item._id)}
    />
  ), [handleItemPress]);

  const keyExtractor = useCallback((item) => item.id?.toString() || item.title, []);

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        contentContainerStyle={styles.flatListContainer}
        initialNumToRender={6} // Render only visible items initially
        maxToRenderPerBatch={9} // Limit batch rendering
        windowSize={5} // Reduce window size for better memory usage
        removeClippedSubviews={true} // Helps with memory usage
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No items available</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  flatListContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 20,
  },
  itemContainer: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    maxWidth: '33%',
  },
  image: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
    objectFit: 'contain'
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  }
});