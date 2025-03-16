import React, { useEffect } from 'react';
import { Alert, SafeAreaView, Text, StyleSheet } from 'react-native';
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  return authStatus === messaging.AuthorizationStatus.AUTHORIZED;
}

// Function to register device with your backend
async function registerDevice(token) {
  try {
    const response = await fetch('http://localhost:5000/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        deviceType: 'android', // or 'ios'
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to register device');
    }
    
    console.log('Device registered successfully');
  } catch (error) {
    console.error('Error registering device:', error);
  }
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>GeoFence App</Text>
      <Text style={styles.subtitle}>Notifications are enabled</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 