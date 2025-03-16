import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Validate Firebase configuration
const validateFirebaseConfig = (config) => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Missing Firebase configuration field: ${field}`);
    }
  }

  // Validate API key format
  if (!config.apiKey.startsWith('AIza')) {
    throw new Error('Invalid Firebase API key format');
  }
};

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let messaging = null;

try {
  validateFirebaseConfig(firebaseConfig);
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Cloud Messaging
  if ('serviceWorker' in navigator) {
    messaging = getMessaging(app);
    console.log('✅ Firebase Cloud Messaging initialized');
  } else {
    console.warn('⚠️ Service workers are not supported by this browser');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export { messaging, getToken, onMessage };