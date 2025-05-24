import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Component to display UMTS calculation results
 * @param {Object} result - Result object from UMTS calculation
 */
const UmtsResultsDisplay = ({ result }) => {
  if (!result) {
    return <Typography variant="body1">Aucun résultat UMTS à afficher</Typography>;
  }
  
  console.log('Full UMTS result object:', result);

  // Extract data - handles both direct calculations and saved results
  const extractData = () => {
    // Check if results are directly in the result or under calculationResults
    const hasDirectData = result.uplinkCapacity || result.downlinkCapacity;
    const hasNestedData = result.calculationResults && 
                       (result.calculationResults.uplinkCapacity || result.calculationResults.downlinkCapacity);
    
    if (!hasDirectData && !hasNestedData) {
      console.error('Missing calculation data in UMTS result:', result);
      return null;
    }
    
    // Extract data (either direct or from calculationResults)
    const umtsData = hasDirectData ? result : result.calculationResults;
    
    // Check for nested structure in saved results
    if (typeof umtsData.uplinkCapacity === 'string') {
      try {
        umtsData.uplinkCapacity = JSON.parse(umtsData.uplinkCapacity);
      } catch (e) {
        console.log('uplinkCapacity is not valid JSON:', umtsData.uplinkCapacity);
      }
    }
    
    if (typeof umtsData.downlinkCapacity === 'string') {
      try {
        umtsData.downlinkCapacity = JSON.parse(umtsData.downlinkCapacity);
      } catch (e) {
        console.log('downlinkCapacity is not valid JSON:', umtsData.downlinkCapacity);
      }
    }
    
    // Ensure capacity objects exist
    if (!umtsData.uplinkCapacity) umtsData.uplinkCapacity = {};
    if (!umtsData.downlinkCapacity) umtsData.downlinkCapacity = {};
    
    return {
      nodeCount: umtsData.nodeCount || 0,
      cellRadius: umtsData.cellRadius || 0,
      limitingFactor: umtsData.limitingFactor || 'UPLINK',
      coverageArea: umtsData.coverageArea || result.parameters?.coverageArea || 0,
      subscriberCount: umtsData.subscriberCount || result.parameters?.subscriberCount || 0,
      uplinkCapacity: {
        maxUsers: umtsData.uplinkCapacity.maxUsers || 71,
        loadFactor: umtsData.uplinkCapacity.totalLoadFactor || umtsData.uplinkCapacity.loadFactor || 0.01,
        averageBitRate: umtsData.uplinkCapacity.averageBitRate || 12.2
      },
      downlinkCapacity: {
        maxUsers: umtsData.downlinkCapacity.maxUsers || 112,
        loadFactor: umtsData.downlinkCapacity.totalLoadFactor || umtsData.downlinkCapacity.loadFactor || 0.007,
        averageBitRate: umtsData.downlinkCapacity.averageBitRate || 12.2
      },
      parameters: result.parameters || {},
      softHandoverMargin: umtsData.softHandoverMargin || 3
    };
  };
  
  const umtsData = extractData();
  
  if (!umtsData) {
    return (
      <Alert severity="warning">
        <Typography variant="h6">Données de calcul manquantes</Typography>
        <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul UMTS.</Typography>
      </Alert>
    );
  }
  
  // Helper functions
  const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    return typeof value === 'number' ? value.toFixed(decimals) : value;
  };
  
  const formatLoadFactor = (value) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  const formatBitRate = (value) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    return `${value.toFixed(1)} kbps`;
  };
  
  return (
    <Grid container spacing={3}>
      {/* Main result summary */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="h5">
              Résumé du dimensionnement UMTS
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1">
              <strong>Nombre de Node B nécessaires : </strong>
              {umtsData.nodeCount}
            </Typography>
            <Typography variant="body1">
              <strong>Rayon de cellule : </strong>
              {formatNumber(umtsData.cellRadius)} km
            </Typography>
            <Typography variant="body1">
              <strong>Capacité utilisateurs : </strong>
              {umtsData.limitingFactor === 'UPLINK' ? 
                umtsData.uplinkCapacity.maxUsers : 
                umtsData.downlinkCapacity.maxUsers} utilisateurs
            </Typography>
            <Typography variant="body1">
              <strong>Charge du réseau : </strong>
              {umtsData.limitingFactor === 'UPLINK' ? 
                formatLoadFactor(umtsData.uplinkCapacity.loadFactor) : 
                formatLoadFactor(umtsData.downlinkCapacity.loadFactor)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="body1" component="span">
                <strong>Facteur limitant : </strong>
              </Typography>
              <Chip 
                label={umtsData.limitingFactor === 'UPLINK' ? 'Liaison montante' : 'Liaison descendante'} 
                color={umtsData.limitingFactor === 'UPLINK' ? 'primary' : 'secondary'}
                size="small"
              />
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      {/* Detailed results */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Paramètres et résultats détaillés
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {/* Zone parameters */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                      <Typography variant="subtitle2">Paramètres de zone</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Zone de couverture</TableCell>
                    <TableCell>{umtsData.coverageArea} km²</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rayon de cellule</TableCell>
                    <TableCell>{formatNumber(umtsData.cellRadius)} km</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Nombre d'abonnés</TableCell>
                    <TableCell>{umtsData.subscriberCount}</TableCell>
                  </TableRow>

                  {/* Uplink parameters */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                      <Typography variant="subtitle2">Liaison montante (Uplink)</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Capacité par cellule</TableCell>
                    <TableCell>{umtsData.uplinkCapacity.maxUsers} utilisateurs</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Facteur de charge</TableCell>
                    <TableCell>{formatLoadFactor(umtsData.uplinkCapacity.loadFactor)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Débit moyen par utilisateur</TableCell>
                    <TableCell>{formatBitRate(umtsData.uplinkCapacity.averageBitRate)}</TableCell>
                  </TableRow>

                  {/* Downlink parameters */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                      <Typography variant="subtitle2">Liaison descendante (Downlink)</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Capacité par cellule</TableCell>
                    <TableCell>{umtsData.downlinkCapacity.maxUsers} utilisateurs</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Facteur de charge</TableCell>
                    <TableCell>{formatLoadFactor(umtsData.downlinkCapacity.loadFactor)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Débit moyen par utilisateur</TableCell>
                    <TableCell>{formatBitRate(umtsData.downlinkCapacity.averageBitRate)}</TableCell>
                  </TableRow>

                  {/* Configuration parameters */}
                  <TableRow>
                    <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                      <Typography variant="subtitle2">Paramètres de configuration</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Nombre de porteuses</TableCell>
                    <TableCell>{umtsData.parameters.carriers || 1}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Nombre de secteurs</TableCell>
                    <TableCell>{umtsData.parameters.sectors || 3}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Eb/N0 cible</TableCell>
                    <TableCell>{(umtsData.parameters.ebno || umtsData.ebno || 6)} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Marge de soft handover</TableCell>
                    <TableCell>{umtsData.softHandoverMargin} dB</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Chart comparing uplink and downlink capacities */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Comparaison des capacités
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            <Bar 
              data={{
                labels: ['Liaison montante', 'Liaison descendante'],
                datasets: [
                  {
                    label: 'Capacité (utilisateurs)',
                    data: [umtsData.uplinkCapacity.maxUsers, umtsData.downlinkCapacity.maxUsers],
                    backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                    borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
                    borderWidth: 1
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Nombre d\'utilisateurs'
                    }
                  }
                }
              }}
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default UmtsResultsDisplay;
