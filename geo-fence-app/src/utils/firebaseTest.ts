import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';

export const testFirebaseSetup = async () => {
  try {
    // Test 1: Check environment variables
    const requiredEnvVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      'REACT_APP_FIREBASE_APP_ID',
      'REACT_APP_FIREBASE_VAPID_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return false;
    }
    console.log('✅ Environment variables check passed');

    // Test 2: Check messaging initialization
    if (!messaging) {
      console.error('❌ Firebase messaging not initialized');
      return false;
    }
    console.log('✅ Firebase messaging initialized');

    // Test 3: Request notification permission and get FCM token
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('❌ Notification permission denied');
      return false;
    }
    console.log('✅ Notification permission granted');

    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('❌ VAPID key not configured');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      console.error('❌ Service worker not registered');
      return false;
    }
    console.log('✅ Service worker registered');

    // Test 4: Get FCM token
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      console.error('❌ Could not get FCM token');
      return false;
    }
    console.log('✅ FCM token obtained:', token);

    // All tests passed
    console.log('✅ All Firebase tests passed');
    return true;
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return false;
  }
}; 