import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Typography,
  Chip,
  Tooltip,
  Fade,
  Box
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  LocationOn as LocationIcon,
  VolumeOff as VolumeOffIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import './LocationList.css';

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

interface LocationListProps {
  locations: Location[];
  onDelete: (index: number) => void;
  onEdit: (location: Location, index: number) => void;
  onNotify: (location: Location) => void;
}

const LocationList: React.FC<LocationListProps> = ({
  locations,
  onDelete,
  onEdit,
  onNotify,
}) => {
  if (!locations.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="empty-state"
      >
        <Paper elevation={2} className="empty-state-paper">
          <LocationIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Locations Saved
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Add a location by selecting a point on the map and filling in the details.
          </Typography>
        </Paper>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="location-list-container"
    >
      <Paper elevation={3} className="location-list-paper">
        <Typography variant="h6" className="location-list-title">
          Saved Locations
        </Typography>
        <List>
        {locations.map((location, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ListItem
                className="location-list-item"
                divider
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" className="location-address">
                      {location.address || 'Unnamed Location'}
                    </Typography>
                  }
                  secondary={
                    <Box component="span">
                      <Box component="span" className="location-details">
                        <Chip
                          size="small"
                          label={`${location.radius}m radius`}
                          color="primary"
                          variant="outlined"
                          className="radius-chip"
                        />
                        {location.silence && (
                          <Chip
                            size="small"
                            icon={<VolumeOffIcon />}
                            label="Silent Mode"
                            color="secondary"
                            variant="outlined"
                            className="silent-chip"
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        component="span"
                        className="phone-numbers"
                      >
                        📱 {location.phoneNumbers}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction className="location-actions">
                  <Tooltip title="Send Test Notification" TransitionComponent={Fade}>
                    <IconButton
                      edge="end"
                      aria-label="notify"
                      onClick={() => onNotify(location)}
                      className="action-button notify"
                    >
                      <NotificationsIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Location" TransitionComponent={Fade}>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => onEdit(location, index)}
                      className="action-button edit"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Location" TransitionComponent={Fade}>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => onDelete(index)}
                      className="action-button delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Paper>
    </motion.div>
  );
};

export default LocationList;
