import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
}

export default function App() {
  useEffect(() => {
    // Request permission and get token
    const setupPushNotifications = async () => {
      const hasPermission = await requestUserPermission();
      
      if (hasPermission) {
        // Get FCM token
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        
        // Send token to your server with phone number
        await registerDevice(token);
      }
    };

    setupPushNotifications();

    // Listen for FCM messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification.title,
        remoteMessage.notification.body
      );
    });

    return unsubscribe;
  }, []);

  return (
    // Your app UI here
  );
} 