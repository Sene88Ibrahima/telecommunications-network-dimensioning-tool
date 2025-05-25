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

/**
 * Dedicated component for displaying optical link calculation results
 */
const OpticalResultsDisplay = ({ result }) => {
  if (!result) {
    return <Typography color="error">Aucun résultat à afficher</Typography>;
  }

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
    dispersionPenalty
  } = result;
  
  // Ensure all values are numbers for calculations
  const linkLength = Number(linkLengthRaw);
  const maxRangeNum = Number(maxRange || 0);
  const systemMarginNum = Number(systemMargin || 0);
  const connectionLossesNum = Number(connectionLosses || 0);
  const totalLossesNum = Number(totalLosses || 0);
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
                    <TableCell>{safetyMargin} dB</TableCell>
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
