import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  Paper, 
  Typography, 
  Box,
  CircularProgress
} from '@mui/material';
import { NotificationsActive as NotificationsIcon } from '@mui/icons-material';
import { getFCMToken, sendTestNotification } from '../utils/sendSMS';
import { toast } from 'react-toastify';

const NotificationTest: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterDevice = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const token = await getFCMToken();
      if (token) {
        toast.success('Device registered successfully!');
      } else {
        throw new Error('Failed to get FCM token');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to register device');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendTestNotification();
      if (result) {
        toast.success('Test notification sent successfully!');
      } else {
        toast.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Notification error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Test Notifications
      </Typography>

      <TextField
        fullWidth
        label="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="+1234567890"
        margin="normal"
        disabled={loading}
      />

      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleRegisterDevice}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <NotificationsIcon />}
          fullWidth
        >
          Register Device
        </Button>

        <Button
          variant="outlined"
          onClick={handleTestNotification}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <NotificationsIcon />}
          fullWidth
        >
          Test Notification
        </Button>
      </Box>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
        1. First, register your device with your phone number
        <br />
        2. Then, send a test notification to verify it works
      </Typography>
    </Paper>
  );
};

export default NotificationTest; 