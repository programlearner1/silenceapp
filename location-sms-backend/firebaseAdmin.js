const admin = require('firebase-admin');
const path = require('path');

// Get the absolute path to the service account file
const serviceAccountPath = path.join(__dirname, 'phone-silencer-33c2f-firebase-adminsdk-fbsvc-dd0e8df612.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
  throw error;
}

module.exports = admin; 