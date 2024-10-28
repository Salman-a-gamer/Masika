/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Paper, Grid, Typography, Button, Box, Chip,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Card, CardContent, Select,
  MenuItem, FormControl, InputLabel, Stack,
  Slider, Alert, Tooltip
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, CalendarToday,
  Favorite, Water, Mood, LocalHospital
} from '@mui/icons-material';

const CycleCalendar = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [cycleData, setCycleData] = useState({
    lastPeriod: null,
    cycleLength: 28,
    periodLength: 5,
    symptoms: {}
  });
  const [openDialog, setOpenDialog] = useState(false);

  // Cycle phases
  const CYCLE_PHASES = {
    MENSTRUAL: { name: 'Menstrual', color: '#ff8a80', description: 'Bleeding phase' },
    FOLLICULAR: { name: 'Follicular', color: '#ffcc80', description: 'Body preparing for ovulation' },
    OVULATION: { name: 'Ovulation', color: '#ff80ab', description: 'Most fertile period' },
    LUTEAL: { name: 'Luteal', color: '#80d8ff', description: 'Post-ovulation phase' }
  };

  // Flow levels
  const FLOW_LEVELS = [
    { value: 'none', label: 'None' },
    { value: 'light', label: 'Light' },
    { value: 'medium', label: 'Medium' },
    { value: 'heavy', label: 'Heavy' }
  ];

  // Common symptoms
  const SYMPTOMS = [
    { value: 'cramps', label: 'Cramps', icon: LocalHospital },
    { value: 'headache', label: 'Headache', icon: LocalHospital },
    { value: 'fatigue', label: 'Fatigue', icon: LocalHospital },
    { value: 'bloating', label: 'Bloating', icon: LocalHospital },
    { value: 'moodSwings', label: 'Mood Swings', icon: Mood },
    { value: 'breastTenderness', label: 'Breast Tenderness', icon: LocalHospital }
  ];

  // Calculate current cycle phase
  const calculateCyclePhase = (date) => {
    if (!cycleData.lastPeriod) return null;

    const lastPeriod = new Date(cycleData.lastPeriod);
    const daysSinceLastPeriod = Math.floor((date - lastPeriod) / (1000 * 60 * 60 * 24));
    const cycleDay = (daysSinceLastPeriod % cycleData.cycleLength) + 1;

    if (cycleDay <= cycleData.periodLength) {
      return CYCLE_PHASES.MENSTRUAL;
    } else if (cycleDay <= cycleData.cycleLength - 14) {
      return CYCLE_PHASES.FOLLICULAR;
    } else if (cycleDay <= cycleData.cycleLength - 12) {
      return CYCLE_PHASES.OVULATION;
    } else {
      return CYCLE_PHASES.LUTEAL;
    }
  };

  // Get cell style based on cycle phase
  const getCellStyle = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const phase = calculateCyclePhase(date);

    return {
      height: '80px',
      p: 1,
      border: '1px solid #e0e0e0',
      cursor: 'pointer',
      position: 'relative',
      bgcolor: phase ? phase.color : 'background.paper',
      '&:hover': {
        bgcolor: 'action.hover'
      }
    };
  };

  // Handle symptom logging
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [flowLevel, setFlowLevel] = useState('none');

  const handleSymptomToggle = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleLogDay = () => {
    setCycleData(prev => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [selectedDate.toISOString()]: {
          flow: flowLevel,
          symptoms: selectedSymptoms
        }
      }
    }));
    setOpenDialog(false);
  };

  // Navigate between months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Calculate calendar grid
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startingDayIndex = firstDayOfMonth.getDay();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  // Remove period start date
  const handleRemovePeriodStart = () => {
    setCycleData(prev => ({
      ...prev,
      lastPeriod: null
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent>
          {/* Calendar Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigateMonth(-1)}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="h5">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Typography>
            <IconButton onClick={() => navigateMonth(1)}>
              <ChevronRight />
            </IconButton>
          </Box>

          {/* Cycle Phase Legend */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Cycle Phases</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Object.values(CYCLE_PHASES).map(phase => (
                <Tooltip key={phase.name} title={phase.description}>
                  <Chip
                    label={phase.name}
                    sx={{ bgcolor: phase.color, mb: 1 }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Box>

          {/* Calendar Grid */}
          <Grid container>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid key={day} item xs={12/7}>
                <Box sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>
                  {day}
                </Box>
              </Grid>
            ))}
            
            {Array.from({ length: startingDayIndex }).map((_, index) => (
              <Grid key={`empty-${index}`} item xs={12/7}>
                <Box sx={{ height: '80px' }} />
              </Grid>
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateStr = date.toISOString();
              const dayData = cycleData.symptoms[dateStr];
              
              return (
                <Grid key={day} item xs={12/7}>
                  <Box 
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSymptoms(dayData?.symptoms || []);
                      setFlowLevel(dayData?.flow || 'none');
                      setOpenDialog(true);
                      onDateSelect(date);
                    }}
                    sx={getCellStyle(day)}
                  >
                    <Typography>{day}</Typography>
                    {dayData && (
                      <Box sx={{ mt: 1 }}>
                        {dayData.flow !== 'none' && (
                          <Tooltip title={`Flow: ${dayData.flow}`}>
                            <Water sx={{ color: 'primary.main', fontSize: 16 }} />
                          </Tooltip>
                        )}
                        {dayData.symptoms.length > 0 && (
                          <Tooltip title={`Symptoms: ${dayData.symptoms.join(', ')}`}>
                            <LocalHospital sx={{ color: 'error.main', fontSize: 16 }} />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Log Dialog */}
          <Dialog 
            open={openDialog} 
            onClose={() => setOpenDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Log for {selectedDate?.toLocaleDateString()}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 2 }}>
                {/* Flow Level Selection */}
                <FormControl fullWidth>
                  <InputLabel>Flow Level</InputLabel>
                  <Select
                    value={flowLevel}
                    label="Flow Level"
                    onChange={(e) => setFlowLevel(e.target.value)}
                  >
                    {FLOW_LEVELS.map(level => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Symptoms Selection */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Symptoms</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {SYMPTOMS.map(symptom => (
                      <Tooltip key={symptom.value} title={symptom.label}>
                        <Chip
                          label={symptom.label}
                          icon={<symptom.icon />}
                          onClick={() => handleSymptomToggle(symptom.value)}
                          color={selectedSymptoms.includes(symptom.value) ? "primary" : "default"}
                          sx={{ m: 0.5 }}
                        />
                      </Tooltip>
                    ))}
                  </Box>
                </Box>

                {/* Period Start Option */}
                {!cycleData.lastPeriod && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      setCycleData(prev => ({
                        ...prev,
                        lastPeriod: selectedDate
                      }));
                    }}
                    startIcon={<CalendarToday />}
                  >
                    Mark as Period Start
                  </Button>
                )}

                {/* Remove Period Start Option */}
                {cycleData.lastPeriod && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleRemovePeriodStart}
                    startIcon={<CalendarToday />}
                  >
                    Remove Period Start
                  </Button>
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleLogDay} variant="contained">Save</Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CycleCalendar;