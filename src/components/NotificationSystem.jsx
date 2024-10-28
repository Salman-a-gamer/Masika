/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { Menu, MenuItem, Badge, IconButton, Typography, Button } from '@mui/material';
import { Notifications, NotificationsNone } from '@mui/icons-material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationSystem = ({ activeTab, medications }) => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  
  useEffect(() => {
    const checkUpcomingMedications = () => {
      if (activeTab !== 3) { // Not in health tab
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        medications.forEach(med => {
          if (med.completed) return;
          
          const [hours, minutes] = med.time.split(':');
          const medTime = parseInt(hours) * 60 + parseInt(minutes);
          const timeDiff = medTime - currentTime;
          
          // Check if medication is due in 5 minutes
          if (timeDiff === 5) {
            const newNotification = {
              id: Date.now(),
              title: 'Upcoming Medication',
              message: `Remember to take ${med.name} at ${med.time}`,
              time: new Date().toLocaleTimeString(),
              read: false
            };
            
            // Check if notification already exists
            const notificationExists = notifications.some(
              n => n.message === newNotification.message
            );
            
            if (!notificationExists) {
              setNotifications(prev => [newNotification, ...prev]);
              toast.info(newNotification.message, {
                position: "top-right",
                autoClose: 10000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
              });
            }
          }
        });
      }
    };

    const interval = setInterval(checkUpcomingMedications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [activeTab, medications, notifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Mark all notifications as read
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleClearAll = () => {
    setNotifications([]);
    handleClose();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 320,
            overflowY: 'auto'
          }
        }}
      >
        <MenuItem sx={{ justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Button
              variant="text"
              color="primary"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          )}
        </MenuItem>
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map(notification => (
            <MenuItem 
              key={notification.id}
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                bgcolor: notification.read ? 'transparent' : 'action.hover',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {notification.title}
              </Typography>
              <Typography variant="body2">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.time}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
      <ToastContainer />
    </>
  );
};

export default NotificationSystem;