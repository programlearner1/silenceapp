const admin = require('firebase-admin');
require('dotenv').config();

try {
  // Initialize Firebase Admin with credentials from environment variable
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set');
  }

  // Decode the base64 service account string
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
  // Don't exit process, let the server handle the error gracefully
}

module.exports = admin; 