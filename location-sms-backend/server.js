const express = require("express");
const cors = require("cors");
const admin = require('./firebaseAdmin');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (Replace with a database in production)
const deviceRegistry = {
  devices: new Map(), // Store device tokens
  phoneNumbers: new Map(), // Store phone number to device token mapping
  users: new Map(),   // Store user preferences
};

// Register device with phone number
app.post("/register-device", async (req, res) => {
  try {
    const { deviceToken, platform, phoneNumber } = req.body;
    
    if (!phoneNumber || !deviceToken) {
      return res.status(400).json({
        success: false,
        error: "Phone number and device token are required"
      });
    }

    // Clean the phone number (remove spaces, dashes, etc.)
    const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Store device information
    deviceRegistry.devices.set(deviceToken, {
      phoneNumber: cleanPhoneNumber,
      platform,
      lastSeen: new Date().toISOString()
    });

    // Map phone number to device token
    if (!deviceRegistry.phoneNumbers.has(cleanPhoneNumber)) {
      deviceRegistry.phoneNumbers.set(cleanPhoneNumber, new Set());
    }
    deviceRegistry.phoneNumbers.get(cleanPhoneNumber).add(deviceToken);

    console.log(`Device registered for phone number ${cleanPhoneNumber}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send notification to specific phone numbers
app.post("/send-notification", async (req, res) => {
  try {
    const { phoneNumbers, title, message, data, priority = "high" } = req.body;

    if (!phoneNumbers || !phoneNumbers.length) {
      return res.status(400).json({
        success: false,
        error: "At least one phone number is required"
      });
    }

    // Clean phone numbers
    const cleanPhoneNumbers = phoneNumbers.map(num => num.replace(/[^\d+]/g, ''));
    console.log('Sending notifications to:', cleanPhoneNumbers);

    // Collect all device tokens for the specified phone numbers
    const deviceTokens = new Set();
    cleanPhoneNumbers.forEach(phoneNumber => {
      const tokens = deviceRegistry.phoneNumbers.get(phoneNumber);
      if (tokens) {
        tokens.forEach(token => deviceTokens.add(token));
      }
    });

    if (deviceTokens.size === 0) {
      return res.status(400).json({
        success: false,
        error: "No registered devices found for the provided phone numbers"
      });
    }

    // Send notifications to all devices
    const notifications = Array.from(deviceTokens).map(token => {
      const deviceInfo = deviceRegistry.devices.get(token);
      const notificationConfig = {
        token,
        notification: {
          title,
          body: message
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          notificationType: 'location_alert'
        },
        android: {
          priority,
          notification: {
            channelId: 'location_alerts',
            icon: 'ic_notification',
            color: '#2196F3',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
            notification_priority: 'PRIORITY_HIGH'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              alert: {
                title,
                body: message
              },
              sound: 'default',
              badge: 1,
              'mutable-content': 1,
              'content-available': 1
            }
          }
        },
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            title,
            body: message,
            icon: '/firebase-logo.png',
            badge: '/firebase-logo.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'View Details'
              }
            ]
          }
        }
      };

      return admin.messaging().send(notificationConfig);
    });

    const results = await Promise.allSettled(notifications);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      success: true,
      summary: {
        total: notifications.length,
        successful,
        failed,
        phoneNumbers: cleanPhoneNumbers
      },
      results: results.map((result, index) => ({
        token: Array.from(deviceTokens)[index],
        phoneNumber: deviceRegistry.devices.get(Array.from(deviceTokens)[index]).phoneNumber,
        success: result.status === 'fulfilled',
        messageId: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  const status = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    metrics: {
      registeredDevices: deviceRegistry.devices.size,
      registeredPhoneNumbers: deviceRegistry.phoneNumbers.size
    }
  };
  res.json(status);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
