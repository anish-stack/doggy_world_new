import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width / 2) - 20;

export default function GroomingPackages() {
  const [packages, setPackages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categories = ['All', 'Bath', 'Bath + Hair Cuting', 'Bath + Hygiene Cutting', 'Haircut'];
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const navigation = useNavigation()
  const categoryIcons = {
    'All': 'paw',
    'Bath': 'bath',
    'Bath + Hair Cutting': 'scissors',
    'Bath + Hygiene Cutting': 'medkit',
    'Haircut': 'cut'
  };

  useEffect(() => {
    fetchPackages();
  }, [selectedCategory]);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = 'https://admindoggy.adsdigitalmedia.com/api/grooming-packages?populate=*';
      if (selectedCategory !== 'All') {
        const encodedCategory = encodeURIComponent(selectedCategory);
        console.log("selectedCategory", selectedCategory)

        console.log("encodedCategory", encodedCategory)
        url = `https://admindoggy.adsdigitalmedia.com/api/grooming-packages?filters[Category][$eq]=${encodedCategory}&populate=*`;
      }
      const response = await axios.get(url);
      setPackages(response.data.data || []);
      setLoading(false);
    } catch (error) {
      setError('Failed to load packages. Please try again.');
      setLoading(false);
    }
  };
  const handleReadMore = (id) => {
    setExpandedServiceId(expandedServiceId === id ? null : id);
  };

  const renderCategoryButtons = () => (
    <View style={styles.categoryWrapper}>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContentContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Icon
              name={categoryIcons[category]}
              size={20}
              color={selectedCategory === category ? '#fff' : '#ed424b'}
              style={styles.categoryIcon}
            />
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="spinner" size={40} color="#ed424b" />
        <Text style={styles.loadingText}>Loading amazing packages...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="exclamation-circle" size={40} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPackages}>
          <Icon name="refresh" size={20} color="#fff" style={styles.retryIcon} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const renderPackageCard = (pkg) => {

    const isExpanded = expandedServiceId === pkg.id;

    return (
      <TouchableOpacity key={pkg.id} activeOpacity={0.9} style={styles.packageCard}>
        <View style={styles.cardHeader}>
          <View style={styles.packageTitleContainer}>
            <Text style={styles.packageTitle}>{pkg.title}</Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>₹{pkg.price_start}</Text>
            <Text style={styles.priceRange}>- ₹{pkg.price_end}</Text>
          </View>
        </View>
        <View style={styles.includesContainer}>
          {pkg.includes.inclueds
            .slice(0, isExpanded ? pkg.includes.inclueds.length : 4)
            .map((item, index) => (
              <View key={index} style={styles.includeItem}>
                <Icon name="check-circle" size={16} color="#ed424b" style={styles.checkIcon} />
                <Text numberOfLines={1} style={styles.includeText}>{item}</Text>
              </View>
            ))}
          {pkg.includes.inclueds.length > 4 && (
            <TouchableOpacity activeOpacity={0.9} onPress={() => handleReadMore(pkg.id)} style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>
                {isExpanded ? "Show Less" : "View More"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('clinic', { type:"Package", Package: pkg.documentId })} activeOpacity={0.9} style={styles.bookNowButton}>
          <Icon name="calendar" size={16} color="#fff" style={styles.bookIcon} />
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      {renderCategoryButtons()}
      <ScrollView style={styles.mainContainer}>
        {packages.length === 0 ? (
          <View style={styles.noPackagesContainer}>
            <Icon name="search" size={40} color="#ed424b" />
            <Text style={styles.noPackagesText}>No packages found for this category</Text>
          </View>
        ) : (
          <View style={styles.packagesContainer}>
            {packages.map(pkg => renderPackageCard(pkg))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    padding: 12,
    textAlign: 'center',
  },
  categoryWrapper: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: 8,
  },
  categoryContainer: {
    height: 80,
  },
  categoryContentContainer: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    height: 48,

    borderColor: '#ed424b',

  },
  selectedCategoryButton: {
    backgroundColor: '#ed424b',
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ed424b',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  mainContainer: {
    flex: 1,
    padding: 16,
  },
  packagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'center',
    gap: 4,
  },
  packageCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    minHeight: 270,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,

    overflow: 'hidden',
  },

  cardHeader: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // alignItems: 'center',
    marginBottom: 16,
  },
  packageTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageIcon: {
    marginRight: 8,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  priceTag: {
    marginTop: 12,
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    flexDirection: 'row',
    borderColor: '#ed424b',
  },
  priceText: {
    color: '#ed424b',
    fontWeight: 'bold',
    fontSize: 12,
  },
  priceRange: {
    color: '#ed424b',
    fontSize: 12,
    textAlign: 'center',
  },
  includesContainer: {
    flexDirection: 'column',
    marginTop: 8,
    backgroundColor: '#F8F9FA',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    marginRight: 8,
  },
  includeText: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  bookNowButton: {
    backgroundColor: '#ed424b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    elevation: 1,
  },
  bookIcon: {
    marginRight: 8,
  },
  bookNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
  },
  loadingText: {
    fontSize: 18,
    color: '#ed424b',
    fontWeight: '600',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#ed424b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noPackagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noPackagesText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 16,
  },
  readMoreButton: {
    marginTop: 8,
    alignItems: "center",
  },
  readMoreText: {
    color: "#ed424b",
    fontSize: 14,
    fontWeight: "600",
  }

});