/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Link,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  TextField,
  Button,
} from '@mui/material';
import {
  InfoOutlined,
  TipsAndUpdatesOutlined,
  BookOutlined,
  BarChartOutlined,
  PersonOutlined,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const mockApi = {
  getInsights: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          generalInfo: "Fertility and hormonal health are closely linked. Hormones such as estrogen, progesterone, and testosterone play a crucial role in regulating the menstrual cycle, ovulation, and overall reproductive health.",
          tips: [
            "Maintain a Balanced Diet",
            "Stay Active",
            "Manage Stress",
            "Get Adequate Sleep",
            "Avoid Smoking and Excessive Alcohol",
          ],
          resources: [
            { title: "Understanding PCOS", url: "https://www.mayoclinic.org/diseases-conditions/pcos/symptoms-causes/syc-20353439" },
            { title: "Menstrual Cycle Basics", url: "https://www.nichd.nih.gov/health/topics/menstruation" },
            { title: "Hormone Therapy", url: "https://www.womenshealth.gov/a-z-topics/hormone-therapy" },
            { title: "Reproductive Health", url: "https://www.cdc.gov/reproductivehealth/index.html" },
          ],
          chartData: [
            { name: 'Jan', estrogen: 4000, progesterone: 2400 },
            { name: 'Feb', estrogen: 3000, progesterone: 1398 },
            { name: 'Mar', estrogen: 2000, progesterone: 9800 },
            { name: 'Apr', estrogen: 2780, progesterone: 3908 },
            { name: 'May', estrogen: 1890, progesterone: 4800 },
            { name: 'Jun', estrogen: 2390, progesterone: 3800 },
            { name: 'Jul', estrogen: 3490, progesterone: 4300 },
            { name: 'Aug', estrogen: 4590, progesterone: 5300 },
            { name: 'Sep', estrogen: 5690, progesterone: 6300 },
            { name: 'Oct', estrogen: 6790, progesterone: 7300 },
            { name: 'Nov', estrogen: 7890, progesterone: 8300 },
            { name: 'Dec', estrogen: 8990, progesterone: 9300 },
          ],
        });
      }, 1000); // Simulate network delay
    });
  },
};

const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [age, setAge] = useState('');
  const [cycleLength, setCycleLength] = useState('');
  const [personalizedInsights, setPersonalizedInsights] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    mockApi.getInsights().then((data) => {
      setInsights(data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    let insightsText = '';

    if (age < 20) {
      insightsText += "Young women often experience irregular cycles due to hormonal changes during adolescence. Ensure a balanced diet, moderate exercise, and regular check-ups for reproductive health.";
    } else if (age >= 20 && age < 35) {
      insightsText += "Women in their 20s and early 30s often have more regular cycles. A healthy lifestyle with nutrient-dense foods and exercise supports hormonal balance and fertility.";
    } else if (age >= 35 && age < 45) {
      insightsText += "Women in this age range may experience perimenopause symptoms such as cycle irregularities. Staying active, managing stress, and regular check-ups can ease this transition.";
    } else {
      insightsText += "Menopause often starts after 45, leading to changes in hormone levels and cycle patterns. Lifestyle adjustments and health support can help manage these transitions.";
    }

    if (cycleLength < 21) {
      insightsText += " Shorter-than-average cycle lengths may suggest a hormonal imbalance. Consider consulting a healthcare provider.";
    } else if (cycleLength > 35) {
      insightsText += " Longer cycles may indicate conditions such as PCOS or hormonal fluctuations. It’s advisable to speak with a healthcare provider.";
    } else {
      insightsText += " A regular cycle length between 21 and 35 days generally indicates balanced hormones. Maintaining a healthy lifestyle can support this stability.";
    }

    setPersonalizedInsights(insightsText);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Fade in={!loading} timeout={1000}>
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: theme.shadows[4] }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Fertility and Hormonal Health
          </Typography>

          {/* General Information Section */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: theme.palette.secondary.main }}>
              <InfoOutlined sx={{ mr: 1 }} />
              General Information
            </Typography>
            <Typography variant="body1" paragraph sx={{ color: theme.palette.text.secondary }}>
              {insights.generalInfo}
            </Typography>
          </Box>

          {/* Tips Section */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: theme.palette.secondary.main }}>
              <TipsAndUpdatesOutlined sx={{ mr: 1 }} />
              Tips for Hormonal Health
            </Typography>
            <List>
              {insights.tips.map((tip, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText primary={tip} sx={{ color: theme.palette.text.secondary }} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Interactive Chart Section */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: theme.palette.secondary.main }}>
              <BarChartOutlined sx={{ mr: 1 }} />
              Hormonal Levels Over Time
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="estrogen" fill="#8884d8" />
                <Bar dataKey="progesterone" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Personalized Insights Section */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: theme.palette.secondary.main }}>
              <PersonOutlined sx={{ mr: 1 }} />
              Personalized Insights
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cycle Length (days)"
                    type="number"
                    value={cycleLength}
                    onChange={(e) => setCycleLength(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" fullWidth>
                    Get Personalized Insights
                  </Button>
                </Grid>
              </Grid>
            </form>
            {personalizedInsights && (
              <Typography variant="body1" paragraph sx={{ color: theme.palette.text.secondary, mt: 2 }}>
                {personalizedInsights}
              </Typography>
            )}
          </Box>

          {/* Resources Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center'             }}>
              <BookOutlined sx={{ mr: 1 }} />
              Resources
            </Typography>
            <Grid container spacing={2}>
              {insights.resources.map((resource, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Link
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ color: theme.palette.primary.main }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {resource.title}
                    </Typography>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Insights;


