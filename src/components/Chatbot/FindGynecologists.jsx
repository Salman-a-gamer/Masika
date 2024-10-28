// FindGynecologists.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, Typography } from '@mui/material';

const FindGynecologists = () => {
  const [location, setLocation] = useState('');
  const [gynecologists, setGynecologists] = useState([]);

  const handleFind = async () => {
    try {
      const geocodingResponse = await axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${location}&key=b5f7443436114367943cd2754a861b12`);
      const { lat, lng } = geocodingResponse.data.results[0].geometry;

      const placesResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=doctor&keyword=gynecologist&key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao`);
      setGynecologists(placesResponse.data.results);
    } catch (error) {
      console.error('Error finding gynecologists:', error);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: '4px', bgcolor: 'background.paper' }}>
      <Typography variant="h6" gutterBottom>Find Nearby Gynecologists</Typography>
      <TextField
        fullWidth
        variant="outlined"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Enter your location"
      />
      <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleFind}>
        Find
      </Button>
      <Box sx={{ mt: 2 }}>
        {gynecologists.map((gynecologist, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="body1">{gynecologist.name}</Typography>
            <Typography variant="body2" color="textSecondary">{gynecologist.vicinity}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default FindGynecologists;