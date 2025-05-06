import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome'; // Make sure FontAwesome is installed

const RatingStars = ({ rating }) => {
  const fullStars = Math.floor(rating); // Number of full stars
  const hasHalfStar = rating % 1 >= 0.5; // Check if there's a half star
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0); // Remaining empty stars

  return (
    <View style={styles.ratingContainer}>
      {[...Array(fullStars)].map((_, index) => (
        <Icon key={`full-${index}`} name="star" style={styles.starIcon} />
      ))}
      {hasHalfStar && <Icon name="star-half-o" style={styles.starIcon} />}
      {[...Array(emptyStars)].map((_, index) => (
        <Icon key={`empty-${index}`} name="star-o" style={styles.starIcon} />
      ))}
    </View>
  );
};



const styles = StyleSheet.create({
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    color: '#B32113', 
    fontSize: 16,
    marginHorizontal: 1,
  },
  clinicRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555', 
  },
});

export default RatingStars;
