import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import UpperLayout from '../../layouts/UpperLayout';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

export default function ClinicScreen({ isUpperLayoutShow = true }) {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigataion = useNavigation()
  const route = useRoute()
  const { id, type, customizedData, Package } = route.params || {};
// console.log(Package)
 

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await axios.get('https://admindoggy.adsdigitalmedia.com/api/clinics?populate=images');
      setClinics(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Unable to load clinics. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const openMap = (mapUrl) => {
    Linking.canOpenURL(mapUrl).then(supported => {
      if (supported) {
        Linking.openURL(mapUrl);
      } else {
        console.log("Don't know how to open URI: " + mapUrl);
      }
    });
  };

  const renderClinicCard = ({ item }) => {

    const imageUrl = item.images[0]?.url || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=900';

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.clinicImage}
            resizeMode="cover"
          />
          {item.opening_stauts && (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Open Now</Text>
            </View>
          )}
          {item.ScanTestAvailable && (
            <View style={styles.scanBadge}>
              <MaterialIcons name="pets" size={16} color="#fff" />
              <Text style={styles.scanText}>Scan Available</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.clinicName}>{item.clinic_name}</Text>
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{item.Rating}</Text>
            </View>
          </View>

          <Text style={styles.address} numberOfLines={2}>
            {item.Address}
          </Text>

          <View style={styles.timeContainer}>
            <MaterialIcons name="access-time" size={16} color="#666" />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>

          <View style={styles.contactContainer}>
            <MaterialIcons name="phone" size={16} color="#666" />
            <Text style={styles.contactText}>{item.contact_details}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openMap(item.Map_Location)}
            >
              <MaterialIcons name="location-on" size={18} color="#fff" />
              <Text style={styles.buttonText}>View on Map</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={() => navigataion.navigate('Book-Grooming', {
              data_of_g: id,
              clinic: item,
              type: type,
              customizedData: customizedData,
              Package: Package
            })} style={styles.bookButton}>
              <MaterialIcons name="calendar-today" size={18} color="#fff" />
              <Text style={styles.buttonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B32113" />
        <Text style={styles.loadingText}>Loading clinics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#B32113" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchClinics}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.container}>
        {isUpperLayoutShow && (
          <UpperLayout title={"Choose a Clinic"} />
        )}
        <FlatList
          data={clinics}
          renderItem={renderClinicCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  clinicImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scanBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#B32113',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scanText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mapButton: {
    flex: 1,
    backgroundColor: '#666',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButton: {
    flex: 1,
    backgroundColor: '#B32113',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#B32113',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});