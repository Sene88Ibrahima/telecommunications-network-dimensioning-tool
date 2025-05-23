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
  Tooltip
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
    // Extract data for charts
    const capacityData = {
      labels: ['Couverture', 'Capacité', 'Final (max)'],
      datasets: [
        {
          label: 'Nombre de BTS',
          data: [result.btsCount, result.btsCountForCapacity, result.finalBtsCount],
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

    const limitingFactor = result.btsCountForCapacity > result.btsCount ? 'Capacité' : 'Couverture';

    return (
      <Grid container spacing={3}>
        {/* Summary Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Résumé du dimensionnement
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                Facteur limitant :
              </Typography>
              <Chip 
                label={limitingFactor} 
                color={limitingFactor === 'Capacité' ? 'secondary' : 'primary'} 
                size="small"
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Rayon de cellule</TableCell>
                      <TableCell align="right">{result.cellRadius} km</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">BTS nécessaires (couverture)</TableCell>
                      <TableCell align="right">{result.btsCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">BTS nécessaires (capacité)</TableCell>
                      <TableCell align="right">{result.btsCountForCapacity}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Nombre total de BTS</TableCell>
                      <TableCell align="right"><strong>{result.finalBtsCount}</strong></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Trafic total</TableCell>
                      <TableCell align="right">{result.totalTraffic.toFixed(2)} Erlang</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Canaux requis</TableCell>
                      <TableCell align="right">{result.channelsRequired}</TableCell>
                    </TableRow>
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
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>Zone</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Zone de couverture</TableCell>
                        <TableCell align="right">{result.coverageArea} km²</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>Trafic</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Trafic par abonné</TableCell>
                        <TableCell align="right">{result.trafficPerSubscriber} Erlang</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nombre d'abonnés</TableCell>
                        <TableCell align="right">{result.subscriberCount}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>Radio</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Fréquence</TableCell>
                        <TableCell align="right">{result.frequency} MHz</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Puissance BTS</TableCell>
                        <TableCell align="right">{result.btsPower} dBm</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Seuil réception mobile</TableCell>
                        <TableCell align="right">{result.mobileReceptionThreshold} dBm</TableCell>
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

  // UMTS results display (placeholder)
  const renderUmtsResults = () => {
    return (
      <Typography>
        Affichage des résultats UMTS à implémenter
      </Typography>
    );
  };

  // Hertzian link results display (placeholder)
  const renderHertzianResults = () => {
    return (
      <Typography>
        Affichage des résultats de liaison hertzienne à implémenter
      </Typography>
    );
  };

  // Optical link results display (placeholder)
  const renderOpticalResults = () => {
    return (
      <Typography>
        Affichage des résultats de liaison optique à implémenter
      </Typography>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      {renderResults()}
    </Box>
  );
};

export default ResultsDisplay;
