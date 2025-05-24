import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Grid, Box, CircularProgress, 
  Divider, Card, CardContent, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

// Import the API service
import { getResultById } from '../../services/api/api.service';

// Import specialized UMTS results display component
import UmtsResultsDisplay from './UmtsResultsDisplay';

/**
 * Component for viewing saved UMTS calculation results
 */
const UmtsResultsViewer = () => {
  // Use useParams to get URL parameter
  const params = useParams();
  const resultId = params.id; 
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Fetch the result data from the API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching UMTS result with ID:', resultId);
        
        // Fetch the result from the API
        const response = await getResultById(resultId);
        console.log('API Response for UMTS result:', response);
        
        if (response.data && response.data.data) {
          // Check if this is a UMTS result
          const networkType = response.data.data.project?.networkType;
          if (networkType && networkType !== 'UMTS') {
            throw new Error(`Ce résultat n'est pas un calcul UMTS (type: ${networkType})`);
          }
          
          console.log('Setting UMTS results with data:', response.data.data);
          setResults(response.data.data);
        } else {
          console.error('Invalid API response structure', response.data);
          throw new Error('Structure de réponse API invalide');
        }
      } catch (error) {
        console.error('Error fetching UMTS results:', error);
        setError(error.message || 'Erreur lors de la récupération des résultats');
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchResults();
    } else {
      setError('ID de résultat manquant');
      setLoading(false);
    }
  }, [resultId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={2} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Chargement des résultats UMTS...</Typography>
        </Paper>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Erreur</Typography>
          <Typography variant="body1">{error}</Typography>
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Retourner à la liste des projets pour voir d'autres résultats.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {results?.name || 'Résultat UMTS'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Projet: {results?.project?.name || 'Non spécifié'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Date: {new Date(results?.createdAt).toLocaleString()}
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Box>

        {/* Information about the configuration used */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Configuration utilisée
                </Typography>
                <Typography variant="body2">
                  {results?.configuration?.name || 'Configuration par défaut'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Results display */}
        <Box sx={{ mt: 2 }}>
          <UmtsResultsDisplay result={results} />
        </Box>
      </Paper>
    </Container>
  );
};

export default UmtsResultsViewer;
