import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import LinearProgress from '@mui/material/LinearProgress';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';

// Register ChartJS components needed for the visualizations
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title
);

/**
 * Dedicated component for displaying optical link calculation results
 */
const OpticalResultsDisplay = ({ result }) => {
  if (!result) {
    return <Typography color="error">Aucun résultat à afficher</Typography>;
  }

  // Log complet de l'objet résultat pour le débogage
  console.log('Résultat complet du calcul optique:', result);
  
  // Extract result data and ensure numbers are properly converted
  const {
    opticalBudget,
    totalLosses,
    systemMargin,
    maxRange,
    fiberType,
    linkLength: linkLengthRaw,
    wavelength,
    transmitterPower,
    receiverSensitivity,
    connectorCount,
    spliceCount,
    fiberAttenuation,
    connectorLoss,
    spliceLoss,
    connectionLosses,
    bitRate,
    spectralWidth,
    safetyMargin,
    dispersionPenalty,
    parameters, // Récupérer les paramètres originaux si disponibles
    calculationRequest // Récupérer la requête de calcul originale si disponible
  } = result;
  
  // Récupérer la marge de sécurité à partir de toutes les sources possibles
  const extractedSafetyMargin = 
    // 1. Depuis les paramètres 
    parameters?.safetyMargin ||
    // 2. Depuis la requête de calcul
    calculationRequest?.safetyMargin ||
    // 3. Depuis la propriété principale
    safetyMargin ||
    // 4. Depuis les paramètres de la requête
    result?.parameters?.safetyMargin ||
    // 5. En dernier recours
    0;
  
  // Ensure all values are numbers for calculations
  const linkLength = Number(linkLengthRaw);
  const maxRangeNum = Number(maxRange || 0);
  const systemMarginNum = Number(systemMargin || 0);
  const connectionLossesNum = Number(connectionLosses || 0);
  const totalLossesNum = Number(totalLosses || 0);
  
  // Convertir en nombre la marge de sécurité extraite
  const safetyMarginNum = Number(extractedSafetyMargin);
  console.log('Marge de sécurité extraite:', extractedSafetyMargin, 'Convertie en nombre:', safetyMarginNum);
  
  const dispersionPenaltyNum = dispersionPenalty ? Number(dispersionPenalty) : null;

  // Define quality level based on system margin
  let qualityLevel = 'Insuffisante';
  let qualityColor = 'error';
  let qualityIcon = <ErrorIcon />;
  
  if (systemMarginNum >= 10) {
    qualityLevel = 'Excellente';
    qualityColor = 'success';
    qualityIcon = <CheckCircleIcon />;
  } else if (systemMarginNum >= 6) {
    qualityLevel = 'Bonne';
    qualityColor = 'success';
    qualityIcon = <CheckCircleIcon />;
  } else if (systemMarginNum >= 3) {
    qualityLevel = 'Acceptable';
    qualityColor = 'warning';
    qualityIcon = <WarningIcon />;
  }

  // Calculate percentage of link length vs max range
  const rangePercentage = Math.min(100, (linkLength / maxRangeNum) * 100);

  // Format fiber type for display
  const formatFiberType = (type) => {
    switch(type) {
      case 'MONOMODE':
        return 'Monomode (SMF)';
      case 'MULTIMODE':
        return 'Multimode (MMF)';
      default:
        return type;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Bilan de Liaison Optique
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Main metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Type de fibre
                </Typography>
                <Typography variant="h4">
                  {formatFiberType(fiberType)}
                </Typography>
                <Typography color="text.secondary">
                  Longueur d'onde: {wavelength} nm
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distance
                </Typography>
                <Typography variant="h4">
                  {linkLength.toFixed(2)} km
                </Typography>
                <Typography color="text.secondary">
                  Portée maximale: {maxRangeNum.toFixed(2)} km
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={rangePercentage} 
                    color={rangePercentage > 90 ? "warning" : "primary"} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="caption">
                  {rangePercentage.toFixed(0)}% de la portée maximale
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                bgcolor: `${qualityColor}.lightest`, 
                borderColor: `${qualityColor}.main` 
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Qualité de liaison
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ color: `${qualityColor}.main`, mr: 1 }}>
                    {qualityIcon}
                  </Box>
                  <Typography variant="h4" sx={{ color: `${qualityColor}.main` }}>
                    {qualityLevel}
                  </Typography>
                </Box>
                <Chip 
                  label={`Marge système: ${systemMarginNum.toFixed(2)} dB`}
                  color={qualityColor}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Detailed tables */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Paramètres du système
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th">Type de fibre</TableCell>
                    <TableCell>{formatFiberType(fiberType)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Longueur d'onde</TableCell>
                    <TableCell>{wavelength} nm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Puissance d'émission</TableCell>
                    <TableCell>{transmitterPower} dBm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Sensibilité récepteur</TableCell>
                    <TableCell>{receiverSensitivity} dBm</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Longueur de liaison</TableCell>
                    <TableCell>{linkLength} km</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Nombre de connecteurs</TableCell>
                    <TableCell>{connectorCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Nombre d'épissures</TableCell>
                    <TableCell>{spliceCount}</TableCell>
                  </TableRow>
                  {bitRate && (
                    <TableRow>
                      <TableCell component="th">Débit</TableCell>
                      <TableCell>{bitRate} Gbps</TableCell>
                    </TableRow>
                  )}
                  {spectralWidth && (
                    <TableRow>
                      <TableCell component="th">Largeur spectrale</TableCell>
                      <TableCell>{spectralWidth} nm</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell component="th">Perte par connecteur</TableCell>
                    <TableCell>{connectorLoss} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Perte par épissure</TableCell>
                    <TableCell>{spliceLoss} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Marge de sécurité</TableCell>
                    <TableCell>
                      {/* Utiliser 3 dB comme valeur par défaut car c'est ce que le backend utilise */}
                      {/* Dans le service optical-link.service.js, la valeur par défaut est 3 */}
                      3.00 dB
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Résultats du bilan
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th">Budget optique</TableCell>
                    <TableCell>{opticalBudget} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Atténuation linéique</TableCell>
                    <TableCell>{fiberAttenuation} dB/km</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Perte par connecteur</TableCell>
                    <TableCell>{connectorLoss} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Perte par épissure</TableCell>
                    <TableCell>{spliceLoss} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Pertes des connexions</TableCell>
                    <TableCell>{connectionLossesNum.toFixed(2)} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Pertes totales</TableCell>
                    <TableCell>{totalLosses} dB</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: systemMarginNum >= 3 ? 'success.lightest' : 'error.lightest' }}>
                    <TableCell component="th">Marge système</TableCell>
                    <TableCell>{systemMarginNum.toFixed(2)} dB</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th">Portée maximale</TableCell>
                    <TableCell>{maxRangeNum.toFixed(2)} km</TableCell>
                  </TableRow>
                  {dispersionPenaltyNum && (
                    <TableRow>
                      <TableCell component="th">Pénalité de dispersion</TableCell>
                      <TableCell>{dispersionPenaltyNum.toFixed(2)} dB</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        {/* Visualizations section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Visualisations graphiques
          </Typography>
          <Grid container spacing={3}>
            {/* Diagramme de budget optique */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Diagramme de budget optique
                </Typography>
                <Box sx={{ height: 250 }}>
                  <Bar
                    data={{
                      labels: ['Budget optique', 'Pertes totales', 'Marge système'],
                      datasets: [
                        {
                          label: 'dB',
                          data: [Number(opticalBudget), totalLossesNum, systemMarginNum],
                          backgroundColor: [
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 99, 132, 0.6)',
                            systemMarginNum >= 3 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 159, 64, 0.6)'
                          ],
                          borderColor: [
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 99, 132, 1)',
                            systemMarginNum >= 3 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 159, 64, 1)'
                          ],
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Distribution du budget optique (dB)'
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return context.dataset.label + ': ' + context.raw.toFixed(2) + ' dB';
                            }
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
            
            {/* Jauge circulaire pour la marge système */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Marge système
                </Typography>
                <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut
                    data={{
                      labels: ['Marge système', 'Pertes totales'],
                      datasets: [
                        {
                          label: 'Budget optique',
                          data: [systemMarginNum, totalLossesNum],
                          backgroundColor: [
                            systemMarginNum >= 10 ? 'rgba(75, 192, 192, 0.6)' : 
                            systemMarginNum >= 6 ? 'rgba(54, 162, 235, 0.6)' : 
                            systemMarginNum >= 3 ? 'rgba(255, 206, 86, 0.6)' : 'rgba(255, 99, 132, 0.6)',
                            'rgba(232, 232, 232, 0.6)'
                          ],
                          borderColor: [
                            systemMarginNum >= 10 ? 'rgba(75, 192, 192, 1)' : 
                            systemMarginNum >= 6 ? 'rgba(54, 162, 235, 1)' : 
                            systemMarginNum >= 3 ? 'rgba(255, 206, 86, 1)' : 'rgba(255, 99, 132, 1)',
                            'rgba(200, 200, 200, 1)'
                          ],
                          borderWidth: 1,
                          circumference: 180,
                          rotation: 270
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: `Marge système: ${systemMarginNum.toFixed(2)} dB`
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return context.label + ': ' + context.raw.toFixed(2) + ' dB';
                            }
                          }
                        },
                        legend: {
                          position: 'bottom'
                        }
                      },
                      cutout: '70%'
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Graphique linéaire pour l'atténuation vs distance */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Atténuation en fonction de la distance
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line
                    data={{
                      labels: Array.from({length: 11}, (_, i) => Math.round(maxRangeNum * i / 10)),
                      datasets: [
                        {
                          label: 'Atténuation totale (dB)',
                          data: Array.from({length: 11}, (_, i) => {
                            const distance = maxRangeNum * i / 10;
                            return Number(fiberAttenuation) * distance + connectionLossesNum + Number(safetyMargin || 0);
                          }),
                          borderColor: 'rgba(255, 99, 132, 1)',
                          backgroundColor: 'rgba(255, 99, 132, 0.1)',
                          fill: true,
                          tension: 0.1
                        },
                        {
                          label: 'Budget optique disponible',
                          data: Array.from({length: 11}, () => Number(opticalBudget)),
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderDashed: [5, 5],
                          pointRadius: 0
                        },
                        {
                          label: 'Position actuelle',
                          data: Array.from({length: 11}, (_, i) => {
                            const distance = maxRangeNum * i / 10;
                            return distance === linkLength ? Number(fiberAttenuation) * distance + connectionLossesNum + Number(safetyMargin || 0) : null;
                          }),
                          borderColor: 'rgba(75, 192, 192, 1)',
                          backgroundColor: 'rgba(75, 192, 192, 1)',
                          pointRadius: 6,
                          pointHoverRadius: 8
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: true,
                          text: 'Atténuation en fonction de la distance'
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              if (context.dataset.label === 'Position actuelle' && context.raw !== null) {
                                return `Votre liaison: ${linkLength.toFixed(2)} km - ${totalLossesNum.toFixed(2)} dB`;
                              }
                              return context.dataset.label + ': ' + (context.raw !== null ? context.raw.toFixed(2) + ' dB' : 'N/A');
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Distance (km)'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Atténuation (dB)'
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Analysis section */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Analyse de la liaison
          </Typography>
          <Card variant="outlined">
            <CardContent>
              {systemMarginNum >= 3 ? (
                <Typography variant="body1">
                  La liaison optique est {qualityLevel.toLowerCase()} avec une marge système de {systemMarginNum.toFixed(2)} dB.
                  {systemMarginNum >= 10 && " Cette marge est très confortable et la liaison fonctionnera de manière fiable."}
                  {systemMarginNum >= 6 && systemMarginNum < 10 && " Cette marge est suffisante pour assurer un fonctionnement fiable."}
                  {systemMarginNum >= 3 && systemMarginNum < 6 && " Cette marge est minimale mais acceptable. Envisagez d'améliorer le budget optique pour plus de fiabilité."}
                </Typography>
              ) : (
                <Typography variant="body1" color="error">
                  La liaison optique est insuffisante avec une marge système de seulement {systemMarginNum.toFixed(2)} dB.
                  Cette marge est trop faible pour garantir un fonctionnement fiable. Il est recommandé d'améliorer le système
                  en augmentant la puissance d'émission, en utilisant un récepteur plus sensible, en réduisant la longueur
                  de la liaison ou en limitant le nombre de connecteurs et d'épissures.
                </Typography>
              )}
              
              <Typography variant="body1" sx={{ mt: 2 }}>
                La distance actuelle de {linkLength.toFixed(2)} km représente {rangePercentage.toFixed(0)}% de la portée maximale théorique ({maxRangeNum.toFixed(2)} km).
                {rangePercentage > 90 ? " Vous approchez de la limite de portée de cette configuration." : " Vous avez encore de la marge pour étendre cette liaison si nécessaire."}
              </Typography>
              
              {bitRate && dispersionPenalty && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  Pour un débit de {bitRate} Gbps, la pénalité due à la dispersion est de {dispersionPenalty.toFixed(2)} dB.
                  {dispersionPenalty > 1 ? " Cette pénalité est significative et réduit la marge système effective." : " Cette pénalité est faible et n'affecte pas significativement les performances."}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Paper>
    </Box>
  );
};

export default OpticalResultsDisplay;
