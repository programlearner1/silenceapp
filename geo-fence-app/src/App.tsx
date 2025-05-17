import React, { useEffect, useState } from "react";
import { LocationProvider } from "./contexts/LocationContext";
import LocationForm from "./components/LocationForm";
import LocationList from "./components/LocationList";
import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { Alert, Snackbar, Container, AppBar, Toolbar, Typography, Box, useTheme, useMediaQuery } from "@mui/material";
import { LocationOn as LocationIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { sendNotification } from "./utils/sendSMS";
import NotificationTest from './components/NotificationTest';
import './App.css';

interface Location {
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  silence: boolean;
  message: string;
  messageSent: boolean;
  phoneNumbers: string;
}

const App: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [notificationStatus, setNotificationStatus] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (!messaging) {
          throw new Error("Firebase messaging not initialized");
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission denied");
        }

        // Get FCM token
        const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          throw new Error("VAPID key not configured");
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        console.log("Service Worker registered with scope:", registration.scope);

        const currentToken = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration
        });

        if (currentToken) {
          console.log("FCM Token:", currentToken);
          setNotificationStatus({
            show: true,
            message: 'Notifications enabled successfully!',
            type: 'success'
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
            type: 'success'
          });
        });
      } catch (err) {
        console.error("Error in Firebase setup:", err);
        setNotificationStatus({
          show: true,
          message: err instanceof Error ? err.message : 'Error setting up notifications',
          type: 'error'
        });
      }
    };

    initializeApp();
  }, []);

  // Load saved locations on component mount
  useEffect(() => {
    const savedLocations = localStorage.getItem("locations");
    if (savedLocations) {
      setLocations(JSON.parse(savedLocations));
    }
  }, []);

  // Handle location updates from LocationForm
  const handleLocationUpdate = (updatedLocations: Location[]) => {
    setLocations(updatedLocations);
    localStorage.setItem("locations", JSON.stringify(updatedLocations));
  };

  // Delete location
  const handleDelete = (index: number) => {
    const updatedLocations = locations.filter((_, i) => i !== index);
    setLocations(updatedLocations);
    localStorage.setItem("locations", JSON.stringify(updatedLocations));
  };

  // Edit location
  const handleEdit = (location: Location, index: number) => {
    // You can implement edit functionality here
    console.log("Editing location:", location, "at index:", index);
  };

  // Send notification for a specific location
  const handleNotify = async (location: Location) => {
    try {
      await sendNotification(
        location.message || "You have entered the geofence zone",
        `Location Alert: ${location.address}`
      );
      setNotificationStatus({
        show: true,
        message: "Notification sent successfully!",
        type: "success"
      });
    } catch (error) {
      setNotificationStatus({
        show: true,
        message: "Failed to send notification",
        type: "error"
      });
    }
  };

  return (
    <LocationProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AppBar position="static" color="primary" elevation={0}>
          <Toolbar>
            <LocationIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div">
              GeoFence App
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ 
            display: 'grid', 
            gap: 4,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          }}>
            <Box>
              <LocationForm onLocationUpdate={handleLocationUpdate} />
              <NotificationTest />
            </Box>
            <Box>
              <LocationList 
                locations={locations}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onNotify={handleNotify}
              />
            </Box>
          </Box>
        </Container>

        <Snackbar 
          open={notificationStatus.show} 
          autoHideDuration={6000} 
          onClose={() => setNotificationStatus(prev => ({ ...prev, show: false }))}
        >
          <Alert 
            severity={notificationStatus.type} 
            onClose={() => setNotificationStatus(prev => ({ ...prev, show: false }))}
          >
            {notificationStatus.message}
          </Alert>
        </Snackbar>
      </motion.div>
    </LocationProvider>
  );
};

export default App;
