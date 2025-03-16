const express = require("express");
const cors = require("cors");
const admin = require('./firebaseAdmin');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage for device tokens (replace with database in production)
const deviceTokens = new Map();

// Register device token with phone number
app.post("/register-device", async (req, res) => {
  try {
    const { phoneNumber, token, deviceType } = req.body;
    
    if (!phoneNumber || !token) {
      return res.status(400).json({
        success: false,
        error: "Phone number and token are required"
      });
    }

    // Store the device token
    deviceTokens.set(phoneNumber, { token, deviceType });
    
    console.log(`Device registered for ${phoneNumber}`);
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
    const { phoneNumbers, title, message } = req.body;

    if (!phoneNumbers || !phoneNumbers.length) {
      return res.status(400).json({
        success: false,
        error: "At least one phone number is required"
      });
    }

    console.log('Sending notifications to:', phoneNumbers);

    // Get tokens for the specified phone numbers
    const tokens = phoneNumbers
      .map(phone => deviceTokens.get(phone)?.token)
      .filter(token => token); // Remove undefined tokens

    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No registered devices found for the provided phone numbers"
      });
    }

    // Send notifications to all tokens
    const notifications = tokens.map(token => {
      const message = {
        token,
        notification: {
          title,
          body: message
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };
      return admin.messaging().send(message);
    });

    const results = await Promise.all(notifications);
    console.log('Notification results:', results);

    res.json({
      success: true,
      messageIds: results
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
  res.json({ status: "healthy" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
