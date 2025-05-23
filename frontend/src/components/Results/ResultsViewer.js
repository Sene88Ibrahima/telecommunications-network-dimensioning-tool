import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Grid, Box, Tabs, Tab,
  CircularProgress, Divider, Card, CardContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Assuming we have a ResultsDisplay component for detailed visualization
import ResultsDisplay from './ResultsDisplay';

const ResultsViewer = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Simulated data - in a real implementation, this would come from an API call
  const mockResults = {
    id: resultId || '123',
    type: 'gsm', // 'gsm', 'umts', 'hertzian', 'optical'
    title: 'Dimensionnement GSM - Zone Urbaine',
    createdAt: new Date().toISOString(),
    parameters: {
      area: 100, // km²
      traffic: 0.025, // Erlang/abonné
      subscribers: 50000,
      frequency: 900, // MHz
      transmitPower: 43, // dBm
      receiverThreshold: -104, // dBm
    },
    results: {
      numberOfBts: 28,
      cellRadius: 1.93, // km
      totalTraffic: 1250, // Erlang
      channelsRequired: 187,
      coverageLimited: true,
    },
    charts: [
      {
        name: 'Capacité vs Couverture',
        data: [
          { name: 'Capacité', value: 25 },
          { name: 'Couverture', value: 75 },
        ]
      },
      {
        name: 'Distribution des BTS',
        data: [
          { name: 'Zone Urbaine', value: 18 },
          { name: 'Zone Suburbaine', value: 7 },
          { name: 'Zone Rurale', value: 3 },
        ]
      }
    ]
  };

  // In a real implementation, this would fetch actual results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation:
        // const response = await api.getResultById(resultId);
        // setResults(response.data);
        
        setResults(mockResults);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching results:', error);
        setLoading(false);
      }
    };

    fetchResults();
  }, [resultId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!results) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Résultats non disponibles
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Impossible de charger les résultats demandés. Veuillez réessayer ou revenir au tableau de bord.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {results.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Créé le {new Date(results.createdAt).toLocaleDateString()} - Type: {results.type.toUpperCase()}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Résumé" />
            <Tab label="Paramètres" />
            <Tab label="Résultats détaillés" />
            <Tab label="Graphiques" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Informations clés
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    <strong>Nombre de BTS:</strong> {results.results.numberOfBts}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Rayon de cellule:</strong> {results.results.cellRadius} km
                  </Typography>
                  <Typography variant="body1">
                    <strong>Trafic total:</strong> {results.results.totalTraffic} Erlang
                  </Typography>
                  <Typography variant="body1">
                    <strong>Dimensionnement limité par:</strong> {results.results.coverageLimited ? 'Couverture' : 'Capacité'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={results.charts[0].data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Paramètres d'entrée
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            {Object.entries(results.parameters).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Typography variant="body1">
                  <strong>{formatParameterName(key)}:</strong> {formatParameterValue(key, value)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ResultsDisplay results={results.results} type={results.type} />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {results.charts.map((chart, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Typography variant="h6" align="center" gutterBottom>
                  {chart.name}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chart.data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

// Utility function to format parameter names for display
const formatParameterName = (key) => {
  const names = {
    area: 'Surface',
    traffic: 'Trafic par abonné',
    subscribers: 'Nombre d\'abonnés',
    frequency: 'Fréquence',
    transmitPower: 'Puissance d\'émission',
    receiverThreshold: 'Seuil de réception',
  };
  
  return names[key] || key;
};

// Utility function to format parameter values with units
const formatParameterValue = (key, value) => {
  const units = {
    area: 'km²',
    traffic: 'Erlang',
    subscribers: '',
    frequency: 'MHz',
    transmitPower: 'dBm',
    receiverThreshold: 'dBm',
  };
  
  return `${value} ${units[key] || ''}`;
};

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default ResultsViewer;
