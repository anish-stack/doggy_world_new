import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native"
import { useToken } from "../hooks/useToken"
import { getUser } from "../hooks/getUserHook"
const { width, height } = Dimensions.get('window');

const SIDEBAR_WIDTH = Math.min(width * 0.85, 400);

export default function Sidebar({ open, onClose }) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const navigation = useNavigation()
  const { token, isLoggedIn, deleteToken } = useToken()
  const { user: userData } = getUser()
  const navigationItems = [
    { title: 'Home', icon: 'home', screen: 'Home', requiresAuth: false },
    { title: 'My Appointments', icon: 'calendar', screen: 'Appointments', requiresAuth: true },
    { title: 'Grooming Sessions', icon: 'water', screen: 'Groomings', requiresAuth: true },
    { title: 'Orders', icon: 'cube', screen: 'Orders', requiresAuth: true },
    { title: 'Cakes Order', icon: 'gift', screen: 'cakeorder', requiresAuth: true },
    { title: 'Physio Bookings', icon: 'fitness', screen: 'physioBookings', requiresAuth: true },
    { title: 'Lab & Vaccination', icon: 'medical', screen: 'labVaccinations', requiresAuth: true },
  ];

  const settingsItems = [
    { title: 'Help & Support', icon: 'help-circle', screen: 'Support', requiresAuth: false },

    { title: 'Profile', icon: 'person', screen: 'Profile', requiresAuth: true },
  ];
  const LoginItems = [
    { title: 'Login', icon: 'arrow-forward-outline', screen: 'login', requiresAuth: false },
    { title: 'Register', icon: 'person-add', screen: 'register', requiresAuth: false },
  ]

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: open ? 0 : -SIDEBAR_WIDTH,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  }, [open]);

  const handleLogout = () => {
    deleteToken()
    onClose && onClose()

    navigation.reset({
      index: 0,
      routes: [{ name: "Home" }],
    })
  }
  const handleNavigation = (screen) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleLoginPress = () => {
    onClose();
    navigation.navigate('login');
  };

  const handleRegisterPress = () => {
    onClose();
    navigation.navigate('register');
  };

  const renderNavItem = (item, index) => {
    if (item.requiresAuth && !isLoggedIn) return null;

    return (
      <TouchableOpacity
        key={index}
        style={styles.navItem}
        onPress={() => handleNavigation(item.screen)}
        activeOpacity={0.7}
      >
        <View style={styles.navContent}>
          <View style={styles.navIconContainer}>
            <Ionicons name={item.icon} size={22} color="#B82830" />
          </View>
          <Text style={styles.navText}>{item.title}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <>
      {open && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />
      )}

      <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>


        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>

            {navigationItems.map(renderNavItem)}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SETTINGS</Text>
            {settingsItems.map(renderNavItem)}
          </View>

          {!isLoggedIn && (
            <View style={styles.section}>
              {LoginItems.map(renderNavItem)}
            </View>
          )}

          {isLoggedIn && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                handleLogout();
                onClose();
              }}
            >
              <Ionicons name="log-out" size={22} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 98,
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: height,
    backgroundColor: '#FFFFFF',
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    width: "100%",
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 24,
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  navIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navText: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
    marginHorizontal: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    color: '#EF4444',
    marginLeft: 12,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  version: {
    fontSize: 12,
    color: '#94A3B8',
  },
});