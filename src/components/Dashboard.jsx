/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Container, Grid, Paper,
  Tabs, Tab, IconButton, Box, Badge, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Stack
} from '@mui/material';
import {
  CalendarToday, AccessTime, Notifications, Favorite, ExitToApp,
  Water, Mood, Spa, WbSunny, Stars, NightsStay, LocalHospital,
  TipsAndUpdates, FitnessCenter, Restaurant, Psychology
} from '@mui/icons-material';
import { getDocs, collection, onSnapshot } from 'firebase/firestore';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../firebase'; // Import the db object

import CycleCalendar from './CycleCalendar';
import SymptomTracker from './SymptomTracker';
import Insights from './Insights';
import HealthAndMedication from './HealthandMedication';
import NotificationSystem from './NotificationSystem';
import AIHealthAssistant from './Chatbot/AIHealthAssistant'; // Import the custom chatbot

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const [healthScore, setHealthScore] = useState(85);
  const [medications, setMedications] = useState([]);
  const [dailyInsights, setDailyInsights] = useState({
    nutrition: [],
    exercise: [],
    mood: [],
    symptoms: []
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotType, setChatbotType] = useState('');

  const calculateNextPeriodWindow = (lastPeriodStart, lastPeriodEnd, cycleLength) => {
    const daysBetween = Math.round((new Date(lastPeriodEnd) - new Date(lastPeriodStart)) / (1000 * 60 * 60 * 24));
    const nextPeriodStart = new Date(lastPeriodStart);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + cycleLength);
    const nextPeriodEnd = new Date(nextPeriodStart);
    nextPeriodEnd.setDate(nextPeriodStart.getDate() + daysBetween);
    
    return {
      start: nextPeriodStart,
      end: nextPeriodEnd
    };
  };

  const determinePhase = (lastPeriodStart, lastPeriodEnd, cycleLength) => {
    const today = new Date();
    const lastStart = new Date(lastPeriodStart);
    const lastEnd = new Date(lastPeriodEnd);
    const periodLength = Math.round((lastEnd - lastStart) / (1000 * 60 * 60 * 24));
    const daysSinceLastPeriod = Math.floor((today - lastStart) / (1000 * 60 * 60 * 24));
    const cycleDay = (daysSinceLastPeriod % cycleLength) + 1;

    if (cycleDay <= periodLength) return "Menstrual";
    if (cycleDay <= 13) return "Follicular";
    if (cycleDay <= 15) return "Ovulation";
    return "Luteal";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPhaseIcon = (phase) => {
    const icons = {
      Menstrual: <Spa sx={{ color: '#d32f2f' }} />,
      Follicular: <WbSunny sx={{ color: '#ed6c02' }} />,
      Ovulation: <Stars sx={{ color: '#9c27b0' }} />,
      Luteal: <NightsStay sx={{ color: '#0288d1' }} />
    };
    return icons[phase] || <Mood />;
  };

  const userData = {
    lastPeriod: {
      start: selectedDate ? formatDate(selectedDate) : null,
      end: selectedDate ? formatDate(new Date(selectedDate.getTime() + 5 * 24 * 60 * 60 * 1000)) : null
    },
    cycleLength: 28,
    get nextPeriod() {
      if (!this.lastPeriod.start) return { start: null, end: null };
      const nextWindow = calculateNextPeriodWindow(
        this.lastPeriod.start,
        this.lastPeriod.end,
        this.cycleLength
      );
      return {
        start: formatDate(nextWindow.start),
        end: formatDate(nextWindow.end)
      };
    },
    get currentPhase() {
      if (!this.lastPeriod.start) return null;
      return determinePhase(
        this.lastPeriod.start,
        this.lastPeriod.end,
        this.cycleLength
      );
    }
  };

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'medications'));
        const meds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMedications(meds);
      } catch (error) {
        console.error('Error fetching medications:', error);
      }
    };
  
    fetchMedications();
  
    // Set up real-time listener for medication updates
    const unsubscribe = onSnapshot(collection(db, 'medications'), (snapshot) => {
      const updatedMeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedications(updatedMeds);
    });
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        navigate('/login');
      }
    });

    // Add chatbot script when component mounts
    const script1 = document.createElement('script');
    script1.innerHTML = `
      window.embeddedChatbotConfig = {
        chatbotId: "YXBGu6pquBVVcIuQ42_kU",
        domain: "www.chatbase.co"
      }
    `;
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://www.chatbase.co/embed.min.js";
    script2.setAttribute('chatbotId', 'YXBGu6pquBVVcIuQ42_kU');
    script2.setAttribute('domain', 'www.chatbase.co');
    script2.defer = true;
    document.body.appendChild(script2);

    return () => {
      unsubscribe();
      // Clean up scripts when component unmounts
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getPhaseColor = (phase) => {
    const colors = {
      Menstrual: '#ffebee',
      Follicular: '#fff3e0',
      Ovulation: '#f3e5f5',
      Luteal: '#e1f5fe'
    };
    return colors[phase] || '#ffffff';
  };

  const getPhaseRecommendations = (phase) => {
    const recommendations = {
      Menstrual: {
        nutrition: ['Iron-rich foods', 'Dark chocolate', 'Warm beverages'],
        exercise: ['Light yoga', 'Walking', 'Stretching'],
        selfCare: ['Warm bath', 'Rest', 'Meditation']
      },
      Follicular: {
        nutrition: ['Leafy greens', 'Fresh fruits', 'Lean proteins'],
        exercise: ['High-intensity workouts', 'Strength training', 'Dancing'],
        selfCare: ['New projects', 'Social activities', 'Learning']
      },
      Ovulation: {
        nutrition: ['Antioxidant-rich foods', 'Healthy fats', 'Fermented foods'],
        exercise: ['Cardio', 'Group classes', 'Sports'],
        selfCare: ['Mindfulness', 'Creative activities', 'Dating']
      },
      Luteal: {
        nutrition: ['Complex carbs', 'Magnesium-rich foods', 'Protein'],
        exercise: ['Swimming', 'Pilates', 'Light cardio'],
        selfCare: ['Journaling', 'Gentle skincare', 'Early bedtime']
      }
    };
    return recommendations[phase] || recommendations.Follicular;
  };

  const PhaseRecommendations = ({ phase }) => {
    const recommendations = getPhaseRecommendations(phase);
    
    return (
      <Dialog open={showTips} onClose={() => setShowTips(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            {getPhaseIcon(phase)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {phase} Phase Recommendations
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Restaurant sx={{ mr: 1 }} /> Nutrition Tips
              </Typography>
              {recommendations.nutrition.map((tip, index) => (
                <Chip key={index} label={tip} sx={{ m: 0.5 }} />
              ))}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FitnessCenter sx={{ mr: 1 }} /> Exercise Recommendations
              </Typography>
              {recommendations.exercise.map((tip, index) => (
                <Chip key={index} label={tip} sx={{ m: 0.5 }} />
              ))}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Psychology sx={{ mr: 1 }} /> Self-Care Activities
              </Typography>
              {recommendations.selfCare.map((tip, index) => (
                <Chip key={index} label={tip} sx={{ m: 0.5 }} />
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTips(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <Favorite sx={{ mr: 2, color: 'pink' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Masika
          </Typography>
          <Typography variant="body1" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            Welcome, {user.displayName || user.email}
          </Typography>
          <IconButton color="inherit">
            <NotificationSystem 
              medications={medications}
              cycleData={{
                nextPeriod: {
                  start: userData.nextPeriod.start,
                  end: userData.nextPeriod.end
                }
              }}
            />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#faf5ff' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  backgroundImage: 'linear-gradient(to bottom right, #fff, #fdf2f8)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarToday sx={{ mr: 2, color: 'pink' }} />
                  <div>
                    <Typography variant="body2" color="textSecondary">Next Period</Typography>
                    <Typography variant="h6">{userData.nextPeriod.start || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      to {userData.nextPeriod.end || 'N/A'}
                    </Typography>
                  </div>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  backgroundImage: 'linear-gradient(to bottom right, #fff, #f3e8ff)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 2, color: 'purple' }} />
                  <div>
                    <Typography variant="body2" color="textSecondary">Cycle Length</Typography>
                    <Typography variant="h6">{userData.cycleLength} days</Typography>
                  </div>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  backgroundImage: 'linear-gradient(to bottom right, #fff, #e0f2fe)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Water sx={{ mr: 2, color: 'blue' }} />
                  <div>
                    <Typography variant="body2" color="textSecondary">Last Period</Typography>
                    <Typography variant="h6">{userData.lastPeriod.start || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      to {userData.lastPeriod.end || 'N/A'}
                    </Typography>
                  </div>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  height: '100%',
                  bgcolor: userData.currentPhase ? getPhaseColor(userData.currentPhase) : '#ffffff'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {userData.currentPhase ? getPhaseIcon(userData.currentPhase) : <Mood />}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2" color="textSecondary">Current Phase</Typography>
                    <Typography variant="h6">{userData.currentPhase || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<TipsAndUpdates />}
                onClick={() => setShowTips(true)}
                sx={{ float: 'right' }}
              >
                View Phase Recommendations
              </Button>
            </Grid>
          </Grid>

          <PhaseRecommendations phase={userData.currentPhase} />

          <Paper elevation={2} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Tab label="Calendar" />
              <Tab label="Symptoms" />
              <Tab label="Insights" />
              <Tab label="Health and Medication" />
            </Tabs>

            <Box sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 3,
              bgcolor: 'background.paper'
            }}>
              {activeTab === 0 && <CycleCalendar onDateSelect={setSelectedDate} />}
              {activeTab === 1 && <SymptomTracker />}
              {activeTab === 2 && <Insights />}
              {activeTab === 3 && <HealthAndMedication />}
            </Box>
          </Paper>
        </Container>
      </Box>
      <ToastContainer />

      {/* Chatbots */}
      <Box sx={{ position: 'fixed', bottom: 0, right: 0, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Toggle Button */}
        <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <TipsAndUpdates />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={() => { setChatbotType('chatbase'); setChatbotOpen(true); setAnchorEl(null); }}>
            Chatbase Bot
          </MenuItem>
          <MenuItem onClick={() => { setChatbotType('custom'); setChatbotOpen(true); setAnchorEl(null); }}>
            Custom Bot
          </MenuItem>
        </Menu>

        {/* Chatbase Bot */}
        {chatbotType === 'chatbase' && chatbotOpen && (
          <Box id="chatbase-chat-widget" />
        )}

        {/* Custom Chatbot */}
        {chatbotType === 'custom' && chatbotOpen && (
          <AIHealthAssistant
            medications={medications}
            onShowMedReminder={() => {}}
            theme={{
              palette: {
                primary: { main: '#e91e63', light: '#f8bbd0', contrastText: '#fff' },
                secondary: { main: '#9c27b0' },
                grey: { 100: '#f5f5f5' },
                action: { disabledBackground: '#bdbdbd' }
              }
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;