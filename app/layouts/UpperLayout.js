import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function UpperLayout({ title, isBellShow = true, isSearchShow = true }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { CartCount } = useSelector((state) => state.cart);

  const HeaderButton = ({ icon, onPress, badge }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.iconButton}
    >
      <Icon name={icon} size={22} color="#AA0000" />
      {badge != null && <Text style={styles.badge}>{badge}</Text>}

    </TouchableOpacity>
  );

  const Container = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios' ? {
    intensity: 100,
    tint: 'light'
  } : {};

  return (
    <Container style={[styles.container]} {...containerProps}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={18} color="#000" />
          <Text style={styles.title} numberOfLines={1}>
            {title || "Enter Your Title"}
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          {isSearchShow && (

            <HeaderButton
              icon="search"
              onPress={() => navigation.navigate('search')}
            />
          )}

          {isBellShow && (
            <HeaderButton
              icon="bell-o"
              onPress={() => { }}
            />
          )}

          <HeaderButton
            icon="shopping-bag"
            onPress={() => navigation.navigate('cart')}
            badge={CartCount || 0}
          />
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    backgroundColor: Platform.select({
      ios: 'transparent',

      android: '#fff',
      default: '#fff'
    }),
    borderBottomWidth: Platform.select({
      ios: 0,
      android: 1,
      default: 1
    }),
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: Platform.select({
      ios: 44,
      android: 56,
      default: 60
    }),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: Platform.select({
      ios: 17,
      default: 18
    }),
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Platform.select({
      ios: 16,
      default: 12
    }),
  },
  iconButton: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(170, 0, 0, 0.05)',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4500',
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
    paddingHorizontal: 4,
    borderWidth: Platform.OS === 'ios' ? 1.5 : 0,
    borderColor: '#fff',
  },
});