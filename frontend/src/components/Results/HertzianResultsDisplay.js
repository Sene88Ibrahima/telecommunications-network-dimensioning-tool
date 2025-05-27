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
  Alert,
  LinearProgress
} from '@mui/material';
import { Doughnut, Line } from 'react-chartjs-2';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import WifiIcon from '@mui/icons-material/Wifi';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

/**
 * Component to display Hertzian Link Budget calculation results
 * @param {Object} result - Result object from hertzian link calculation
 */
const HertzianResultsDisplay = ({ result }) => {
  if (!result) {
    return <Typography variant="body1">Aucun résultat de bilan hertzien à afficher</Typography>;
  }
  
  console.log('Hertzian result object:', result);

  // Helper functions
  const formatNumber = (value, decimals = 2, allowNegative = true) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    // Protection contre les valeurs aberrantes
    if (typeof value === 'number') {
      // Si la valeur est négative et que les négatives ne sont pas autorisées (comme un débit)
      if (value < 0 && !allowNegative) {
        return '0.01';
      }
      // Si la valeur est astronomiquement grande
      if (value > 1000000) {
        return '999999.99';
      }
      return value.toFixed(decimals);
    }
    return value;
  };
  
  // Fonction pour nettoyer les valeurs aberrantes avant affichage
  const sanitizeValue = (value, min, max, defaultValue) => {
    if (value === undefined || value === null || isNaN(value)) {
      return defaultValue;
    }
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };
  
  // Format function for receiver threshold and other values that can be negative
  const formatThreshold = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    // Assurer que le seuil est bien affiché comme une valeur négative quand c'est le cas
    return value.toFixed(2);
  };
  
  // Extract data - handles both direct calculations and saved results
  const extractData = () => {
    // Check if results are directly in the result or under calculationResults
    const hasNestedData = result.calculationResults && Object.keys(result.calculationResults).length > 0;
        // Extract data (either direct or from calculationResults)
    const hertzianData = hasNestedData ? result.calculationResults : result;
    
    // Nettoyer les valeurs aberrantes avant de les retourner
    const rawData = {
      // Basic parameters
      frequency: hertzianData.frequency || 0,
      distance: hertzianData.distance || 0,
      transmitPower: hertzianData.transmitPower || 0,
      antennaGain1: hertzianData.antennaGain1 || 0,
      antennaGain2: hertzianData.antennaGain2 || 0,
      // IMPORTANT: Le seuil du récepteur est négatif par convention
      receiverThreshold: hertzianData.receiverThreshold || -85,
      losses: hertzianData.losses || 0,
      
      // Environmental parameters
      rainZone: hertzianData.rainZone || 'K',
      terrainType: hertzianData.terrainType || 'AVERAGE',
      fresnelClearance: hertzianData.fresnelClearance || 60,
      fogDensity: hertzianData.fogDensity || 0,
      
      // Modulation and data rate parameters
      modulationType: hertzianData.modulationType || 'QPSK',
      dataRate: hertzianData.dataRate || 0,
      targetBER: hertzianData.targetBER || '0.000001',
      bandwidthMHz: hertzianData.bandwidthMHz || 20,
      maxDataRate: hertzianData.maxDataRate || 0,
      dataRateFeasible: hertzianData.dataRateFeasible !== undefined ? hertzianData.dataRateFeasible : true,
      
      // Calculated values
      freeSpaceLoss: hertzianData.freeSpaceLoss || 0,
      systemGain: hertzianData.systemGain || 0,
      totalLosses: hertzianData.totalLosses || 0,
      linkMargin: hertzianData.linkMargin || 0,
      terrainLoss: hertzianData.terrainLoss || 0,
      fogLoss: hertzianData.fogLoss || 0,
      fresnelLoss: hertzianData.fresnelLoss || 0,
      
      // Availability details
      linkAvailability: hertzianData.linkAvailability || {
        availability: 99.99,
        unavailability: 0.01,
        rainAttenuation: 0,
        fadeMargin: 0,
        downtimeMinutes: 0
      },
      
      // Optional parameters if provided
      antennaHeight1: hertzianData.antennaHeight1,
      antennaHeight2: hertzianData.antennaHeight2,
      
      // Parameters that might be in a nested structure
      parameters: result.parameters || {}
    };
    
    // IMPORTANT: Ne pas modifier les valeurs négatives légitimes comme la marge de liaison
    // Conserver la marge de liaison telle quelle pour une analyse correcte
    const margin = rawData.linkMargin;
    
    // Pour les débits, assurer qu'ils sont toujours positifs
    if (rawData.maxDataRate < 0) rawData.maxDataRate = 0.01;
    
    // Vérifier si la liaison est viable (basé sur la marge de liaison)
    const isLinkViable = margin >= -20; // Une marge jusqu'à -20 dB peut encore être utilisable dans certains cas
    
    // Si la liaison n'est pas viable, mettre à jour les données en conséquence
    if (!isLinkViable) {
      // Débit très faible pour une liaison non viable
      rawData.maxDataRate = Math.min(rawData.maxDataRate, 0.01);
      rawData.dataRateFeasible = false;
      
      // S'assurer que les données de disponibilité sont cohérentes avec une liaison non viable
      if (!rawData.linkAvailability) rawData.linkAvailability = {};
      
      // Ne pas remplacer les valeurs existantes si elles sont déjà cohérentes avec une liaison non viable
      if (rawData.linkAvailability.availability > 10) { // Si > 10%, alors valeur incohérente pour une liaison non viable
        rawData.linkAvailability.availability = 0.01;
        rawData.linkAvailability.unavailability = 99.99;
        rawData.linkAvailability.downtimeMinutes = 525600; // ~365 jours
      }
    } else {
      // Pour les liaisons viables, vérifier que les valeurs sont dans des plages raisonnables
      if (!rawData.linkAvailability) rawData.linkAvailability = {};
      
      // Corriger uniquement les valeurs clairement aberrantes
      if (rawData.linkAvailability.availability < 0 || rawData.linkAvailability.availability > 100) {
        rawData.linkAvailability.availability = margin < 0 ? 
          Math.max(80, 100 - Math.abs(margin)) : // Pour marge négative mais viable
          99.99; // Pour marge positive
      }
      
      if (rawData.linkAvailability.unavailability < 0 || rawData.linkAvailability.unavailability > 100) {
        rawData.linkAvailability.unavailability = 100 - rawData.linkAvailability.availability;
      }
      
      // Recalculer le temps d'arrêt en fonction de la disponibilité
      if (rawData.linkAvailability.downtimeMinutes < 0 || rawData.linkAvailability.downtimeMinutes > 525600 ||
          !isFinite(rawData.linkAvailability.downtimeMinutes)) {
        rawData.linkAvailability.downtimeMinutes = (rawData.linkAvailability.unavailability / 100) * 525600;
      }
    }
    
    return rawData;
  };
  
  const data = extractData();
  
  // Determine link quality based on link margin and availability
  const getLinkQuality = () => {
    const margin = data.linkMargin;
    const availability = data.linkAvailability.availability;
    
    // Une marge négative indique une liaison non viable
    if (margin < 0 || availability < 99) {
      return { status: 'poor', color: 'error', text: 'Insuffisante', icon: <ErrorIcon /> };
    } else if (margin < 15 || availability < 99.99) {
      return { status: 'fair', color: 'warning', text: 'Acceptable', icon: <WarningIcon /> };
    } else {
      return { status: 'good', color: 'success', text: 'Excellente', icon: <CheckCircleIcon /> };
    }
  };
  
  const linkQuality = getLinkQuality();
  
  // Prepare chart data for the frequency vs distance vs path loss visualization
  const getDistanceFrequencyData = () => {
    const currentDistance = data.distance;
    const currentFreq = data.frequency;
    
    // Generate data points for a range of distances
    const distances = [currentDistance * 0.5, currentDistance, currentDistance * 1.5];
    const frequencies = [currentFreq * 0.5, currentFreq, currentFreq * 1.5];
    
    const datasets = frequencies.map((freq, index) => {
      const losses = distances.map(dist => {
        // Calculate free space loss for this combination
        // FSPL (dB) = 32.45 + 20log10(f) + 20log10(d)
        // where f is frequency in MHz and d is distance in km
        const freqMHz = freq * 1000;
        return 32.45 + 20 * Math.log10(freqMHz) + 20 * Math.log10(dist);
      });
      
      return {
        label: `${freq} GHz`,
        data: losses,
        borderColor: index === 1 ? 'rgba(54, 162, 235, 1)' : `rgba(${75 + index * 80}, ${192 - index * 50}, 192, 1)`,
        backgroundColor: index === 1 ? 'rgba(54, 162, 235, 0.2)' : `rgba(${75 + index * 80}, ${192 - index * 50}, 192, 0.2)`,
        fill: false,
        tension: 0.4
      };
    });
    
    return {
      labels: distances.map(d => `${d} km`),
      datasets
    };
  };
  
  // Normalize availability value for progress display
  const normalizeAvailability = (value) => {
    if (value >= 99.9 && value <= 100) {
      // Map from 99.9-100 to 0-100 for better visual representation
      return ((value - 99.9) / 0.1) * 100;
    }
    return 0; // Below 99.9% is considered poor
  };
  
  return (
    <Grid container spacing={3}>
      {/* Main result summary */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <SignalCellularAltIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5">
              Bilan de Liaison Hertzienne
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Fréquence : </strong> {formatNumber(data.frequency)} GHz
              </Typography>
              <Typography variant="body1">
                <strong>Distance : </strong> {formatNumber(data.distance)} km
              </Typography>
              <Typography variant="body1">
                <strong>Perte en espace libre : </strong> {formatNumber(data.freeSpaceLoss)} dB
              </Typography>
              <Typography variant="body1">
                <strong>Marge de liaison : </strong> {formatThreshold(data.linkMargin)} dB
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Puissance d'émission : </strong> {formatNumber(data.transmitPower)} dBm
              </Typography>
              <Typography variant="body1">
                <strong>Gain système : </strong> {formatNumber(data.systemGain)} dB
              </Typography>
              <Typography variant="body1">
                <strong>Pertes totales : </strong> {formatNumber(data.totalLosses)} dB
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <Typography variant="body1" component="span">
                  <strong>Qualité de liaison : </strong>
                </Typography>
                <Chip 
                  icon={linkQuality.icon}
                  label={linkQuality.text} 
                  color={linkQuality.color}
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      {/* Modulation et débit de données */}
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WifiIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Modulation et Débit
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Type de modulation : </strong> {data.modulationType}
              </Typography>
              <Typography variant="body1">
                <strong>Débit cible : </strong> {formatNumber(data.dataRate)} Mbps
              </Typography>
              <Typography variant="body1">
                <strong>Débit maximal possible : </strong> {formatNumber(data.maxDataRate)} Mbps
              </Typography>
              <Typography variant="body1">
                <strong>Bande passante : </strong> {formatNumber(data.bandwidthMHz)} MHz
              </Typography>
              <Typography variant="body1">
                <strong>BER cible : </strong> {data.targetBER}
              </Typography>
              <Typography variant="body1">
                <strong>Seuil de réception : </strong> {formatThreshold(data.receiverThreshold)} dBm
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Alert 
                severity={data.dataRateFeasible ? "success" : "warning"}
                sx={{ mt: 2 }}
              >
                {data.dataRateFeasible 
                  ? `Le débit cible de ${formatNumber(data.dataRate)} Mbps est réalisable avec cette configuration.`
                  : `Le débit cible de ${formatNumber(data.dataRate)} Mbps dépasse le maximum possible de ${formatNumber(data.maxDataRate)} Mbps.`
                }
              </Alert>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      {/* Conditions environnementales */}
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Conditions Environnementales
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Zone de pluie : </strong> {data.rainZone}
              </Typography>
              <Typography variant="body1">
                <strong>Type de terrain : </strong> {data.terrainType}
              </Typography>
              <Typography variant="body1">
                <strong>Dégagement zone Fresnel : </strong> {formatNumber(data.fresnelClearance)}%
              </Typography>
              <Typography variant="body1">
                <strong>Densité de brouillard : </strong> {formatNumber(data.fogDensity)} g/m³
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Pertes dues au terrain : </strong> {formatNumber(data.terrainLoss)} dB
              </Typography>
              <Typography variant="body1">
                <strong>Pertes dues au brouillard : </strong> {formatNumber(data.fogLoss)} dB
              </Typography>
              <Typography variant="body1">
                <strong>Pertes dues à l'obstruction Fresnel : </strong> {formatNumber(data.fresnelLoss)} dB
              </Typography>
              <Typography variant="body1">
                <strong>Pertes diverses (connecteurs, etc.) : </strong> {formatNumber(data.losses)} dB
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      {/* Availability metrics */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Disponibilité et Performances
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Disponibilité de liaison</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatNumber(data.linkAvailability.availability, 5)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={normalizeAvailability(data.linkAvailability.availability)} 
              color={linkQuality.color}
              sx={{ height: 10, borderRadius: 5 }}
            />
            
            {/* Graphique Doughnut pour la disponibilité */}
            <Box sx={{ height: 200, mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={{
                  labels: ['Disponibilité', 'Indisponibilité'],
                  datasets: [
                    {
                      data: [
                        parseFloat(data.linkAvailability.availability),
                        100 - parseFloat(data.linkAvailability.availability)
                      ],
                      backgroundColor: [
                        data.linkAvailability.availability >= 99.999 ? 'rgba(75, 192, 192, 0.6)' : 
                        data.linkAvailability.availability >= 99.99 ? 'rgba(54, 162, 235, 0.6)' : 
                        data.linkAvailability.availability >= 99.9 ? 'rgba(255, 206, 86, 0.6)' : 'rgba(255, 99, 132, 0.6)',
                        'rgba(232, 232, 232, 0.6)'
                      ],
                      borderColor: [
                        data.linkAvailability.availability >= 99.999 ? 'rgba(75, 192, 192, 1)' : 
                        data.linkAvailability.availability >= 99.99 ? 'rgba(54, 162, 235, 1)' : 
                        data.linkAvailability.availability >= 99.9 ? 'rgba(255, 206, 86, 1)' : 'rgba(255, 99, 132, 1)',
                        'rgba(200, 200, 200, 1)'
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
                      text: `Disponibilité: ${formatNumber(data.linkAvailability.availability, 5)}%`
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          if (context.label === 'Disponibilité') {
                            return `Disponible: ${formatNumber(data.linkAvailability.availability, 5)}%`;
                          } else {
                            return `Indisponible: ${formatNumber(data.linkAvailability.unavailability, 6)}%`;
                          }
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
          </Box>
          
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Indisponibilité</TableCell>
                  <TableCell align="right">{formatNumber(data.linkAvailability.unavailability, 6)}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Temps d'arrêt estimé</TableCell>
                  <TableCell align="right">
                    {formatNumber(data.linkAvailability.downtimeMinutes)} minutes/an
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Atténuation due aux précipitations</TableCell>
                  <TableCell align="right">
                    {formatNumber(data.linkAvailability.rainAttenuation)} dB
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Marge de disponibilité</TableCell>
                  <TableCell align="right">
                    {formatNumber(data.linkAvailability.fadeMargin)} dB
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Zone de pluie ITU-R</TableCell>
                  <TableCell align="right">{data.rainZone}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      
      {/* System parameters */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Paramètres du Système
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Émetteur
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Puissance d'émission</TableCell>
                      <TableCell align="right">{formatNumber(data.transmitPower)} dBm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Gain d'antenne</TableCell>
                      <TableCell align="right">{formatNumber(data.antennaGain1)} dBi</TableCell>
                    </TableRow>
                    {data.antennaHeight1 !== undefined && (
                      <TableRow>
                        <TableCell>Hauteur d'antenne</TableCell>
                        <TableCell align="right">{formatNumber(data.antennaHeight1)} m</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Récepteur
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Seuil de réception</TableCell>
                      <TableCell align="right">{formatThreshold(data.receiverThreshold)} dBm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Gain d'antenne</TableCell>
                      <TableCell align="right">{formatNumber(data.antennaGain2)} dBi</TableCell>
                    </TableRow>
                    {data.antennaHeight2 !== undefined && (
                      <TableRow>
                        <TableCell>Hauteur d'antenne</TableCell>
                        <TableCell align="right">{formatNumber(data.antennaHeight2)} m</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Paramètres de liaison
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Fréquence</TableCell>
                      <TableCell align="right">{formatNumber(data.frequency)} GHz</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Distance</TableCell>
                      <TableCell align="right">{formatNumber(data.distance)} km</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pertes additionnelles</TableCell>
                      <TableCell align="right">{formatNumber(data.losses)} dB</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      {/* Path loss chart */}
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Analyse de la Perte en Espace Libre
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            <Line 
              data={getDistanceFrequencyData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: false,
                    title: {
                      display: true,
                      text: 'Perte en espace libre (dB)'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Distance (km)'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${formatNumber(context.parsed.y)} dB`;
                      }
                    }
                  }
                }
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Ce graphique montre la perte en espace libre en fonction de la distance pour différentes fréquences.
            La courbe centrale représente les valeurs actuelles ({data.frequency} GHz).
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default HertzianResultsDisplay;
