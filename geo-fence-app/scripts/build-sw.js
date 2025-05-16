const fs = require('fs');
const path = require('path');
require('dotenv').config();

try {
  // Read the service worker template
  const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');
  let swContent;
  
  try {
    swContent = fs.readFileSync(swPath, 'utf8');
  } catch (error) {
    console.error('❌ Error reading service worker file:', error);
    process.exit(1);
  }

  // List all required Firebase env vars
  const envVars = {
    REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY,
    REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID,
    REACT_APP_FIREBASE_MEASUREMENT_ID: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

  // Check for missing environment variables
  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:');
    missingVars.forEach(variable => {
      console.error(`   - ${variable}`);
    });
    console.error('\nMake sure these variables are set in your .env file or Netlify environment settings.');
    process.exit(1);
  }

  // Replace each placeholder with its value
  let updatedContent = swContent;
  Object.entries(envVars).forEach(([key, value]) => {
    const placeholder = `%${key}%`;
    const regex = new RegExp(placeholder, 'g');
    if (updatedContent.includes(placeholder)) {
      updatedContent = updatedContent.replace(regex, value);
      console.log(`✅ Replaced ${key}`);
    } else {
      console.warn(`⚠️ Placeholder for ${key} not found in service worker`);
    }
  });

  // Write the processed service worker
  try {
    fs.writeFileSync(swPath, updatedContent);
    console.log('✅ Service worker configuration updated successfully');
  } catch (error) {
    console.error('❌ Error writing service worker file:', error);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Unexpected error in build script:', error);
  process.exit(1);
}