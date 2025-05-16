import React, { useState, useEffect, useRef } from "react";
import { 
  Button, 
  TextField, 
  Checkbox, 
  FormControlLabel, 
  CircularProgress,
  Paper,
  Typography
} from "@mui/material";
import { 
  MyLocation as MyLocationIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Phone as PhoneIcon,
  RadioButtonChecked as RadioButtonCheckedIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from 'react-intersection-observer';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./LocationForm.css";
import { sendNotification } from "../utils/sendSMS";

// Custom marker icon
const defaultIcon = new L.Icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Animated map center update component
function AnimatedMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), {
      duration: 1
    });
  }, [center, map]);
  return null;
}

interface LocationFormProps {
  onLocationUpdate: (locations: any[]) => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ onLocationUpdate }) => {
  const [location, setLocation] = useState({
    latitude: 0,
    longitude: 0,
    address: "",
    radius: 100,
    silence: false,
    message: "",
    messageSent: false,
    phoneNumbers: "",
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const { ref: formRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const loadLocations = () => {
    const storedLocations = localStorage.getItem("locations");
    if (storedLocations) {
      const parsedLocations = JSON.parse(storedLocations);
      setLocations(parsedLocations);
      onLocationUpdate(parsedLocations);
    }
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const OPENCAGE_API_KEY = process.env.REACT_APP_OPENCAGE_API_KEY;
      
      if (!OPENCAGE_API_KEY) {
        throw new Error('OpenCage API key is not configured');
      }

      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.results.length > 0) {
        setLocation((prev) => ({ ...prev, address: data.results[0].formatted }));
        setSuccess("Address fetched successfully!");
      } else {
        setError("Unable to fetch address");
      }
    } catch (err) {
      console.error("Error fetching address:", err);
      toast.error("Error fetching address");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation((prev) => ({ ...prev, latitude, longitude }));
        fetchAddress(latitude, longitude);
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
        }
        setLoading(false);
        toast.success("Location updated successfully!");
      },
      (error) => {
        setError("Unable to retrieve location");
        toast.error("Unable to retrieve location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkUserLocation = (currentLat: number, currentLng: number) => {
    locations.forEach((loc) => {
      const distance = getDistanceFromLatLonInMeters(
        currentLat,
        currentLng,
        loc.latitude,
        loc.longitude
      );
      
      if (distance <= loc.radius && loc.message && !loc.messageSent && loc.phoneNumbers) {
        // Split phone numbers and clean them
        const phoneNumberList = loc.phoneNumbers
          .split(',')
          .map(num => num.trim())
          .filter(num => num);

        // Send notification when entering zone
        if (phoneNumberList.length > 0) {
        sendNotification(
          loc.message,
            `Entered ${loc.address || 'Geofence Zone'}`,
            phoneNumberList
        );
        loc.messageSent = true;
        localStorage.setItem("locations", JSON.stringify(locations));
        }
      } else if (distance > loc.radius && loc.messageSent) {
        // Reset message sent flag when leaving zone
        loc.messageSent = false;
        localStorage.setItem("locations", JSON.stringify(locations));
      }
    });
  };

  const handleMarkerDragEnd = (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setLocation((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    fetchAddress(lat, lng);
  };

  const saveLocation = () => {
    if (!location.latitude || !location.longitude) {
      toast.error("Location coordinates are required");
      return;
    }

    if (!location.phoneNumbers) {
      toast.error("Please enter at least one phone number");
      return;
    }

    const phoneNumberList = location.phoneNumbers
      .split(',')
      .map(num => num.trim())
      .filter(num => num);

    if (phoneNumberList.length === 0) {
      toast.error("Please enter valid phone numbers");
      return;
    }

    const newLocation = { 
      ...location,
      messageSent: false,
      phoneNumbers: phoneNumberList.join(', ')
    };

    try {
      const updatedLocations = [...locations, newLocation];
      localStorage.setItem("locations", JSON.stringify(updatedLocations));
      setLocations(updatedLocations);
      onLocationUpdate(updatedLocations);
      setSuccess("Location saved successfully!");
      toast.success("Location saved successfully!");

      // Reset the form
      setLocation({
        latitude: 0,
        longitude: 0,
        address: "",
        radius: 100,
        silence: false,
        message: "",
        messageSent: false,
        phoneNumbers: "",
      });
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Error saving location");
    }
  };

  const testNotification = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!location.phoneNumbers) {
        toast.error("Please enter at least one phone number");
        return;
      }

      const phoneNumberList = location.phoneNumbers
        .split(',')
        .map(num => num.trim())
        .filter(num => num);

      if (phoneNumberList.length === 0) {
        toast.error("Please enter valid phone numbers");
        return;
      }

      const invalidNumbers = phoneNumberList.filter(num => {
        const cleaned = num.replace(/[^\d+]/g, '');
        return cleaned.length < 10;
      });

      if (invalidNumbers.length > 0) {
        toast.error(`Invalid phone numbers: ${invalidNumbers.join(', ')}`);
        return;
      }

      await sendNotification(
        "This is a test notification from the geofence app!",
        "Test Notification",
        phoneNumberList
      );
      
      setSuccess("Test notification sent successfully!");
      toast.success("Test notification sent successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to send notification");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    const locationWatcher = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          checkUserLocation(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get current location");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, 600000);

    return () => clearInterval(locationWatcher);
  }, [locations, checkUserLocation]);

  return (
    <motion.div 
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Paper elevation={3} className="map-container">
        <MapContainer
          center={[location.latitude || 0, location.longitude || 0]}
          zoom={15}
          style={{ width: "100%", height: "400px" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <AnimatedMapCenter center={[location.latitude || 0, location.longitude || 0]} />
          <Marker 
            position={[location.latitude || 0, location.longitude || 0]} 
            draggable 
            eventHandlers={{ dragend: handleMarkerDragEnd }}
          >
            <Popup>
              <Typography variant="body2">
                Latitude: {location.latitude.toFixed(6)} <br /> 
                Longitude: {location.longitude.toFixed(6)}
              </Typography>
            </Popup>
          </Marker>
          <Circle 
            center={[location.latitude || 0, location.longitude || 0]} 
            radius={location.radius} 
            className="leaflet-circle"
          />
        </MapContainer>
      </Paper>

      <motion.div 
        ref={formRef}
        className="location-form"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="button-group">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={getCurrentLocation} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <MyLocationIcon />}
          >
            Get Current Location
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={testNotification}
            disabled={!location.phoneNumbers || loading}
            startIcon={<NotificationsIcon />}
          >
            Test Notification
          </Button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="error-message"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="success-message"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <TextField 
          label="Phone Numbers" 
          value={location.phoneNumbers} 
          onChange={(e) => setLocation((prev) => ({ 
            ...prev, 
            phoneNumbers: e.target.value 
          }))} 
          variant="outlined" 
          fullWidth 
          margin="normal"
          placeholder="Enter phone numbers separated by commas"
          helperText="Example: +1234567890, +9876543210"
          InputProps={{
            startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
          }}
        />

        <TextField 
          label="Address" 
          value={location.address} 
          variant="outlined" 
          fullWidth 
          disabled 
          margin="normal" 
        />

        <TextField 
          label="Radius (meters)" 
          type="number" 
          variant="outlined" 
          fullWidth 
          margin="normal"
          value={location.radius} 
          onChange={(e) => setLocation((prev) => ({ 
            ...prev, 
            radius: parseInt(e.target.value, 10) 
          }))} 
          InputProps={{
            startAdornment: <RadioButtonCheckedIcon color="action" sx={{ mr: 1 }} />
          }}
        />

        <TextField 
          label="Notification Message" 
          value={location.message} 
          onChange={(e) => setLocation((prev) => ({ 
            ...prev, 
            message: e.target.value 
          }))} 
          variant="outlined" 
          fullWidth 
          margin="normal" 
          multiline
          rows={2}
        />

        <FormControlLabel 
          control={
            <Checkbox 
              checked={location.silence} 
              onChange={(e) => setLocation((prev) => ({ 
                ...prev, 
                silence: e.target.checked 
              }))} 
            />
          } 
          label="Enable Silent Mode in this zone" 
        />

        <Button 
          type="button" 
          variant="contained" 
          color="secondary" 
          onClick={saveLocation}
          fullWidth
          size="large"
          startIcon={<SaveIcon />}
          sx={{ mt: 2 }}
        >
          Save Location
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default LocationForm;
