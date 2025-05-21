import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

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

  const missingFields = requiredFields.filter(field => !config[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
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

const app = initializeApp(firebaseConfig);
let messaging = null;

try {
  // Log Firebase config for debugging (remove in production)
  console.log('Firebase Config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '**********' : undefined
  });

  validateFirebaseConfig(firebaseConfig);
  
  // Initialize Firebase Cloud Messaging
  if ('serviceWorker' in navigator) {
    messaging = getMessaging(app);
    console.log('✅ Firebase Cloud Messaging initialized');
  } else {
    console.warn('⚠️ Service workers are not supported by this browser');
  }

  console.log("API KEY:", process.env.REACT_APP_FIREBASE_API_KEY);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export { app, messaging };