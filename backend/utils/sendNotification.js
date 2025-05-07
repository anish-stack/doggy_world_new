const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.resolve(__dirname, "doggy-f32b6-firebase-adminsdk-fbsvc-d409d66f45.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const sendNotification = async (token,title,body) => {
  const fcmToken = token

  const message = {
    token: fcmToken,
    notification: {
      title: title || "👑 Royal Proclamation!",
      body: body || "Hear ye, hear ye! Anish and Manish have ascended the throne. All hail the kings who rule with wisdom, strength, and unstoppable swag! 👑🔥🦁",
    }
   
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent successfully:", response);
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
  }
};

module.exports = sendNotification;
