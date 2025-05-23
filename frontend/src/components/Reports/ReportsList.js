import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Grid, Box, Button,
  CircularProgress, Divider, Card, CardContent, CardActions,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import CalculateIcon from '@mui/icons-material/Calculate';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ReportsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  
  // Mock data for demonstration
  const mockResults = [
    {
      id: 'result-1',
      title: 'Dimensionnement GSM - Zone Urbaine',
      type: 'gsm',
      createdAt: '2025-05-22T15:30:00Z',
      projectName: 'Déploiement Réseau Dakar'
    },
    {
      id: 'result-2',
      title: 'Bilan Hertzien - Liaison Point-à-Point',
      type: 'hertzian',
      createdAt: '2025-05-23T10:15:00Z',
      projectName: 'Interconnexion Sites Ruraux'
    },
    {
      id: 'result-3',
      title: 'Dimensionnement UMTS - Zone Périurbaine',
      type: 'umts',
      createdAt: '2025-05-21T09:45:00Z',
      projectName: 'Déploiement Réseau Dakar'
    },
    {
      id: 'result-4',
      title: 'Bilan Optique - Fibre Longue Distance',
      type: 'optical',
      createdAt: '2025-05-20T14:20:00Z',
      projectName: 'Backbone National'
    }
  ];

  // In a real implementation, this would fetch actual results from the API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In a real implementation:
        // const response = await api.getResultsForReporting();
        // setResults(response.data);
        
        setResults(mockResults);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching results:', error);
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const handleGenerateReport = (resultId) => {
    navigate(`/reports/${resultId}`);
  };
  
  const getTypeIcon = (type) => {
    switch(type) {
      case 'gsm':
        return <CalculateIcon sx={{ color: '#1976d2' }} />;
      case 'umts':
        return <CalculateIcon sx={{ color: '#388e3c' }} />;
      case 'hertzian':
        return <CalculateIcon sx={{ color: '#f57c00' }} />;
      case 'optical':
        return <CalculateIcon sx={{ color: '#7b1fa2' }} />;
      default:
        return <CalculateIcon />;
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Générateur de Rapports
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Sélectionnez un résultat de calcul pour générer un rapport détaillé.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {results.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Aucun résultat disponible pour générer des rapports.
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              Effectuez d'abord des calculs de dimensionnement pour pouvoir générer des rapports.
            </Typography>
            <Button 
              variant="contained" 
              sx={{ mt: 3 }}
              onClick={() => navigate('/')}
            >
              Retour au tableau de bord
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {results.map((result) => (
              <Grid item xs={12} md={6} key={result.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getTypeIcon(result.type)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {result.title}
                      </Typography>
                    </Box>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: '30px' }}>
                          <DescriptionIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Projet"
                          secondary={result.projectName}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: '30px' }}>
                          <AccessTimeIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Date de calcul"
                          secondary={formatDate(result.createdAt)}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                  <CardActions>
                    <Button 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => handleGenerateReport(result.id)}
                      sx={{ ml: 'auto' }}
                    >
                      Générer un rapport
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default ReportsList;
