const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK only once
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized || admin.apps.length) return;
  
  try {
    const serviceAccountPath = path.resolve(__dirname, "doggy-f32b6-firebase-adminsdk-fbsvc-f27a94212f.json");
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    firebaseInitialized = true;
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
};


const sendNotification = async (token, title, body) => {
  // Initialize Firebase if not already done
  if (!firebaseInitialized && !admin.apps.length) {
    initializeFirebase();
  }
  
  // Default notification content
  const defaultTitle = "👑 Royal Proclamation!";
  const defaultBody = "Hear ye, hear ye! Anish and Manish have ascended the throne. All hail the kings who rule with wisdom, strength, and unstoppable swag! 👑🔥🦁";
  
  // Validate token
  if (!token) {
    console.warn("⚠️ No FCM token provided, skipping notification");
    return null;
  }
  
  const message = {
    token: token,
    notification: {
      title: title || defaultTitle,
      body: body || defaultBody,
    }
  };
  
  try {
    const response = await admin.messaging().send(message);
    console.log(`✅ [FCM] Notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    // Handle common Firebase errors
    if (error.code === 'messaging/invalid-argument' || error.code === 'messaging/invalid-recipient') {
      console.warn(`⚠️ Invalid FCM token (${token.substring(0, 10)}...): ${error.message}`);
    } else if (error.code === 'app/invalid-credential') {
      console.error("❌ Firebase credential error. Please check service account or server time synchronization");
    } else {
      console.error("❌ Failed to send notification:", error);
    }
    
    // Don't throw the error, just return null to prevent breaking the flow
    return null;
  }
};

// For testing the module directly
if (require.main === module) {
  const testToken = process.env.TEST_FCM_TOKEN;
  if (testToken) {
    sendNotification(testToken, "Test Notification", "This is a test notification")
      .then(() => console.log("Test notification completed"))
      .catch(console.error);
  }
}

module.exports = sendNotification;