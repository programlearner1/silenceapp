import { getToken } from 'firebase/messaging';
import { messaging } from '../firebase';

interface NotificationPreferences {
  locationAlerts: boolean;
  silentMode: boolean;
  notificationSound: boolean;
  vibration: boolean;
}

// Get FCM token and register device
export const registerDevice = async (phoneNumber: string) => {
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

    const deviceToken = await getToken(messaging, {
      vapidKey: vapidKey
    });

    if (!deviceToken) {
      throw new Error('No registration token available');
    }

    // Register device with backend
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceToken,
        platform: 'web',
        phoneNumber
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to register device');
    }

    return deviceToken;
  } catch (err) {
    console.error('Error registering device:', err);
    throw err;
  }
};

// Subscribe to notification topics
export const subscribeToTopic = async (userId: string, topic: string) => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/subscribe-topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        topic
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to subscribe to topic');
    }

    return true;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
};

// Send notification to specific phone numbers
export const sendNotification = async (
  message: string,
  title: string,
  phoneNumbers: string[],
  options: {
    priority?: 'normal' | 'high';
    data?: Record<string, string>;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string }>;
  } = {}
) => {
  try {
    console.log('Starting notification process...');

    // Clean phone numbers
    const cleanPhoneNumbers = phoneNumbers.map(num => num.replace(/[^\d+]/g, ''));

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumbers: cleanPhoneNumbers,
        title,
        message,
        priority: options.priority || 'high',
        data: {
          ...options.data,
          timestamp: new Date().toISOString(),
          source: 'geofence-app'
        }
      })
    });

    const data = await response.json();
    console.log('Notification response:', data);

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to send notification');
    }

    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Test notification
export const sendTestNotification = async (phoneNumber: string) => {
  return sendNotification(
    "This is a test notification from the geofence app!",
    "Test Notification",
    [phoneNumber],
    {
      priority: 'high',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Details'
        }
      ]
    }
  );
}; 