import React, { useState, useEffect, useRef } from "react";
import { Button, TextField, Checkbox, FormControlLabel, CircularProgress } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./LocationForm.css";
import { sendNotification } from "../utils/sendSMS";

// Define a custom Leaflet icon
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

const LocationForm: React.FC = () => {
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
  const mapRef = useRef<any>(null);

  // Load saved locations on component mount
  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    const locationWatcher = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          checkUserLocation(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, 600000); // Check every 10 mins
  
    return () => clearInterval(locationWatcher);
  }, [locations]);
  
  const loadLocations = () => {
    const storedLocations = localStorage.getItem("locations");
    if (storedLocations) {
      setLocations(JSON.parse(storedLocations));
    }
  };

  const fetchAddress = async (lat: number, lng: number) => {
    try {
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
      } else {
        setError("Unable to fetch address");
      }
    } catch (err) {
      console.error("Error fetching address:", err);
      setError("Error fetching address");
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
      },
      (error) => {
        setError("Unable to retrieve location");
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
      setError("Location coordinates are required");
      return;
    }

    if (!location.phoneNumbers) {
      setError("Please enter at least one phone number");
      return;
    }

    // Validate phone numbers
    const phoneNumberList = location.phoneNumbers
      .split(',')
      .map(num => num.trim())
      .filter(num => num);

    if (phoneNumberList.length === 0) {
      setError("Please enter valid phone numbers");
      return;
    }

    const newLocation = { 
      ...location,
      messageSent: false,
      phoneNumbers: phoneNumberList.join(', ') // Store cleaned phone numbers
    };
    const updatedLocations = [...locations, newLocation];

    try {
      localStorage.setItem("locations", JSON.stringify(updatedLocations));
      setLocations(updatedLocations);
      setError(null);
    } catch (error) {
      console.error("Error saving location:", error);
      setError("Error saving location");
    }
  };

  // Test notification function
  const testNotification = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!location.phoneNumbers) {
        setError("Please enter at least one phone number");
        return;
      }

      // Split phone numbers by comma and remove whitespace
      const phoneNumberList = location.phoneNumbers
        .split(',')
        .map(num => num.trim())
        .filter(num => num);

      if (phoneNumberList.length === 0) {
        setError("Please enter valid phone numbers");
        return;
      }

      // Validate phone number format
      const invalidNumbers = phoneNumberList.filter(num => {
        const cleaned = num.replace(/[^\d+]/g, '');
        return cleaned.length < 10; // Basic validation for minimum length
      });

      if (invalidNumbers.length > 0) {
        setError(`Invalid phone number format: ${invalidNumbers.join(', ')}`);
        return;
      }

      try {
        await sendNotification(
          "This is a test notification from the geofence app!",
          "Test Notification",
          phoneNumberList
        );
        setError("Notification sent successfully!");
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Failed to send notification. Check console for details.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="map-container">
        <MapContainer
          center={[location.latitude || 0, location.longitude || 0]}
          zoom={15}
          style={{ width: "100%", height: "400px", borderRadius: "8px" }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker 
            position={[location.latitude || 0, location.longitude || 0]} 
            draggable 
            eventHandlers={{ dragend: handleMarkerDragEnd }}
          >
            <Popup>
              Latitude: {location.latitude} <br /> 
              Longitude: {location.longitude}
            </Popup>
          </Marker>
          <Circle 
            center={[location.latitude || 0, location.longitude || 0]} 
            radius={location.radius} 
            color="blue" 
          />
        </MapContainer>
      </div>

      <form className="location-form">
        <div className="button-group">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={getCurrentLocation} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Get Current Location"}
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={testNotification}
            disabled={!location.phoneNumbers || loading}
          >
            Test Notification
          </Button>
        </div>

        {error && <p className="error-message">{error}</p>}

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
        >
          Save Location
        </Button>
      </form>
    </div>
  );
};

export default LocationForm;
