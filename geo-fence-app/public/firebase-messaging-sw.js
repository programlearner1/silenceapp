importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

// Firebase configuration will be injected during build time
const firebaseConfig = {
  apiKey: "AIzaSyCRhcD6DjPKUwmgEM42YTwQj-dJusatXlQ",
  authDomain: "phone-silencer-33c2f.firebaseapp.com",
  projectId: "phone-silencer-33c2f",
  storageBucket: "phone-silencer-33c2f.appspot.com",
  messagingSenderId: "238705445203",
  appId: "1:238705445203:web:d91bda613a6fa1ccc979a6",
  measurementId: "G-9NGTZ446ES"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Received background message:', payload);

    try {
      const notificationTitle = payload.notification?.title || 'Location Alert';
      const notificationOptions = {
        body: payload.notification?.body || 'You have entered a geofence zone',
        icon: '/firebase-logo.png',
        badge: '/firebase-logo.png',
        vibrate: [100, 50, 100],
        requireInteraction: true,
        data: payload.data,
        actions: [
          {
            action: 'view',
            title: 'View'
          }
        ]
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    } catch (error) {
      console.error('[Service Worker] Error showing notification:', error);
    }
  });

  // Handle notification click
  self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click:', event);
    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
        .catch(error => {
          console.error('[Service Worker] Error handling notification click:', error);
        })
    );
  });

} catch (error) {
  console.error('[Service Worker] Initialization error:', error);
}
