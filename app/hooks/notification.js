import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert, AppState } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

const FCM_TOKEN_STORAGE_KEY = '@app:fcmToken';
const DEVICE_ID_STORAGE_KEY = '@app:deviceId';

// Configure expo notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const requestNotificationsPermission = async () => {
  const authStatus = await messaging().requestPermission();
  return {
    status:
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
        ? 'granted'
        : 'denied',
  };
};

const requestAndroidPermission = async (permission) => {
  try {
    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Android permission error:', err);
    return false;
  }
};

// Get and store device ID
const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);

    if (!deviceId) {
      const generateCustomUUID = () => {
        return Math.floor(Math.random() * 999999999) + 100000000; // Random number between 100,000,000 and 999,999,999
      };
      const uuid = generateCustomUUID()
      const deviceName = Device.deviceName || 'unknown';
      const deviceType = getDeviceTypeName(Device.deviceType);

      // Combine UUID with name and type for traceable ID
      deviceId = `${deviceName}_${deviceType}_${uuid}`;

      await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      console.log('✅ New device ID generated:', deviceId);
    } else {
      console.log('✅ Existing device ID loaded:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('❌ Error getting device ID:', error);
    return null;
  }
};

const getDeviceTypeName = (type) => {
  switch (type) {
    case Device.DeviceType.PHONE:
      return 'PHONE';
    case Device.DeviceType.TABLET:
      return 'TABLET';
    case Device.DeviceType.DESKTOP:
      return 'DESKTOP';
    case Device.DeviceType.TV:
      return 'TV';
    default:
      return 'UNKNOWN';
  }
};

// Request permission for Expo Notifications
const requestExpoNotificationPermission = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Function to show notification using expo-notifications
const showExpoNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Show immediately
  });
};

const useNotificationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState('not-determined');
  const [isGranted, setIsGranted] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  
  // Save FCM token to storage
  const storeFcmToken = async (token) => {
    try {
      await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    } catch (error) {
      console.error('❌ Error storing FCM token:', error);
    }
  };
  
  // Get stored FCM token
  const getStoredFcmToken = async () => {
    try {
      return await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    } catch (error) {
      console.error('❌ Error retrieving FCM token:', error);
      return null;
    }
  };

  const requestPermission = useCallback(async () => {
    try {
      // Request permissions for Firebase Messaging
      const status = await Platform.select({
        ios: async () => {
          const { status } = await requestNotificationsPermission();
          return status;
        },
        android: async () => {
          if (Platform.Version >= 33) {
            const granted = await requestAndroidPermission('android.permission.POST_NOTIFICATIONS');
            return granted ? 'granted' : 'denied';
          }
          return 'granted';
        },
        default: async () => 'not-determined',
      })();

      // Request permissions for Expo Notifications
      const expoPermissionGranted = await requestExpoNotificationPermission();
      
      const granted = status === 'granted' && expoPermissionGranted;
      setPermissionStatus(granted ? 'granted' : 'denied');
      setIsGranted(granted);

      if (granted) {
        // Get device ID
        const id = await getDeviceId();
        setDeviceId(id);
        console.log('📱 Device ID:', id);
        
        // Get FCM token
        const token = await messaging().getToken();
        console.log('🔥 FCM Token:', token);
        setFcmToken(token);
        await storeFcmToken(token);
      }

      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Initialize device ID and stored FCM token
  useEffect(() => {
    const initializeData = async () => {
      const id = await getDeviceId();
      setDeviceId(id);
      
      const storedToken = await getStoredFcmToken();
      if (storedToken) {
        setFcmToken(storedToken);
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    requestPermission();

    // Token refresh listener
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      console.log('🔄 FCM Token refreshed:', token);
      setFcmToken(token);
      await storeFcmToken(token);
    });

    // Foreground listener - using Expo notifications instead of Alert
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📩 FCM Message in foreground:', remoteMessage);
      
      // Show notification using Expo Notifications
      await showExpoNotification(
        remoteMessage.notification?.title || 'New Notification',
        remoteMessage.notification?.body || '',
        remoteMessage.data
      );
    });

    // When app opened from background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('🔄 App opened from background notification:', remoteMessage);
    });

    // App launched from quit state
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('🚀 App launched from quit state via notification:', remoteMessage);
      }
    });

    // Set background handler (only once globally)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('📩 Message handled in background:', remoteMessage);
    });

    // App state change listener to refresh token when app comes to foreground
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && isGranted) {
        const token = await messaging().getToken();
        if (token !== fcmToken) {
          console.log('🔄 FCM Token updated on app foregrounding:', token);
          setFcmToken(token);
          await storeFcmToken(token);
        }
      }
    });

    // Set up Expo Notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Expo Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User tapped on notification:', response);
    });

    // Cleanup
    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp();
      unsubscribeTokenRefresh();
      subscription.remove();
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [requestPermission, isGranted, fcmToken]);

  // Helper function to display notifications using Expo
  const showNotification = async (title, body, data = {}) => {
    return showExpoNotification(title, body, data);
  };

  return { 
    permissionStatus, 
    isGranted, 
    requestPermission, 
    fcmToken,
    deviceId,
    // Expose methods to get token and device ID directly
    getToken: async () => fcmToken || await getStoredFcmToken(),
    getDeviceId: async () => deviceId || await getDeviceId(),
    // Add method to show notifications
    showNotification
  };
};

export default useNotificationPermission;