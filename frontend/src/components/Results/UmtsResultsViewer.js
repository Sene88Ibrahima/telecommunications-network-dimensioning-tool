import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Typography, Grid, Box, CircularProgress, 
  Divider, Card, CardContent, Alert, Button, Snackbar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';

// Import the API service
import { getResultById } from '../../services/api/api.service';

// Import specialized UMTS results display component
import UmtsResultsDisplay from './UmtsResultsDisplay';

// Import des services d'exportation
import {
  exportToPdf,
  exportToExcel,
  prepareUmtsDataForExcel
} from '../../services/export/export.service';

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
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Référence pour le conteneur des résultats (utilisé pour l'export PDF)
  const resultsContainerRef = useRef(null);

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
  
  // Fonction pour exporter en PDF
  const handleExportPdf = () => {
    try {
      exportToPdf(
        'umts-results-container', 
        `umts_results_${results?.id || new Date().toISOString().split('T')[0]}`,
        results?.name || 'Résultats UMTS'
      );
      setNotification({ open: true, message: 'Export PDF réussi !', severity: 'success' });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      setNotification({ open: true, message: 'Erreur lors de l\'export PDF', severity: 'error' });
    }
  };

  // Fonction pour exporter en Excel
  const handleExportExcel = () => {
    try {
      const data = prepareUmtsDataForExcel(results);
      const filename = `umts_results_${results?.id || new Date().toISOString().split('T')[0]}`;
      
      exportToExcel(data, filename);
      setNotification({ open: true, message: 'Export Excel réussi !', severity: 'success' });
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      setNotification({ open: true, message: 'Erreur lors de l\'export Excel', severity: 'error' });
    }
  };
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Titre et boutons d'exportation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            {results?.name || 'Résultat UMTS'}
          </Typography>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PictureAsPdfIcon />} 
              onClick={handleExportPdf}
              sx={{ mr: 1 }}
            >
              PDF
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<TableViewIcon />} 
              onClick={handleExportExcel}
            >
              Excel
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 4 }}>
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
        <Box sx={{ mt: 2 }} id="umts-results-container" ref={resultsContainerRef}>
          <UmtsResultsDisplay result={results} />
        </Box>
      </Paper>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </Container>
  );
};

export default UmtsResultsViewer;
