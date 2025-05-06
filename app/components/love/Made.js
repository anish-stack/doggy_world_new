import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

export default function Made() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Made With ❤ By HBS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom:50,

  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});
