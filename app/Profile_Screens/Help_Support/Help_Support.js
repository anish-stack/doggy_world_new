
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react-native';

const locations = [
  {
    name: 'Main Centre: Sector 8, Rohini',
    address: 'Plot 147, Pocket B 6, Sector 8, Rohini, New Delhi 110085, India',
    phone: '+91 9811299059',
  },
  {
    name: 'Sector 24, Rohini branch',
    address: 'Plot No 33, Pocket 16, Sector 24 Rohini, New Delhi-110085',
    phone: '+91-8287853323',
    landline: '011-41657494',
  },
  {
    name: 'Derawal Nagar Branch',
    address: 'b-181/1, Opposite Vardhman Royal Plaza, Derawal Nagar, Model Town, Delhi 110009, India',
    phone: '+91 9811299810',
  },
  {
    name: 'Paschim Vihar Branch',
    address: 'B 19, Shubham Enclave, Near Patanjali Store, Opposite District Park, Paschim Vihar, New Delhi 110063, India',
    phone: '+91 88824939949',
  },
];

export default function Help_Support() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleCall = (number) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleWhatsApp = (number) => {
    Linking.openURL(`https://wa.me/${number.replace(/[^0-9]/g, '')}`);
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Form submitted:', form);
    // Reset form
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>We're here to help you</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleWhatsApp('919811299059')}
        >
          <MessageCircle size={24} color="#25D366" />
          <Text style={styles.actionText}>WhatsApp Us</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleCall('919811299059')}
        >
          <Phone size={24} color="#007AFF" />
          <Text style={styles.actionText}>Call Us</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEmail('Info@doggyworld.in')}
        >
          <Mail size={24} color="#FF2D55" />
          <Text style={styles.actionText}>Email Us</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Locations</Text>
        {locations.map((location, index) => (
          <View key={index} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MapPin size={20} color="#B32113" />
              <Text style={styles.locationName}>{location.name}</Text>
            </View>
            <Text style={styles.address}>{location.address}</Text>
            <View style={styles.contactButtons}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleCall(location.phone)}
              >
                <Phone size={16} color="#007AFF" />
                <Text style={styles.contactButtonText}>{location.phone}</Text>
              </TouchableOpacity>
              {location.landline && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleCall(location.landline)}
                >
                  <Phone size={16} color="#007AFF" />
                  <Text style={styles.contactButtonText}>{location.landline}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Your Message"
            value={form.message}
            onChangeText={(text) => setForm({ ...form, message: text })}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.companyName}>Doggy World Ventures Pvt. Ltd.</Text>
        <TouchableOpacity onPress={() => handleEmail('Info@doggyworld.in')}>
          <Text style={styles.email}>Info@doggyworld.in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    backgroundColor: '#B32113',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 12,
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
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  address: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  contactButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
  },
  contactButtonText: {
    marginLeft: 8,
    color: '#1F2937',
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#B32113',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#B32113',
    textDecorationLine: 'underline',
  },
});