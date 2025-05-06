import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import logo from '../assets/logo/dogy-world-logo-b.jpg';
import SideBar from './SideBar';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function Header() {
  const [showSideBar, setShowSideBar] = useState(false);
  const { CartCount } = useSelector((state) => state.cart);
  const navigation = useNavigation();

  const handleSideBarToggle = () => {
    setShowSideBar(!showSideBar);
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.flexDirectionContainer}>
            <TouchableOpacity
              onPress={handleSideBarToggle}
              activeOpacity={0.9}
            >
              <Icon name="bars" size={20} color="#B32113" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}

              style={styles.logoContainer}
            >
              <Image source={logo} style={styles.logo} />
            </TouchableOpacity>
          </View>

          <View style={styles.iconsContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('search')}
              style={styles.iconButton}
            >
              <View style={styles.iconWrapper}>
                <Icon name="search" size={20} color="#B32113" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={styles.iconWrapper}>
                <Icon name="bell-o" size={20} color="#B32113" />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('cart')}
              style={styles.iconButton}
            >
              <View style={styles.iconWrapper}>
                <Icon name="shopping-bag" size={20} color="#B32113" />
                {CartCount > 0 && (
                  <View style={styles.cartCountContainer}>
                    <Text style={styles.cartCount}>
                      {CartCount > 99 ? '99+' : CartCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {showSideBar && (
        <SideBar onClose={() => setShowSideBar(false)} open={showSideBar} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',

  },
  flexDirectionContainer: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    padding: 4,
    borderRadius: 8,
  },
  logo: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',

    aspectRatio: 1,
    height: 40,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(179, 33, 19, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B32113',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartCountContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#B32113',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});