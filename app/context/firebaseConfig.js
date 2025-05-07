import firebase from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyCr90tygQHq61Gr2ZFMl8i8ip8ZPWvJ6w4',
  authDomain: 'doggy-f32b6.firebaseapp.com',
  projectId: 'doggy-f32b6',
  storageBucket: 'doggy-f32b6.appspot.com',
  messagingSenderId: '613275360172',
  databaseURL: 'https://doggy-f32b6.firebaseio.com',
  appId: '1:613275360172:android:1aade64b24303231df3809',
};

if (!firebase.apps.length) {
  console.log('✅ Firebase not initialized. Initializing now...');
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully.');
} else {
  console.log('✅ Firebase already initialized.');
}

export default firebase;
