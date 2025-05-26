import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

import { BlurView } from 'expo-blur';
import SectionTitle from '../../components/PartHeader.js/SectionTitle';
import { API_END_POINT_URL_LOCAL } from '../../constant/constant';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const SPACING = 20;

export default function Doctors({Refresh}) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, [Refresh]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/doctors`);
      setDoctors(response.data.data);
      setLoading(false);

    } catch (err) {
      console.log('Failed to',err.response.data)
      setError('Failed to fetch doctors');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading doctors...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const BlurComponent = Platform.OS === 'ios' ? BlurView : View;
  const sortedDoctor = doctors.sort((a,b)=> a.position - b.position)
  return (
    <View style={styles.container}>

      <View style={{ padding: 20 }}>
        <SectionTitle
          title="Our Specialists"
          subtitle="Find the best pet doctors near you"
          variant="primary"
        />

      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + SPACING}
      >
        {sortedDoctor.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            style={styles.card}
            activeOpacity={0.95}
          >
            <Image
              source={{ uri: doctor.imageUrl.url }}
              style={styles.doctorImage}
            />

            <BlurComponent
              intensity={Platform.OS === 'ios' ? 70 : undefined}
              style={styles.infoContainer}
              tint="light"
            >
              <View style={styles.nameContainer}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                {doctor.is_best && (
                  <View style={styles.bestDoctorBadge}>

                    <Text style={styles.bestDoctorText}>Top Rated</Text>
                  </View>
                )}
              </View>

              <Text style={styles.specialization}>{doctor.specialization}</Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statText}>{doctor.experience}</Text>
                  {doctor.description && (
                     <Text style={styles.statText}>{doctor.description}</Text>
                  )}
          
                </View>

              </View>


            </BlurComponent>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContent: {
    padding: SPACING,
    paddingRight: SPACING / 2,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: SPACING,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  doctorImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginBottom: 8,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  bestDoctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestDoctorText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 0,
    fontWeight: '600',
  },
  specialization: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  statText: {
    marginLeft: 0,
    fontSize: 14,
    color: '#666',
  }
});
