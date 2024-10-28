/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, IconButton, Card, CardContent,
    Stack, Button, Avatar, Fade, CircularProgress, Divider, List,
    ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import {
    Send as SendIcon,
    SmartToy as BotIcon,
    AccountCircle as UserIcon,
    LocationOn as LocationIcon,
    AccessTime as TimeIcon,
    NotificationsActive as AlertIcon,
    Person as DoctorIcon
} from '@mui/icons-material';

const defaultTheme = {
    palette: {
        primary: { main: '#e91e63', light: '#f8bbd0', contrastText: '#fff' }, // Shades of pink
        secondary: { main: '#9c27b0' }, // Purple
        grey: { 100: '#f5f5f5' },
        action: { disabledBackground: '#bdbdbd' }
    }
};

// eslint-disable-next-line react/prop-types
const AIHealthAssistant = ({ medications = [], onShowMedReminder, theme = defaultTheme }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your CycleCare Assistant. I can help you with menstrual health, reproductive wellness, finding healthcare providers, and managing medications. How can I assist you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sampleDoctors = [
        { 
            name: 'Dr. Sarah Johnson',
            specialty: 'Gynecologist',
            location: 'Downtown Medical Center',
            distance: '0.8 miles',
            expertise: ['High-risk pregnancy', 'PCOS', 'Endometriosis'],
            availability: 'Next available: Tomorrow 2:30 PM'
        },
        { 
            name: 'Dr. Emily Chen',
            specialty: 'OB/GYN',
            location: 'Women\'s Health Clinic',
            distance: '1.2 miles',
            expertise: ['Fertility treatment', 'Minimally invasive surgery'],
            availability: 'Next available: Thursday 10:00 AM'
        },
        { 
            name: 'Dr. Maria Garcia',
            specialty: 'Gynecologist',
            location: 'City Hospital',
            distance: '2.1 miles',
            expertise: ['Adolescent gynecology', 'Menopause management'],
            availability: 'Next available: Friday 3:15 PM'
        }
    ];

    const identifyIntent = (input) => {
        const lowerInput = input.toLowerCase();
        const intents = {
            findDoctor: ['doctor', 'gynecologist', 'obgyn', 'specialist', 'appointment'],
            medication: ['medicine', 'medication', 'pill', 'prescription', 'drug'],
            periodTracking: ['period', 'menstrual', 'cycle', 'tracking', 'flow'],
            symptoms: ['pain', 'cramp', 'headache', 'nausea', 'mood'],
            emergency: ['emergency', 'severe', 'urgent', 'extreme'],
            general: ['what', 'how', 'why', 'can', 'should']
        };

        return Object.entries(intents).find(([_, keywords]) => 
            keywords.some(keyword => lowerInput.includes(keyword))
        )?.[0] || 'unknown';
    };

    const generateResponse = (userInput, intent) => {
        switch (intent) {
            case 'findDoctor': {
                const specialty = userInput.toLowerCase().includes('fertility') ? 'fertility' :
                                                 userInput.toLowerCase().includes('pregnancy') ? 'pregnancy' : 'general';
                
                const filteredDoctors = sampleDoctors.filter(doc => 
                    specialty === 'general' || doc.expertise.some(exp => 
                        exp.toLowerCase().includes(specialty)
                    )
                );

                return {
                    role: 'assistant',
                    content: `I found some specialists who might be able to help you. They're all board-certified and highly rated:`,
                    doctors: filteredDoctors,
                    options: ['view', 'book']
                };
            }

            case 'medication': {
                const nextMed = medications.find(med => !med.completed);
                if (userInput.toLowerCase().includes('side effect')) {
                    return {
                        role: 'assistant',
                        content: 'For specific information about medication side effects, please consult your healthcare provider or pharmacist. I can show you your current medication schedule and help you track your medications.',
                        action: 'showMedications'
                    };
                }
                return {
                    role: 'assistant',
                    content: nextMed 
                        ? `Your next medication ${nextMed.name} is due at ${nextMed.time}. Would you like to review your complete medication schedule or set up reminders?`
                        : 'I don\'t see any active medications in your schedule. Would you like to set up medication reminders?',
                    action: 'showMedications'
                };
            }

            case 'periodTracking': {
                if (userInput.toLowerCase().includes('irregular')) {
                    return {
                        role: 'assistant',
                        content: 'Irregular periods can be caused by various factors including stress, hormonal changes, or underlying health conditions. I recommend consulting with a healthcare provider for proper evaluation. Would you like me to help you find a gynecologist who specializes in menstrual disorders?',
                        action: 'offerDoctorSearch'
                    };
                }
                return {
                    role: 'assistant',
                    content: 'I can help you track your menstrual cycle and predict your next period. Would you like to log your current cycle data or view predictions based on your previous cycles?',
                    action: 'showTracking'
                };
            }

            case 'symptoms': {
                const severityWords = ['severe', 'extreme', 'unbearable', 'intense'];
                const isSevere = severityWords.some(word => userInput.toLowerCase().includes(word));
                
                if (isSevere) {
                    return {
                        role: 'assistant',
                        content: '⚠️ Based on your description, these symptoms require immediate medical attention. Please contact your healthcare provider right away or visit the nearest emergency room. Would you like me to show you nearby urgent care facilities?',
                        action: 'showEmergency'
                    };
                }
                return {
                    role: 'assistant',
                    content: 'I understand you\'re experiencing discomfort. While I can provide general information about managing common symptoms, it\'s important to consult a healthcare provider for proper diagnosis and treatment. Would you like me to help you find a doctor or provide some general wellness tips?',
                    action: 'offerHelp'
                };
            }

            case 'emergency':
                return {
                    role: 'assistant',
                    content: '🚨 This sounds like it requires immediate medical attention. Please contact emergency services or go to the nearest emergency room. Would you like me to show you directions to the nearest emergency facility?',
                    action: 'showEmergency'
                };

            default:
                return {
                    role: 'assistant',
                    content: 'I understand you\'re asking about ' + userInput + '. While I can provide general information about women\'s health and wellness, please consult with a healthcare provider for personalized medical advice. Would you like me to help you find a suitable specialist?'
                };
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const intent = identifyIntent(input);
            const response = generateResponse(input, intent);
            setMessages(prev => [...prev, response]);
            setIsTyping(false);
        }, 1000);
    };

    const renderDoctorList = (doctors) => (
        <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, mt: 1 }}>
            {doctors.map((doctor, idx) => (
                <ListItem
                    key={idx}
                    alignItems="flex-start"
                    sx={{
                        '&:hover': {
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                        },
                        mb: 1,
                    }}
                >
                    <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <DoctorIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={doctor.name}
                        secondary={
                            <React.Fragment>
                                <Typography component="span" variant="body2" color="text.primary">
                                    {doctor.specialty}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {doctor.location} • {doctor.distance}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Expertise: {doctor.expertise.join(', ')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <TimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                                        {doctor.availability}
                                    </Typography>
                                </Box>
                            </React.Fragment>
                        }
                    />
                </ListItem>
            ))}
        </List>
    );

    const handleOptionClick = (option, doctor) => {
        if (option === 'view') {
            setMessages(prev => [...prev, { role: 'assistant', content: `Here are more details about ${doctor.name}:`, doctor }]);
        } else if (option === 'book') {
            setMessages(prev => [...prev, { role: 'assistant', content: `Simulating booking an appointment with ${doctor.name}...`, doctor }]);
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'assistant', content: `Appointment booked with ${doctor.name} on ${doctor.availability}.` }]);
            }, 1000);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                AI Health Assistant
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300, overflowY: 'auto', pr: 1 }}>
                {messages.map((msg, idx) => (
                    <Box key={idx} sx={{ mb: 1.5 }}>
                        {msg.role === 'assistant' ? (
                            <Card sx={{ bgcolor: theme.palette.grey[100], display: 'inline-block' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                                        <BotIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" color="text.primary">
                                            {msg.content}
                                        </Typography>
                                        {msg.doctors && renderDoctorList(msg.doctors)}
                                        {msg.options && msg.doctors && (
                                            <Box sx={{ mt: 1 }}>
                                                {msg.options.map((option, idx) => (
                                                    <Button
                                                        key={idx}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ mr: 1 }}
                                                        onClick={() => handleOptionClick(option, msg.doctors[0])}
                                                    >
                                                        {option === 'view' ? 'View Details' : 'Book Appointment'}
                                                    </Button>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        ) : (
                            <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                <Card sx={{ bgcolor: theme.palette.primary.light, display: 'inline-block' }}>
                                    <CardContent>
                                        <Typography variant="body2" color={theme.palette.primary.contrastText}>
                                            {msg.content}
                                        </Typography>
                                    </CardContent>
                                </Card>
                                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                    <UserIcon />
                                </Avatar>
                            </Stack>
                        )}
                    </Box>
                ))}
                {isTyping && (
                    <Fade in>
                        <CircularProgress size={20} sx={{ display: 'block', ml: 'auto' }} />
                    </Fade>
                )}
                <div ref={messagesEndRef} />
            </Box>
            <Divider sx={{ mt: 2, mb: 1 }} />
            <Stack direction="row" spacing={1}>
                <TextField
                    variant="outlined"
                    fullWidth
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <IconButton
                    color="primary"
                    onClick={handleSend}
                    sx={{
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        '&:hover': {
                            bgcolor: theme.palette.primary.dark
                        }
                    }}
                >
                    <SendIcon />
                </IconButton>
            </Stack>
        </Paper>
    );
};

export default AIHealthAssistant;