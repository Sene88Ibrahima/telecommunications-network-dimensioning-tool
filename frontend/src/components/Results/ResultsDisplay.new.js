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
  Tooltip,
  Alert
} from '@mui/material';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

// Register ChartJS components
Chart.register(...registerables);

/**
 * Component to display calculation results
 * @param {Object} result - Result object from calculation
 * @param {string} type - Type of network (GSM, UMTS, HERTZIEN, OPTIQUE)
 */
const ResultsDisplay = ({ result, type }) => {
  if (!result) {
    return <Typography>Aucun résultat à afficher</Typography>;
  }

  // Render appropriate results based on network type
  const renderResults = () => {
    switch (type) {
      case 'GSM':
        return renderGsmResults();
      case 'UMTS':
        return renderUmtsResults();
      case 'HERTZIEN':
        return renderHertzianResults();
      case 'OPTIQUE':
        return renderOpticalResults();
      default:
        return <Typography>Type de réseau non pris en charge</Typography>;
    }
  };

  // GSM results display
  const renderGsmResults = () => {
    console.log('GSM result data:', result);
    
    // Vérifier si nous avons des données de calcul
    if (!result.calculationResults) {
      return (
        <Alert severity="warning">
          <Typography variant="h6">Données de calcul manquantes</Typography>
          <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul.</Typography>
        </Alert>
      );
    }
    
    // Extraire les données du résultat - adaptation aux noms réels des propriétés
    const gsmData = result.calculationResults;
    
    // Définir des valeurs par défaut sécurisées pour toutes les propriétés
    // Utiliser les noms exacts tels qu'ils apparaissent dans les données
    const btsCount = gsmData.btsCount || 0;
    const btsCountForCapacity = gsmData.btsCountForCapacity || 0;
    const finalBtsCount = gsmData.finalBtsCount || 0;
    const cellRadius = gsmData.cellRadius || 'N/A';
    const totalTraffic = gsmData.totalTraffic || 0;
    const channelsRequired = gsmData.channelsRequired || 'N/A';
    
    // Extract data for charts
    const capacityData = {
      labels: ['Couverture', 'Capacité', 'Final (max)'],
      datasets: [
        {
          label: 'Nombre de BTS',
          data: [btsCount, btsCountForCapacity, finalBtsCount],
          backgroundColor: [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)',
            'rgba(75, 192, 192, 0.5)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }
      ]
    };

    // Déterminer le facteur limitant en fonction des résultats
    const limitingFactor = btsCountForCapacity > btsCount ? 'Capacité' : 'Couverture';

    return (
      <Grid container spacing={3}>
        {/* Main result summary */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="h5">
                Résumé du dimensionnement
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body1">
                <strong>Nombre de BTS nécessaires : </strong>
                {finalBtsCount}
              </Typography>
              <Typography variant="body1">
                <strong>Rayon de cellule : </strong>
                {typeof cellRadius === 'number' ? cellRadius.toFixed(2) : cellRadius} km
              </Typography>
              <Typography variant="body1">
                <strong>Facteur limitant : </strong>
                <Chip 
                  label={limitingFactor} 
                  color={limitingFactor === 'Capacité' ? 'secondary' : 'primary'}
                  size="small"
                />
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Detailed results in tabular format */}
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
                      <TableCell>{gsmData.coverageArea || 'N/A'} km²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Rayon de cellule</TableCell>
                      <TableCell>{typeof cellRadius === 'number' ? cellRadius.toFixed(2) : cellRadius} km</TableCell>
                    </TableRow>
                    
                    {/* Traffic parameters */}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle2">Paramètres de trafic</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Trafic par abonné</TableCell>
                      <TableCell>{gsmData.trafficPerSubscriber || 'N/A'} Erlang</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Nombre d'abonnés</TableCell>
                      <TableCell>{gsmData.subscriberCount || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Trafic total</TableCell>
                      <TableCell>{totalTraffic.toFixed(2) || 'N/A'} Erlang</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Canaux requis</TableCell>
                      <TableCell>{channelsRequired || 'N/A'}</TableCell>
                    </TableRow>
                    
                    {/* Paramètres de capacité */}
                    {gsmData.capacityParams && (
                      <>
                        <TableRow>
                          <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                            <Typography variant="subtitle2">Paramètres de capacité de BTS</Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Nombre de secteurs</TableCell>
                          <TableCell>{gsmData.capacityParams.sectors || 3}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>TRX par secteur</TableCell>
                          <TableCell>{gsmData.capacityParams.trxPerSector || 4}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Timeslots par TRX</TableCell>
                          <TableCell>{gsmData.capacityParams.timeslotsPerTRX || 8}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Efficacité (Erlang/timeslot)</TableCell>
                          <TableCell>{gsmData.capacityParams.erlangPerTimeslot || 0.9}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Capacité par BTS</TableCell>
                          <TableCell>{gsmData.capacityParams.trafficPerBTS?.toFixed(2) || 'N/A'} Erlang</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Comparaison besoins en BTS
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Bar 
                data={capacityData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${context.raw} BTS`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Nombre de BTS'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Parameters */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Paramètres utilisés
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom>Zone</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Zone de couverture</TableCell>
                        <TableCell align="right">{result.parameters?.coverageArea || gsmData.coverageArea} km²</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom>Trafic</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Trafic par abonné</TableCell>
                        <TableCell align="right">{result.parameters?.trafficPerSubscriber || gsmData.trafficPerSubscriber} Erlang</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nombre d'abonnés</TableCell>
                        <TableCell align="right">{result.parameters?.subscriberCount || gsmData.subscriberCount}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom>Radio</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Fréquence</TableCell>
                        <TableCell align="right">{result.parameters?.frequency || gsmData.frequency} MHz</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Puissance BTS</TableCell>
                        <TableCell align="right">{result.parameters?.btsPower || gsmData.btsPower} dBm</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Seuil réception mobile</TableCell>
                        <TableCell align="right">{result.parameters?.mobileReceptionThreshold || gsmData.mobileReceptionThreshold} dBm</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Modèle de propagation</TableCell>
                        <TableCell align="right">{result.parameters?.propagationModel === 'OKUMURA_HATA' ? 'Okumura-Hata' : 'COST-231'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom>Capacité</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Secteurs par BTS</TableCell>
                        <TableCell align="right">{result.parameters?.sectors || gsmData.capacityParams?.sectors || 3}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">TRX par secteur</TableCell>
                        <TableCell align="right">{result.parameters?.trxPerSector || gsmData.capacityParams?.trxPerSector || 4}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Timeslots par TRX</TableCell>
                        <TableCell align="right">8</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Efficacité</TableCell>
                        <TableCell align="right">0.9 E/canal</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // UMTS results display
  const renderUmtsResults = () => {
    console.log('Rendering UMTS results:', result);
    
    // Vérifier que les résultats ont la structure attendue
    if (!result.calculationResults) {
      console.error('Missing calculationResults in UMTS result:', result);
      return (
        <Alert severity="warning">
          <Typography variant="h6">Données de calcul manquantes</Typography>
          <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul.</Typography>
        </Alert>
      );
    }
    
    // Extraire les données
    const umtsData = result.calculationResults;
    
    // Valeurs par défaut
    const nodeCount = umtsData.nodeCount || 0;
    const cellRadius = umtsData.cellRadius || 'N/A';
    const limitingFactor = umtsData.limitingFactor || 'UPLINK';
    
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
                {nodeCount}
              </Typography>
              <Typography variant="body1">
                <strong>Rayon de cellule : </strong>
                {typeof cellRadius === 'number' ? cellRadius.toFixed(2) : cellRadius} km
              </Typography>
              <Typography variant="body1">
                <strong>Facteur limitant : </strong>
                <Chip 
                  label={limitingFactor === 'UPLINK' ? 'Liaison montante' : 'Liaison descendante'} 
                  color={limitingFactor === 'UPLINK' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Detailed results */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Paramètres et résultats détaillés
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {/* Autres détails du UMTS */}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Hertzian results display
  const renderHertzianResults = () => {
    console.log('Hertzian result data:', result);
    return (
      <Alert severity="info">
        <Typography variant="h6">Résultats Hertzien</Typography>
        <Typography variant="body2">L'affichage détaillé pour les résultats de calcul Hertzien sera disponible prochainement.</Typography>
      </Alert>
    );
  };

  // Optical results display
  const renderOpticalResults = () => {
    console.log('Optical result data:', result);
    return (
      <Alert severity="info">
        <Typography variant="h6">Résultats Optique</Typography>
        <Typography variant="body2">L'affichage détaillé pour les résultats de calcul Optique sera disponible prochainement.</Typography>
      </Alert>
    );
  };

  return (
    <Box>
      {renderResults()}
    </Box>
  );
};

export default ResultsDisplay;
