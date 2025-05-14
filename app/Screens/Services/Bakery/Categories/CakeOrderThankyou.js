import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CakeOrderThankyou() {
  const route = useRoute()
  const { booking } = route.params || {}
  const [timeLeft, setTimeLeft] = useState(10);
  const navigation = useNavigation();

  useEffect(() => {
    
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else {
      // Navigate to home when timer reaches 0
      navigation.navigate('Home');
    }
  }, [timeLeft, navigation]);

  const handleHomePress = () => {
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      {/* Confetti background */}
      <View style={styles.confettiContainer}>
        {Array.from({ length: 30 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.confetti,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: [
                  '#FF9FF3', '#FECA57', '#FF6B6B',
                  '#48DBFB', '#1DD1A1', '#F368E0'
                ][Math.floor(Math.random() * 6)],
                height: Math.random() * 10 + 5,
                width: Math.random() * 10 + 5,
                transform: [{ rotate: `${Math.random() * 360}deg` }]
              }
            ]}
          />
        ))}
      </View>

      {/* Cake icon */}
      <View style={styles.cakeContainer}>
        <View style={styles.cake}>
          <View style={styles.cakeTop}>
            <View style={styles.candle} />
          </View>
          <View style={styles.cakeMiddle} />
          <View style={styles.cakeBottom} />
        </View>
      </View>

      <Text style={styles.title}>Thank You!</Text>
      <Text style={styles.message}>
        Your delicious cake order has been confirmed.
      </Text>
      <Text style={styles.subMessage}>
        We're baking up your sweet treats with love!
      </Text>

      <View style={styles.orderNumberContainer}>
        <Text style={styles.orderNumberLabel}>Order #</Text>
        <Text style={styles.orderNumber}>{booking || ''}</Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          Returning to Home in <Text style={styles.timerDigit}>{timeLeft}</Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={handleHomePress}>
        <Text style={styles.homeButtonText}>Go Home Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
    padding: 20,
  },
  confettiContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B95',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  message: {
    fontSize: 18,
    marginBottom: 8,
    color: '#555',
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    marginBottom: 25,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderNumberLabel: {
    fontSize: 16,
    color: '#888',
    marginRight: 5,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B95',
  },
  timerContainer: {
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#FFD3E0',
    borderRadius: 20,
    padding: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  timerText: {
    fontSize: 16,
    color: '#666',
  },
  timerDigit: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#FF6B95',
  },
  homeButton: {
    backgroundColor: '#FF6B95',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  homeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cakeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cake: {
    alignItems: 'center',
  },
  cakeTop: {
    width: 100,
    height: 20,
    backgroundColor: '#FFB6C1',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  candle: {
    width: 6,
    height: 25,
    backgroundColor: '#FFF',
    position: 'absolute',
    top: -20,
    borderRadius: 3,
  },
  cakeMiddle: {
    width: 120,
    height: 30,
    backgroundColor: '#FFC0CB',
  },
  cakeBottom: {
    width: 140,
    height: 30,
    backgroundColor: '#FFD700',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});