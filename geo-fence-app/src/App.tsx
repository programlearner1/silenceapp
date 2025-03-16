import React, { useEffect, useState } from "react";
import { LocationProvider } from "./contexts/LocationContext";
import LocationForm from "./components/LocationForm";
import LocationList from "./components/LocationList";
import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { Alert, Snackbar } from "@mui/material";

const App: React.FC = () => {
  const [notificationStatus, setNotificationStatus] = useState<{
    show: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Register service worker and request notification permission
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("Service Worker registered with scope:", registration.scope);
        
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission denied.");
        }

        // Get FCM token
        const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          throw new Error("VAPID key not configured");
        }

        const currentToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log("FCM Token:", currentToken);
          setNotificationStatus({
            show: true,
            message: 'Notifications enabled successfully!',
            severity: 'success'
          });
        } else {
          throw new Error("No registration token available");
        }

        // Set up message listener
        onMessage(messaging, (payload) => {
          console.log("New notification:", payload);
          const title = payload.notification?.title || "New Notification";
          const body = payload.notification?.body || "";
          
          new Notification(title, { body });
          
          setNotificationStatus({
            show: true,
            message: body || 'New notification received',
            severity: 'success'
          });
        });
      } catch (err) {
        console.error("Error in Firebase setup:", err);
        setNotificationStatus({
          show: true,
          message: 'Error setting up notifications. Check console for details.',
          severity: 'error'
        });
      }
    };

    initializeApp();
  }, []);

  return (
    <LocationProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">GeoFence App</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <LocationForm />
            <LocationList />
          </div>
        </div>
        <Snackbar 
          open={notificationStatus.show} 
          autoHideDuration={6000} 
          onClose={() => setNotificationStatus(prev => ({ ...prev, show: false }))}
        >
          <Alert 
            severity={notificationStatus.severity} 
            onClose={() => setNotificationStatus(prev => ({ ...prev, show: false }))}
          >
            {notificationStatus.message}
          </Alert>
        </Snackbar>
      </div>
    </LocationProvider>
  );
};

export default App;
