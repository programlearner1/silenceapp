import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';

// Get FCM token
export const getFCMToken = async () => {
  try {
    const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID key is not configured');
    }

    // Request notification permission if not granted
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey
    });

    if (currentToken) {
      console.log('FCM Token obtained successfully');
      return currentToken;
    } else {
      throw new Error('No registration token available');
    }
  } catch (err) {
    console.error('Error retrieving FCM token:', err);
    return null;
  }
};

export const sendNotification = async (message: string, title: string, phoneNumbers?: string[]) => {
  try {
    const token = await getFCMToken();
    if (!token) {
      throw new Error('No FCM token available');
    }

    const response = await fetch('/.netlify/functions/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        message,
        title,
        phoneNumbers
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to send notification');
    }

    console.log('Notification sent successfully!');
    return true;
  } catch (error) {
    console.error('Error sending notification:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

// Test notification function
export const sendTestNotification = async () => {
  return sendNotification(
    "This is a test notification from the geofence app!",
    "Test Notification"
  );
}; 