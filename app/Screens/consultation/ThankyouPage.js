import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

const ThankYouPage = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('./thank-you.png')}
          style={styles.image}
        />
        <Text style={styles.heading}>Thank You!</Text>
        <Text style={styles.message}>
          Your appointment has been successfully booked
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Go Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe8e8', // Subtle red background shade
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    width: '90%',
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 20,
    tintColor: '#d64444', // Red tint for the image
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d64444', // Vibrant red
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#d64444', // Main red color
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#d64444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ThankYouPage;
