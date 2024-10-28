// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Stack,
  createTheme,
  ThemeProvider,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  NotificationsActive as AlertIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from '../firebase';

const periodTrackingTheme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50',
      light: '#C8E6C9',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#388E3C',
      light: '#66BB6A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#E8F5E9',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

const HealthAndMedication = () => {
  const [medications, setMedications] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMed, setCurrentMed] = useState(null);
  const [nextMedication, setNextMedication] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'Daily',
    time: '',
    notes: ''
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const getNextMedication = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let nextMed = null;
    let minTimeDiff = Infinity;

    const calculateNextDose = (medication) => {
      const [hours, minutes] = medication.time.split(':');
      const now = new Date();
      const nextDose = new Date(now);
      nextDose.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      if (nextDose < now) {
        nextDose.setDate(nextDose.getDate() + 1);
      }
      
      return nextDose;
    };
    
    // Calculate nextDose for each medication
    const updatedMedications = medications.map(med => ({
      ...med,
      nextDose: calculateNextDose(med)
    }));
    
    updatedMedications.forEach(med => {
      if (med.completed) return;

      const [hours, minutes] = med.time.split(':');
      const medTime = parseInt(hours) * 60 + parseInt(minutes);
      
      // Calculate time difference considering both today and tomorrow
      let timeDiff = medTime - currentTime;
      if (timeDiff < 0) {
        // If the medication time has passed for today, consider it for tomorrow
        timeDiff += 24 * 60; // Add 24 hours in minutes
      }

      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        nextMed = { ...med, timeDiff };
      }
    });

    return nextMed;
  };

  const updateNextMedication = () => {
    const next = getNextMedication();
    setNextMedication(next);
  };

  // Reset completion status at midnight
  const resetCompletionStatus = async () => {
    const updates = medications.map(async (med) => {
      if (med.completed) {
        await updateDoc(doc(db, 'medications', med.id), { completed: false });
        return { ...med, completed: false };
      }
      return med;
    });
    
    const updatedMeds = await Promise.all(updates);
    setMedications(updatedMeds);
  };

  useEffect(() => {
    const fetchMedications = async () => {
      const querySnapshot = await getDocs(collection(db, 'medications'));
      const meds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedications(meds);
    };
    fetchMedications();

    // Set up midnight reset
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;

    const midnightReset = setTimeout(() => {
      resetCompletionStatus();
      // Set up daily reset
      setInterval(resetCompletionStatus, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightReset);
  }, []);

  // Update next medication whenever medications change or time passes
  useEffect(() => {
    updateNextMedication();
    const interval = setInterval(() => {
      updateNextMedication();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [medications]);

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: 'Daily',
      time: '',
      notes: ''
    });
    setCurrentMed(null);
  };

  const handleOpenDialog = (med = null) => {
    if (med) {
      setFormData(med);
      setCurrentMed(med);
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.name || !formData.dosage || !formData.time) return;

    try {
      if (currentMed) {
        await updateDoc(doc(db, 'medications', currentMed.id), formData);
        setMedications(medications.map(med =>
          med.id === currentMed.id ? { ...formData, id: currentMed.id } : med
        ));
      } else {
        const docRef = await addDoc(collection(db, 'medications'), { ...formData, completed: false });
        setMedications([...medications, { ...formData, id: docRef.id, completed: false }]);
      }
      handleCloseDialog();
      setSnackbarMessage(currentMed ? 'Medication updated successfully!' : 'Medication added successfully!');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'medications', id));
      setMedications(medications.filter(med => med.id !== id));
      setSnackbarMessage('Medication deleted successfully!');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  const toggleComplete = async (id) => {
    const med = medications.find(med => med.id === id);
    try {
      await updateDoc(doc(db, 'medications', id), { completed: !med.completed });
      setMedications(medications.map(med =>
        med.id === id ? { ...med, completed: !med.completed } : med
      ));
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  return (
    <ThemeProvider theme={periodTrackingTheme}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Reminder Banner */}
        <Fade in={true} timeout={1000}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              mb: 3, 
              bgcolor: periodTrackingTheme.palette.primary.light,
              color: periodTrackingTheme.palette.primary.contrastText,
              borderRadius: 2,
              transform: 'translateY(0)',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
              }
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <AlertIcon fontSize="large" />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {nextMedication 
                  ? `Next Medication: ${nextMedication.name} at ${nextMedication.time}`
                  : 'No upcoming medications'}
              </Typography>
            </Box>
          </Paper>
        </Fade>

        {/* Rest of the component remains the same */}
        <Fade in={true} timeout={1000}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              bgcolor: periodTrackingTheme.palette.background.paper
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: periodTrackingTheme.palette.primary.main }}>
                Medications & Supplements
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{ borderRadius: 28 }}
              >
                Add New
              </Button>
            </Box>

            <List sx={{ width: '100%' }}>
              {medications.map((med) => (
                <Slide key={med.id} direction="up" in={true} timeout={500}>
                  <ListItem
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: med.completed ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      '&:hover': { 
                        bgcolor: 'rgba(0, 0, 0, 0.08)',
                        transition: 'background-color 0.3s ease'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Chip 
                            label={med.name}
                            color="primary"
                            sx={{ fontWeight: 500 }}
                          />
                          <Chip
                            icon={<TimeIcon />}
                            label={med.time}
                            variant="outlined"
                            size="small"
                          />
                          <Chip
                            icon={<EventIcon />}
                            label={med.frequency}
                            variant="outlined"
                            size="small"
                          />
                        </Stack>
                      }
                      secondary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1,
                            color: periodTrackingTheme.palette.text.secondary,
                            textDecoration: med.completed ? 'line-through' : 'none'
                          }}
                        >
                          {`${med.dosage}${med.notes ? ` • ${med.notes}` : ''}`}
                        </Typography>
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(med)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDelete(med.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toggleComplete(med.id)}
                        sx={{ ml: 1 }}
                      >
                        {med.completed ? "Undo" : "Complete"}
                      </Button>
                    </Stack>
                  </ListItem>
                </Slide>
              ))}
              {medications.length === 0 && (
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  No medications added yet. Click the &quot;Add New&quot; button to get started.
                </Typography>
              )}
            </List>
          </Paper>
        </Fade>

        {/* Add/Edit Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          fullScreen={fullScreen}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            pb: 2
          }}>
            <Typography variant="h6" component="div">
              {currentMed ? 'Edit Medication' : 'Add New Medication'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Stack spacing={3} sx={{ width: '100%' }}>
              <TextField
                label="Medication Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                variant="outlined"
              />
              <TextField
                label="Dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., 1 tablet, 5ml, etc."
              />
              <FormControl fullWidth variant="outlined">
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  label="Frequency"
                >
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Twice Daily">Twice Daily</MenuItem>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                  <MenuItem value="Monthly">Monthly</MenuItem>
                  <MenuItem value="As Needed">As Needed</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Add any special instructions or notes here"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="primary"
              disabled={!formData.name || !formData.dosage || !formData.time}
            >
              {currentMed ? 'Save Changes' : 'Add Medication'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for Notifications */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
          message={snackbarMessage}
        />
      </Container>
    </ThemeProvider>
  );
};

export default HealthAndMedication;