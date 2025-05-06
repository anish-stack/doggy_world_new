import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Importing your images
import codIcon from './cash-on-delivery.png';
import deliveryIcon from './shipped.png';
import returnIcon from './replacement.png';
import freshIcon from './fresh (1).png';
import not from './no-entry.png';

// PolicyCards Component
export default function PolicyCards({
  Free_Delivery = true,
  Exchange_policy = true,
  COD_AVAILABLE = true,
  Fresh_Stock = true,
}) {
  // Policy data
  const policies = [
    {
      title: 'Pay on Delivery',
      icon: codIcon,
      isActive: COD_AVAILABLE,
    },
    {
      title: 'No Returns & Exchange',
      icon: returnIcon,
      isActive: Exchange_policy,
    },
    {
      title: 'Fresh Stock',
      icon: freshIcon,
      isActive: Fresh_Stock,
    },
    {
      title: 'Free Delivery',
      icon: deliveryIcon,
      isActive: Free_Delivery,
    },
  ];

  return (
    <View style={styles.container}>
      {policies.map((policy, index) => (
        <View key={index} style={styles.card}>
          <Image source={policy.icon} style={styles.icon} />
          <Text  style={[styles.text, !policy.isActive && styles.textRed]}>
            {policy.title}
          </Text>
          {!policy.isActive && (
            <Image source={not} style={styles.notIcon} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingVertical: 20,
      borderWidth: 0,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 50, 
      width: 70, 
      
      height: 70,
      elevation: 3, 
      padding:5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      alignItems: 'center',
      justifyContent: 'center', 
    
    },
    icon: {
        
      width:33,
      height:33,
        objectFit:'contain',
        resizeMode: 'contain',
    },
    notIcon: {
     
      position: 'absolute',
      width: 25, // Size of "not" icon
      objectFit:'contain',
      resizeMode: 'contain',
      height: 25,
   
    },
    text: {
      fontSize: 9,
      color: 'black',
      textAlign: 'center',

    },
    textRed: {
      color: 'red',
    },
  });
  