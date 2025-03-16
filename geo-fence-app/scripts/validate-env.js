const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_VAPID_KEY'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these variables in your Netlify environment settings or .env file.\n');
  process.exit(1);
}

// Validate Firebase API Key format
const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
if (!apiKey || !apiKey.startsWith('AIza') || apiKey.length < 39) {
  console.error('\n❌ Invalid Firebase API key format.');
  console.error('Firebase API key should:');
  console.error('1. Start with "AIza"');
  console.error('2. Be at least 39 characters long');
  console.error('3. Be copied exactly as shown in Firebase Console > Project Settings > Web API Key\n');
  process.exit(1);
}

// Validate Firebase App ID format
const appId = process.env.REACT_APP_FIREBASE_APP_ID;
if (!appId || !appId.match(/^1:\d+:web:[a-f0-9]+$/)) {
  console.error('\n❌ Invalid Firebase App ID format.');
  console.error('App ID should be in the format: 1:123456789:web:abcdef123456\n');
  console.error('Copy it exactly as shown in Firebase Console > Project Settings > Your Apps > Web App\n');
  process.exit(1);
}

// Validate VAPID key format
const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
if (!vapidKey || !vapidKey.startsWith('B') || vapidKey.length < 87) {
  console.error('\n❌ Invalid VAPID key format.');
  console.error('The VAPID key should:');
  console.error('1. Start with the letter "B"');
  console.error('2. Be at least 87 characters long');
  console.error('3. Be copied exactly as shown in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates\n');
  process.exit(1);
}

// Log truncated values for debugging
console.log('\n✅ Environment variables configured:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const truncatedValue = value ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}` : 'Not set';
  console.log(`   - ${varName}: ${truncatedValue}`);
});

console.log('\n✅ All environment variables are properly configured!\n'); 