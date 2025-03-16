const admin = require('firebase-admin');

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('Error parsing service account:', error);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, title, message } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: "FCM token is required" 
        })
      };
    }

    // Create the notification message
    const notificationMessage = {
      notification: {
        title: title || "Location Alert",
        body: message || "You have entered a geofence zone"
      },
      token: token,
      webpush: {
        notification: {
          icon: '/firebase-logo.png',
          badge: '/firebase-logo.png',
          vibrate: [100, 50, 100],
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View'
            }
          ]
        },
        fcmOptions: {
          link: '/'
        }
      }
    };

    const response = await admin.messaging().send(notificationMessage);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: response })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        errorCode: error.code 
      })
    };
  }
}; 