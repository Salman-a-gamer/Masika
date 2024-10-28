// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { format, subMonths, eachDayOfInterval, subDays } from 'date-fns';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Chip,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  Slider as MuiSlider,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
} from '@mui/material';
import {
  AddCircleOutline,
  DeleteOutline,
  Save as SaveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const DEFAULT_SYMPTOMS = [
  "Cramps",
  "Headache",
  "Fatigue",
  "Bloating",
  "Breast Tenderness",
  "Mood Swings",
  "Acne",
  "Back Pain",
  "Nausea"
];

const DEFAULT_MOODS = [
  "Happy",
  "Calm",
  "Irritable",
  "Anxious",
  "Sad",
  "Energetic",
  "Tired",
  "Stressed"
];

const themeColors = {
  primary: '#ec4899',
  secondary: '#fde7f3',
  hover: '#be185d',
};

// Generate dummy data for the past 3 months with daily entries
const generateDummyData = () => {
  const today = new Date(2024, 9, 27); // October 27, 2024
  const threeMonthsAgo = subMonths(today, 3);
  const daysInterval = eachDayOfInterval({ start: threeMonthsAgo, end: subDays(today, 1) });
  
  const generateNote = (symptoms, mood) => {
    const intensityDescriptor = symptoms[0].intensity > 3 ? "severe" : "mild";
    const timeOfDay = ["morning", "afternoon", "evening"][Math.floor(Math.random() * 3)];
    return `Experiencing ${intensityDescriptor} ${symptoms[0].name.toLowerCase()} in the ${timeOfDay}. Overall feeling ${mood.toLowerCase()}.`;
  };

  return daysInterval.map(date => {
    const dailySymptoms = Array(Math.floor(Math.random() * 4) + 1).fill(null).map(() => ({
      name: DEFAULT_SYMPTOMS[Math.floor(Math.random() * DEFAULT_SYMPTOMS.length)],
      intensity: Math.floor(Math.random() * 5) + 1
    }));
    const dailyMood = DEFAULT_MOODS[Math.floor(Math.random() * DEFAULT_MOODS.length)];

    return {
      id: `dummy-${format(date, 'yyyy-MM-dd')}`,
      date: format(date, 'MMM dd'),
      fullDate: date,
      timestamp: Timestamp.fromDate(date),
      symptoms: dailySymptoms,
      mood: dailyMood,
      notes: generateNote(dailySymptoms, dailyMood),
      userId: auth.currentUser?.uid || 'dummy-user'
    };
  });
};

const SymptomTracker = () => {
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const [intensity, setIntensity] = useState([3]);
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const [historicalData, setHistoricalData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [availableSymptoms, setAvailableSymptoms] = useState(DEFAULT_SYMPTOMS);
  const [availableMoods, setAvailableMoods] = useState(DEFAULT_MOODS);
  const [customSymptomDialog, setCustomSymptomDialog] = useState(false);
  const [customMoodDialog, setCustomMoodDialog] = useState(false);
  const [newCustomSymptom, setNewCustomSymptom] = useState("");
  const [newCustomMood, setNewCustomMood] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchSymptomHistory();
  }, []);

  const fetchSymptomHistory = async () => {
    try {
      if (!auth.currentUser) {
        console.log('No user logged in');
        setIsLoading(false);
        return;
      }

      const userId = auth.currentUser.uid;
      const q = query(
        collection(db, 'symptomLogs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().timestamp ? format(doc.data().timestamp.toDate(), 'MMM dd') : 'No date'
      }));

      // Generate dummy data for past 3 months
      const dummyData = generateDummyData();

      // Combine real data with dummy data
      const combinedData = [...data, ...dummyData];

      // Group data by month
      const groupedData = combinedData.reduce((acc, entry) => {
        const monthKey = format(entry.timestamp.toDate(), 'yyyy-MM');
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(entry);
        return acc;
      }, {});

      // Sort months and convert to array format
      const monthsArray = Object.entries(groupedData)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([month, data]) => ({
          month,
          data: data.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
        }));

      setMonthlyData(monthsArray);
      setHistoricalData(combinedData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching symptom history:', error);
      setIsLoading(false);
    }
  };

  const handleMonthChange = (event, newValue) => {
    setSelectedMonth(newValue);
  };

  const handleAddSymptom = () => {
    if (selectedSymptom && !symptoms.find(s => s.name === selectedSymptom)) {
      setSymptoms([...symptoms, { 
        name: selectedSymptom, 
        intensity: intensity[0] 
      }]);
      setSelectedSymptom("");
      setIntensity([3]);
      setOpenDialog(false);
    }
  };

  const handleAddCustomSymptom = () => {
    if (newCustomSymptom && !availableSymptoms.includes(newCustomSymptom)) {
      setAvailableSymptoms([...availableSymptoms, newCustomSymptom]);
      setSelectedSymptom(newCustomSymptom);
      setNewCustomSymptom("");
      setCustomSymptomDialog(false);
    }
  };

  const handleAddCustomMood = () => {
    if (newCustomMood && !availableMoods.includes(newCustomMood)) {
      setAvailableMoods([...availableMoods, newCustomMood]);
      setMood(newCustomMood);
      setNewCustomMood("");
      setCustomMoodDialog(false);
    }
  };

  const handleRemoveSymptom = (symptomName) => {
    setSymptoms(symptoms.filter(s => s.name !== symptomName));
  };

  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      // Only attempt to delete from Firestore if it's not a dummy entry
      if (!entryToDelete.id.startsWith('dummy-')) {
        const docRef = doc(db, 'symptomLogs', entryToDelete.id);
        await deleteDoc(docRef);
      }
      
      // Update both historicalData and monthlyData
      const updatedHistorical = historicalData.filter(entry => entry.id !== entryToDelete.id);
      setHistoricalData(updatedHistorical);
      
      const updatedMonthly = monthlyData.map(month => ({
        ...month,
        data: month.data.filter(entry => entry.id !== entryToDelete.id)
      }));
      setMonthlyData(updatedMonthly);
      
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      console.log('No user logged in');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const newEntry = {
        userId,
        symptoms,
        mood,
        notes,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'symptomLogs'), newEntry);

      // Update state
      const updatedEntry = {
        ...newEntry,
        id: docRef.id,
        date: format(new Date(), 'MMM dd')
      };

      setHistoricalData([updatedEntry, ...historicalData]);

      // Update monthlyData
      const monthKey = format(new Date(), 'yyyy-MM');
      const updatedMonthly = monthlyData.map(month => {
        if (month.month === monthKey) {
          return {
            ...month,
            data: [updatedEntry, ...month.data]
          };
        }
        return month;
      });

      setMonthlyData(updatedMonthly);

      // Reset form
      setSymptoms([]);
      setMood("");
      setNotes("");
    } catch (error) {
      console.error('Error saving symptoms:', error);
    }
  };

  const getSymptomStats = (data) => {
    const symptomCounts = {};
    const intensitySums = {};
    
    data.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        if (!symptomCounts[symptom.name]) {
          symptomCounts[symptom.name] = 0;
          intensitySums[symptom.name] = 0;
        }
        symptomCounts[symptom.name]++;
        intensitySums[symptom.name] += symptom.intensity;
      });
    });

    return Object.keys(symptomCounts).map(name => ({
      name,
      count: symptomCounts[name],
      avgIntensity: (intensitySums[name] / symptomCounts[name]).toFixed(1)
    }));
  };

  const buttonStyle = {
    backgroundColor: themeColors.primary,
    color: 'white',
    '&:hover': {
      backgroundColor: themeColors.hover,
    }
  };

  const outlinedButtonStyle = {
    borderColor: themeColors.primary,
    color: themeColors.primary,
    '&:hover': {
      borderColor: themeColors.hover,
      backgroundColor: themeColors.secondary,
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      {/* Entry Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Track Today&apos;s Symptoms</Typography>
        
        {/* Symptom Selection Row */}
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={9}>
            <FormControl fullWidth>
              <InputLabel>Select Symptom</InputLabel>
              <MuiSelect
                value={selectedSymptom}
                onChange={(e) => setSelectedSymptom(e.target.value)}
                label="Select Symptom"
              >
                {availableSymptoms.map(symptom => (
                  <MenuItem key={symptom} value={symptom}>
                    {symptom}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <MuiButton
              variant="outlined"
              onClick={() => setCustomSymptomDialog(true)}
              startIcon={<AddIcon />}
              fullWidth
              sx={outlinedButtonStyle}
            >
              Add New
            </MuiButton>
          </Grid>
        </Grid>

        {/* Mood Selection Row */}
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item xs={9}>
            <FormControl fullWidth>
              <InputLabel>Select Mood</InputLabel>
              <MuiSelect
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                label="Select Mood"
              >
                {availableMoods.map(m => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <MuiButton
              variant="outlined"
              onClick={() => setCustomMoodDialog(true)}
              startIcon={<AddIcon />}
              fullWidth
              sx={outlinedButtonStyle}
            >
              Add New
            </MuiButton>
          </Grid>
        </Grid>

        {/* Intensity and Add Symptom Row */}
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item xs={9}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Intensity: {intensity}
            </Typography>
            <MuiSlider
              value={intensity}
              onChange={(e, newValue) => setIntensity(newValue)}
              max={5}
              min={1}
              step={1}
              valueLabelDisplay="auto"
              sx={{
                color: themeColors.primary,
                '& .MuiSlider-thumb': {
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0px 0px 0px 8px ${themeColors.secondary}`,
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={3}>
            <MuiButton
              variant="contained"
              startIcon={<AddCircleOutline />}
              onClick={handleAddSymptom}
              fullWidth
              sx={buttonStyle}>
              Add Symptom
            </MuiButton>
          </Grid>
        </Grid>

        {/* Selected Symptoms */}
        <Box mb={3}>
          {symptoms.map((symptom) => (
            <Chip
              key={symptom.name}
              label={`${symptom.name} (${symptom.intensity}/5)`}
              onDelete={() => handleRemoveSymptom(symptom.name)}
              sx={{ 
                mr: 1, 
                mb: 1,
                backgroundColor: themeColors.secondary,
                color: themeColors.primary
              }}
            />
          ))}
        </Box>

        {/* Notes */}
        <TextField
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about how you're feeling..."
          multiline
          rows={3}
          fullWidth
          variant="outlined"
          sx={{ mb: 3 }}
        />

        <MuiButton
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={symptoms.length === 0}
          fullWidth
          sx={buttonStyle}
        >
          Save Entry
        </MuiButton>
      </Paper>

      {/* Monthly Data Visualization */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Monthly Trends</Typography>
        
        <Tabs
          value={selectedMonth}
          onChange={handleMonthChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          {monthlyData.map((month, index) => (
            <Tab 
              key={month.month} 
              label={format(new Date(month.month), 'MMMM yyyy')}
              sx={{
                color: selectedMonth === index ? themeColors.primary : 'inherit',
              }}
            />
          ))}
        </Tabs>

        {monthlyData.length > 0 && (
          <>
            {/* Daily Symptoms Graph */}
            <Box sx={{ height: 300, mb: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData[selectedMonth].data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    interval={2}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={d => d.symptoms.length}
                    stroke={themeColors.primary}
                    name="Number of Symptoms"
                  />
                  <Line 
                    type="monotone" 
                    dataKey={d => Math.round(d.symptoms.reduce((acc, s) => acc + s.intensity, 0) / d.symptoms.length)}
                    stroke={themeColors.hover}
                    name="Average Intensity"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Monthly Statistics */}
            <Typography variant="h6" gutterBottom>Monthly Summary</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, backgroundColor: themeColors.secondary }}>
                  <Typography variant="subtitle1" gutterBottom>Most Common Symptoms</Typography>
                  {getSymptomStats(monthlyData[selectedMonth].data)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map(stat => (
                      <Box 
                        key={stat.name} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mb: 1 
                        }}
                      >
                        <Typography variant="body2">{stat.name}</Typography>
                        <Typography variant="body2">
                          {stat.count} days (avg intensity: {stat.avgIntensity})
                        </Typography>
                      </Box>
                    ))}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, backgroundColor: themeColors.secondary }}>
                  <Typography variant="subtitle1" gutterBottom>Mood Distribution</Typography>
                  {Object.entries(
                    monthlyData[selectedMonth].data.reduce((acc, entry) => {
                      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([mood, count]) => (
                      <Box 
                        key={mood} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mb: 1 
                        }}
                      >
                        <Typography variant="body2">{mood}</Typography>
                        <Typography variant="body2">{count} days</Typography>
                      </Box>
                    ))}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Recent History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Entries</Typography>
        <Box>
          {monthlyData[selectedMonth]?.data.slice(0, 5).map((entry) => (
            <Box 
              key={entry.id}
              sx={{ 
                borderBottom: '1px solid #e0e0e0', 
                pb: 2, 
                mb: 2,
                '&:last-child': {
                  borderBottom: 'none',
                  mb: 0,
                  pb: 0
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 1 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">{entry.date}</Typography>
                  <Typography variant="body2" color="textSecondary">{entry.mood}</Typography>
                </Box>
                <IconButton 
                  onClick={() => handleDeleteClick(entry)}
                  size="small"
                  sx={{ 
                    color: themeColors.primary,
                    '&:hover': {
                      backgroundColor: themeColors.secondary
                    }
                  }}
                >
                  <DeleteOutline />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {entry.symptoms.map((symptom, idx) => (
                  <Chip
                    key={idx}
                    label={`${symptom.name} (${symptom.intensity}/5)`}
                    size="small"
                    sx={{
                      backgroundColor: themeColors.secondary,
                      color: themeColors.primary
                    }}
                  />
                ))}
              </Box>
              {entry.notes && (
                <Typography variant="body2" color="textSecondary">
                  {entry.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Custom Symptom Dialog */}
      <Dialog
        open={customSymptomDialog}
        onClose={() => setCustomSymptomDialog(false)}
      >
        <DialogTitle>Add Custom Symptom</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Symptom"
            fullWidth
            variant="outlined"
            value={newCustomSymptom}
            onChange={(e) => setNewCustomSymptom(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setCustomSymptomDialog(false)}
            sx={{ color: 'gray' }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleAddCustomSymptom} 
            variant="contained"
            sx={buttonStyle}
          >
            Add
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Custom Mood Dialog */}
      <Dialog
        open={customMoodDialog}
        onClose={() => setCustomMoodDialog(false)}
      >
        <DialogTitle>Add Custom Mood</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Mood"
            fullWidth
            variant="outlined"
            value={newCustomMood}
            onChange={(e) => setNewCustomMood(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setCustomMoodDialog(false)}
            sx={{ color: 'gray' }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleAddCustomMood} 
            variant="contained"
            sx={buttonStyle}
          >
            Add
          </MuiButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'gray' }}
          >
            Cancel
          </MuiButton>
          <MuiButton 
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={buttonStyle}
          >
            Delete
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SymptomTracker;