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
  AlertTitle,
  LinearProgress,
  Card,
  CardContent
} from '@mui/material';
import { Bar, Doughnut, Pie, PolarArea } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, RadialLinearScale } from 'chart.js';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import NetworkCellIcon from '@mui/icons-material/NetworkCell';
import PeopleIcon from '@mui/icons-material/People';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title,
  RadialLinearScale
);

/**
 * Component to display GSM calculation results
 * @param {Object} result - Result object from GSM calculation
 */
const GsmResultsDisplay = ({ result }) => {
  if (!result) {
    return <Typography variant="body1">Aucun résultat GSM à afficher</Typography>;
  }
  
  console.log('GSM result object:', result);

  // Helper functions
  const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    // Protection contre les valeurs aberrantes
    if (typeof value === 'number') {
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
  
  // Extract data - handles both direct calculations and saved results
  const extractData = () => {
    console.log("Résultat brut de l'API GSM:", result);
    
    // Extraction du nombre d'abonnés (corrigé pour gérer les deux structures possibles)
    const subscribers = result.subscriberCount || result.parameters?.subscribers || 0;
    
    // Définir des valeurs par défaut sécurisées pour toutes les propriétés
    const gsmData = {
      btsCount: result.btsCount || 0,
      btsCountForCapacity: result.btsCountForCapacity || 0,
      finalBtsCount: result.finalBtsCount || 0,
      cellRadius: result.cellRadius || 0,
      totalTraffic: result.totalTraffic || 0,
      channelsRequired: result.channelsRequired || 0,
      erlangB: result.erlangB || 0,
      blockingProbability: result.blockingProbability || 0.02,
      // Correction pour le trafic par utilisateur
      trafficPerUser: result.trafficPerSubscriber || 
        (result.totalTraffic > 0 && subscribers > 0 ? 
         (result.totalTraffic / subscribers) : 0),
      frequencyBand: result.frequency || result.frequencyBand || 900,
      channelsPerCell: result.channelsPerCell || 0,
      parameters: {
        subscribers: subscribers, // Utilisation de la valeur extraite ci-dessus
        coverageArea: result.coverageArea || result.parameters?.coverageArea || 0,
        environmentType: result.propagationModel === 'OKUMURA_HATA' ? 'URBAN' : 
                          (result.parameters?.environmentType || 'URBAN')
      }
    };
    
    // Déterminer le facteur limitant en fonction des résultats
    gsmData.limitingFactor = gsmData.btsCountForCapacity > gsmData.btsCount ? 'Capacité' : 'Couverture';
    
    // Calculer d'autres métriques dérivées si nécessaires
    gsmData.coveragePerBTS = gsmData.cellRadius ? Math.PI * Math.pow(gsmData.cellRadius, 2) : 0;
    gsmData.totalCoverageArea = gsmData.coveragePerBTS * gsmData.finalBtsCount;
    
    console.log("Données GSM extraites et traitées:", gsmData);
    return gsmData;
  };
  
  const gsmData = extractData();
  
  // Format environment type for display
  const formatEnvironment = (type) => {
    switch(type) {
      case 'URBAN':
        return 'Urbain';
      case 'SUBURBAN':
        return 'Suburbain';
      case 'RURAL':
        return 'Rural';
      default:
        return type;
    }
  };
  
  // Get colors based on limiting factor
  const getLimitingFactorColors = () => {
    return gsmData.limitingFactor === 'Capacité' 
      ? { color: 'secondary', bgColor: 'secondary.lighter', icon: <PeopleIcon /> } 
      : { color: 'primary', bgColor: 'primary.lighter', icon: <SignalCellularAltIcon /> };
  };
  
  const limitingFactorInfo = getLimitingFactorColors();
  
  return (
    <Grid container spacing={3}>
      {/* Main result summary */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="h5">
              Résumé du dimensionnement GSM
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%', bgcolor: limitingFactorInfo.bgColor }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <NetworkCellIcon sx={{ mr: 1, color: limitingFactorInfo.color }} />
                    <Typography variant="h6">Stations de base</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {gsmData.finalBtsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    BTS nécessaires pour couvrir la zone et répondre aux besoins de capacité
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={`Facteur limitant: ${gsmData.limitingFactor}`} 
                      color={limitingFactorInfo.color}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SignalCellularAltIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Couverture</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {formatNumber(gsmData.cellRadius)} km
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rayon de cellule pour l'environnement {formatEnvironment(gsmData.parameters.environmentType)}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={`Zone: ${formatNumber(gsmData.coveragePerBTS)} km²/BTS`} 
                      color="primary"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6">Capacité</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {formatNumber(gsmData.channelsRequired)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Canaux nécessaires pour le trafic total de {formatNumber(gsmData.totalTraffic)} Erlangs
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={`${formatNumber(gsmData.channelsPerCell || (gsmData.channelsRequired / gsmData.btsCountForCapacity))} canaux/cellule`} 
                      color="secondary"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      {/* Visualisation alternative de la comparaison des BTS sans graphique à barres */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Comparaison des besoins en BTS
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Explication textuelle */}
            <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'text.secondary' }}>
              Le nombre final de BTS est déterminé par la valeur maximale entre les besoins de couverture et de capacité.
            </Typography>
            
            {/* Cartes de valeurs avec indicateurs visuels */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    bgcolor: 'rgba(54, 162, 235, 0.1)', 
                    border: '1px solid rgba(54, 162, 235, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>Couverture</Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {gsmData.btsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">BTS</Typography>
                  {gsmData.limitingFactor === 'Couverture' && (
                    <Chip 
                      label="Limitant" 
                      color="primary" 
                      size="small"
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                    />
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    bgcolor: 'rgba(255, 99, 132, 0.1)', 
                    border: '1px solid rgba(255, 99, 132, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>Capacité</Typography>
                  <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
                    {gsmData.btsCountForCapacity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">BTS</Typography>
                  {gsmData.limitingFactor === 'Capacité' && (
                    <Chip 
                      label="Limitant" 
                      color="secondary" 
                      size="small"
                      sx={{ mt: 1, fontSize: '0.7rem' }}
                    />
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={4}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    bgcolor: 'rgba(75, 192, 192, 0.1)', 
                    border: '1px solid rgba(75, 192, 192, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>Total final</Typography>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {gsmData.finalBtsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">BTS</Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Barres horizontales - évite les problèmes d'étirement vertical */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Proportion relative</Typography>
              
              {/* Barre pour couverture */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Couverture</Typography>
                  <Typography variant="body2">{gsmData.btsCount} BTS</Typography>
                </Box>
                <Box 
                  sx={{ 
                    height: '10px', 
                    width: `${(gsmData.btsCount / Math.max(gsmData.btsCount, gsmData.btsCountForCapacity, gsmData.finalBtsCount)) * 100}%`, 
                    bgcolor: 'primary.main',
                    borderRadius: '5px'
                  }} 
                />
              </Box>
              
              {/* Barre pour capacité */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Capacité</Typography>
                  <Typography variant="body2">{gsmData.btsCountForCapacity} BTS</Typography>
                </Box>
                <Box 
                  sx={{ 
                    height: '10px', 
                    width: `${(gsmData.btsCountForCapacity / Math.max(gsmData.btsCount, gsmData.btsCountForCapacity, gsmData.finalBtsCount)) * 100}%`, 
                    bgcolor: 'secondary.main',
                    borderRadius: '5px'
                  }} 
                />
              </Box>
              
              {/* Barre pour total */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Total final</Typography>
                  <Typography variant="body2">{gsmData.finalBtsCount} BTS</Typography>
                </Box>
                <Box 
                  sx={{ 
                    height: '10px', 
                    width: `${(gsmData.finalBtsCount / Math.max(gsmData.btsCount, gsmData.btsCountForCapacity, gsmData.finalBtsCount)) * 100}%`, 
                    bgcolor: 'success.main',
                    borderRadius: '5px'
                  }} 
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      {/* Visualisation alternative du facteur limitant sans graphique */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Facteur limitant: {gsmData.limitingFactor}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Cartes de comparaison */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Paper 
                  elevation={gsmData.limitingFactor === 'Couverture' ? 3 : 1}
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    bgcolor: gsmData.limitingFactor === 'Couverture' ? 'rgba(54, 162, 235, 0.1)' : 'transparent',
                    border: gsmData.limitingFactor === 'Couverture' ? '2px solid rgba(54, 162, 235, 0.7)' : '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">Couverture</Typography>
                    {gsmData.limitingFactor === 'Couverture' && (
                      <Chip size="small" label="Limitant" color="primary" />
                    )}
                  </Box>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {gsmData.btsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    BTS nécessaires pour couvrir la zone
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={6}>
                <Paper 
                  elevation={gsmData.limitingFactor === 'Capacité' ? 3 : 1}
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    bgcolor: gsmData.limitingFactor === 'Capacité' ? 'rgba(255, 99, 132, 0.1)' : 'transparent',
                    border: gsmData.limitingFactor === 'Capacité' ? '2px solid rgba(255, 99, 132, 0.7)' : '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">Capacité</Typography>
                    {gsmData.limitingFactor === 'Capacité' && (
                      <Chip size="small" label="Limitant" color="secondary" />
                    )}
                  </Box>
                  <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {gsmData.btsCountForCapacity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    BTS nécessaires pour le trafic
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Barres de comparaison fixes */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Comparaison directe</Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: 'primary.main', mr: 1, borderRadius: 1 }} />
                    <Typography variant="body2">Couverture</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">{gsmData.btsCount} BTS</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  color="primary"
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    width: `${(gsmData.btsCount / Math.max(gsmData.btsCount, gsmData.btsCountForCapacity)) * 100}%`,
                    '&.MuiLinearProgress-root': {
                      backgroundColor: 'transparent'
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: 'secondary.main', mr: 1, borderRadius: 1 }} />
                    <Typography variant="body2">Capacité</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">{gsmData.btsCountForCapacity} BTS</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={100} 
                  color="secondary"
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    width: `${(gsmData.btsCountForCapacity / Math.max(gsmData.btsCount, gsmData.btsCountForCapacity)) * 100}%`,
                    '&.MuiLinearProgress-root': {
                      backgroundColor: 'transparent'
                    }
                  }} 
                />
              </Box>
              
              <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
                <Typography variant="body1" align="center" sx={{ fontWeight: 'medium' }}>
                  Nombre final de BTS requis : <strong>{gsmData.finalBtsCount}</strong>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      {/* Visualisation simplifiée de la couverture */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Couverture du réseau
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            {/* Statistiques de couverture avec visualisation claire */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'primary.light', 
                  borderRadius: 2,
                  bgcolor: 'primary.lighter'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1">Rayon de cellule</Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatNumber(gsmData.cellRadius)} km
                    </Typography>
                  </Box>
                  
                  {/* Tableau de comparaison des rayons types */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Comparaison avec des rayons de référence :
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mt: 1,
                      position: 'relative',
                      height: '30px'
                    }}>
                      <Box sx={{ 
                        position: 'absolute',
                        height: '4px', 
                        bgcolor: 'divider',
                        left: 0,
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 0 
                      }} />
                      
                      {/* Marqueurs de rayons de référence */}
                      {[0, 0.5, 1, 2, 5].map((value, index) => (
                        <Box key={index} sx={{
                          position: 'absolute',
                          left: `${value === 0 ? 0 : Math.min((value / 5) * 100, 100)}%`,
                          zIndex: 1,
                          transform: 'translateX(-50%)'
                        }}>
                          <Box sx={{ 
                            width: '2px', 
                            height: '12px', 
                            bgcolor: value === gsmData.cellRadius ? 'primary.main' : 'text.disabled', 
                            mx: 'auto'
                          }} />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: value === gsmData.cellRadius ? 'primary.main' : 'text.secondary',
                              fontWeight: value === gsmData.cellRadius ? 'bold' : 'normal',
                              position: 'absolute',
                              top: '15px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {value} km
                          </Typography>
                        </Box>
                      ))}
                      
                      {/* Marqueur du rayon actuel */}
                      <Box sx={{
                        position: 'absolute',
                        left: `${Math.min((gsmData.cellRadius / 5) * 100, 100)}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2
                      }}>
                        <Box sx={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main',
                          boxShadow: '0 0 0 3px rgba(54, 162, 235, 0.3)'
                        }} />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>Surface par cellule</Typography>
                  <Typography variant="h6" color="secondary.main" gutterBottom>
                    {formatNumber(gsmData.coveragePerBTS)} km²
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Surface couverte par une seule BTS.
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>BTS pour couverture</Typography>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    {gsmData.btsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nombre de BTS nécessaires pour couvrir {formatNumber(gsmData.parameters.coverageArea)} km².
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" icon={<SignalCellularAltIcon />}>
                  <AlertTitle>Environnement: {formatEnvironment(gsmData.parameters.environmentType)}</AlertTitle>
                  Le rayon de cellule est déterminé par les conditions de propagation et les paramètres radio.
                  Plus la fréquence est élevée ou l'environnement dense, plus le rayon est réduit.
                </Alert>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Grid>
      
      {/* Capacity and Traffic Analysis - représentation plus pertinente que le camembert */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Analyse de capacité et trafic
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Section du trafic avec jauge visuelle */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Trafic et capacité du réseau
              </Typography>
              
              {/* Trafic total */}
              <Box sx={{ mb: 1.5 }}>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Typography variant="body2">Trafic total:</Typography>
                  </Grid>
                  <Grid item xs={7}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((gsmData.totalTraffic / (gsmData.channelsRequired * gsmData.erlangB || 1)) * 100, 100)} 
                      color="secondary"
                      sx={{ height: 10, borderRadius: 5, mt: 0.5 }} 
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" align="right">{formatNumber(gsmData.totalTraffic)} E</Typography>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Canaux requis */}
              <Box sx={{ mb: 1.5 }}>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Typography variant="body2">Canaux requis:</Typography>
                  </Grid>
                  <Grid item xs={7}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((gsmData.channelsRequired / 200) * 100, 100)} 
                      color="primary"
                      sx={{ height: 10, borderRadius: 5, mt: 0.5 }} 
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" align="right">{gsmData.channelsRequired}</Typography>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Distribution des canaux par BTS */}
              <Box sx={{ mb: 1.5 }}>
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Typography variant="body2">Canaux par BTS:</Typography>
                  </Grid>
                  <Grid item xs={7}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min((gsmData.channelsRequired / gsmData.btsCountForCapacity / 50) * 100, 100)} 
                      color="success"
                      sx={{ height: 10, borderRadius: 5, mt: 0.5 }} 
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" align="right">
                      {formatNumber(gsmData.channelsRequired / gsmData.btsCountForCapacity)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
            
            {/* Section efficacité */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Efficacité du réseau
              </Typography>
              
              {/* Visualisation de l'efficacité en tant que grille */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                {Array.from({ length: Math.min(Math.round(gsmData.btsCountForCapacity), 36) }).map((_, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      bgcolor: index < gsmData.btsCount ? 'primary.main' : 'secondary.main',
                      borderRadius: '2px',
                      opacity: 0.8
                    }} 
                  />
                ))}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="caption">
                  <Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, bgcolor: 'primary.main', mr: 0.5 }} />
                  BTS pour couverture: {gsmData.btsCount}
                </Typography>
                <Typography variant="caption">
                  <Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, bgcolor: 'secondary.main', mr: 0.5 }} />
                  BTS pour capacité: {gsmData.btsCountForCapacity}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Grid>
      
      {/* Detailed technical parameters */}
      <Grid item xs={12}>
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Paramètres techniques détaillés
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Paramètres de trafic</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Trafic total</TableCell>
                      <TableCell align="right">{formatNumber(gsmData.totalTraffic)} Erlangs</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Canaux nécessaires</TableCell>
                      <TableCell align="right">{gsmData.channelsRequired}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Probabilité de blocage</TableCell>
                      <TableCell align="right">{(gsmData.blockingProbability * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Trafic par utilisateur</TableCell>
                      <TableCell align="right">{formatNumber(gsmData.trafficPerUser, 3)} Erlangs</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Paramètres de couverture</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Rayon de cellule</TableCell>
                      <TableCell align="right">{formatNumber(gsmData.cellRadius)} km</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Surface par cellule</TableCell>
                      <TableCell align="right">{formatNumber(gsmData.coveragePerBTS)} km²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Surface totale</TableCell>
                      <TableCell align="right">{formatNumber(gsmData.parameters.coverageArea)} km²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Environnement</TableCell>
                      <TableCell align="right">{formatEnvironment(gsmData.parameters.environmentType)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" gutterBottom>Paramètres du réseau</Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Bande de fréquence</TableCell>
                      <TableCell align="right">{gsmData.frequencyBand} MHz</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">BTS pour couverture</TableCell>
                      <TableCell align="right">{gsmData.btsCount}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">BTS pour capacité</TableCell>
                      <TableCell align="right">{gsmData.btsCountForCapacity}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Nombre d'abonnés</TableCell>
                      <TableCell align="right">{gsmData.parameters.subscribers}</TableCell>
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

export default GsmResultsDisplay;
