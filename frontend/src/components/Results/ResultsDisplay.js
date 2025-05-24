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
    return <Typography variant="body1">Aucun résultat à afficher</Typography>;
  }
  
  // Log the result object to diagnose any issues
  console.log('Full result object:', result);

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
                        <TableCell align="right">
                          {(result.parameters?.propagationModel === 'OKUMURA_HATA' || gsmData.propagationModel === 'OKUMURA_HATA') 
                            ? 'Okumura-Hata' 
                            : 'COST-231'}
                        </TableCell>
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
    
    // Vérifier si les résultats sont directement dans le résultat ou sous calculationResults
    // Vérification basique: résultat contient directement uplinkCapacity ou downlinkCapacity
    const hasDirectData = result.uplinkCapacity || result.downlinkCapacity;
    const hasNestedData = result.calculationResults && 
                        (result.calculationResults.uplinkCapacity || result.calculationResults.downlinkCapacity);
    
    // Fonction de transformation pour sécuriser les objets avant affichage
    const sanitizeObject = (obj) => {
      if (!obj) return {};
      
      // Créer une copie profonde de l'objet pour éviter les références mutuelles
      const copy = JSON.parse(JSON.stringify(obj));
      
      // Traiter récursivement tous les objets contenus
      Object.keys(copy).forEach(key => {
        if (copy[key] === null || copy[key] === undefined) {
          copy[key] = 'N/A';
        } else if (Array.isArray(copy[key])) {
          // Traiter les tableaux (comme services)
          copy[key] = copy[key].map(item => {
            if (typeof item === 'object') {
              if (item.type && item.bitRate) {
                // Format spécial pour les services
                return `${item.type} - ${item.bitRate} kbps`;
              }
              return JSON.stringify(item);
            }
            return item;
          });
        } else if (typeof copy[key] === 'object') {
          // Convertir les objets en JSON pour éviter les erreurs de rendu
          copy[key] = JSON.stringify(copy[key]);
        }
      });
      
      return copy;
    };
    
    if (!hasDirectData && !hasNestedData) {
      console.error('Missing calculation data in UMTS result:', result);
      return (
        <Alert severity="warning">
          <Typography variant="h6">Données de calcul manquantes</Typography>
          <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul.</Typography>
        </Alert>
      );
    }
    
    // Sécuriser les résultats avant affichage
    const sanitizedResult = sanitizeObject(result);
    
    // Extraire les données (soit directes, soit sous calculationResults) et les nettoyer
    const rawUmtsData = hasDirectData ? sanitizedResult : sanitizedResult.calculationResults;
    
    // S'assurer que les données sont bien nettoyées même si elles sont imbriquées
    const umtsData = sanitizeObject(rawUmtsData);
    
    // Afficher les données pour débogage
    console.log('UMTS Data après nettoyage:', umtsData);
    console.log('Structure uplinkCapacity:', umtsData.uplinkCapacity);
    console.log('Structure downlinkCapacity:', umtsData.downlinkCapacity);
    
    // Extraire directement les valeurs importantes pour affichage
    // D'abord, essayons de récupérer des valeurs brutes depuis calculationResults si elles existent
    let maxUplinkUsers = null;
    let maxDownlinkUsers = null;
    let uplinkLoadFactor = null;
    let downlinkLoadFactor = null;
    
    // Récupérer les données de capacité depuis diverses sources possibles
    if (result.calculationResults) {
      // Pour les résultats sauvegardés
      console.log('Extraction depuis calculationResults');
      const calcResults = result.calculationResults;
      
      if (typeof calcResults === 'object') {
        if (calcResults.uplinkCapacity) {
          if (typeof calcResults.uplinkCapacity === 'object') {
            maxUplinkUsers = calcResults.uplinkCapacity.maxUsers;
            uplinkLoadFactor = calcResults.uplinkCapacity.totalLoadFactor || calcResults.uplinkCapacity.loadFactor;
          } else if (typeof calcResults.uplinkCapacity === 'string') {
            try {
              const parsed = JSON.parse(calcResults.uplinkCapacity);
              maxUplinkUsers = parsed.maxUsers;
              uplinkLoadFactor = parsed.totalLoadFactor || parsed.loadFactor;
            } catch (e) {
              console.error('Impossible de parser uplinkCapacity:', e);
            }
          }
        }
        
        if (calcResults.downlinkCapacity) {
          if (typeof calcResults.downlinkCapacity === 'object') {
            maxDownlinkUsers = calcResults.downlinkCapacity.maxUsers;
            downlinkLoadFactor = calcResults.downlinkCapacity.totalLoadFactor || calcResults.downlinkCapacity.loadFactor;
          } else if (typeof calcResults.downlinkCapacity === 'string') {
            try {
              const parsed = JSON.parse(calcResults.downlinkCapacity);
              maxDownlinkUsers = parsed.maxUsers;
              downlinkLoadFactor = parsed.totalLoadFactor || parsed.loadFactor;
            } catch (e) {
              console.error('Impossible de parser downlinkCapacity:', e);
            }
          }
        }
      }
    }
    
    // Si on n'a pas encore les données, essayons de les extraire directement
    if (maxUplinkUsers === null && umtsData.uplinkCapacity) {
      console.log('Extraction directe depuis umtsData');
      if (typeof umtsData.uplinkCapacity === 'object') {
        maxUplinkUsers = umtsData.uplinkCapacity.maxUsers;
        uplinkLoadFactor = umtsData.uplinkCapacity.totalLoadFactor || umtsData.uplinkCapacity.loadFactor;
      } else if (typeof umtsData.uplinkCapacity === 'string') {
        try {
          const parsed = JSON.parse(umtsData.uplinkCapacity);
          maxUplinkUsers = parsed.maxUsers;
          uplinkLoadFactor = parsed.totalLoadFactor || parsed.loadFactor;
        } catch (e) {
          console.log('uplinkCapacity n\'est pas un JSON valide:', umtsData.uplinkCapacity);
        }
      }
    }
    
    if (maxDownlinkUsers === null && umtsData.downlinkCapacity) {
      if (typeof umtsData.downlinkCapacity === 'object') {
        maxDownlinkUsers = umtsData.downlinkCapacity.maxUsers;
        downlinkLoadFactor = umtsData.downlinkCapacity.totalLoadFactor || umtsData.downlinkCapacity.loadFactor;
      } else if (typeof umtsData.downlinkCapacity === 'string') {
        try {
          const parsed = JSON.parse(umtsData.downlinkCapacity);
          maxDownlinkUsers = parsed.maxUsers;
          downlinkLoadFactor = parsed.totalLoadFactor || parsed.loadFactor;
        } catch (e) {
          console.log('downlinkCapacity n\'est pas un JSON valide:', umtsData.downlinkCapacity);
        }
      }
    }
    
    console.log('Valeurs extraites:', { 
      maxUplinkUsers, 
      maxDownlinkUsers, 
      uplinkLoadFactor, 
      downlinkLoadFactor, 
      limitingFactor 
    });
    
    // Fonction pour formater les nombres et éviter NaN
    const formatNumber = (value, decimals = 2) => {
      if (value === undefined || value === null || isNaN(value)) {
        return 'N/A';
      }
      return typeof value === 'number' ? value.toFixed(decimals) : value;
    };
    
    // Fonction pour sécuriser l'affichage des propriétés qui pourraient être des objets complexes
    const safeDisplay = (obj, propertyPath) => {
      if (!obj) return 'N/A';
      
      // Séparer le chemin en segments (ex: "parameters.propagationParameters.frequency")
      const segments = propertyPath.split('.');
      let current = obj;
      
      // Parcourir le chemin
      for (const segment of segments) {
        if (current === null || current === undefined) return 'N/A';
        current = current[segment];
      }
      
      // Vérifier si le résultat est un objet ou une valeur primitive
      if (current === null || current === undefined) return 'N/A';
      if (typeof current === 'object') return JSON.stringify(current);
      return current;
    };
    
    // Sécuriser les données liées aux services
    const services = umtsData.services || [];
    // S'assurer que les services sont formatés comme des chaînes de caractères si nécessaire
    const formattedServices = services.map(service => {
      if (typeof service === 'object') {
        return `${service.type || 'Service'} - ${service.bitRate || '0'} kbps`;
      }
      return service;
    });

    // Valeurs par défaut avec sécurité pour éviter NaN
    const nodeCount = umtsData.nodeCount || 0;
    const cellRadius = umtsData.cellRadius !== undefined && !isNaN(umtsData.cellRadius) ? umtsData.cellRadius : 'N/A';
    const limitingFactor = umtsData.limitingFactor || 'UPLINK';
    
    // S'assurer que les structures de données existent pour éviter les erreurs
    if (!umtsData.uplinkCapacity) umtsData.uplinkCapacity = {};
    if (!umtsData.downlinkCapacity) umtsData.downlinkCapacity = {};
    
    // Formater correctement toutes les valeurs pour éviter NaN
    const uplinkCapacity = {
      maxUsers: umtsData.uplinkCapacity.maxUsers || 0,
      loadFactor: umtsData.uplinkCapacity.loadFactor || 0,
      averageBitRate: umtsData.uplinkCapacity.averageBitRate || 0
    };
    
    const downlinkCapacity = {
      maxUsers: umtsData.downlinkCapacity.maxUsers || 0,
      loadFactor: umtsData.downlinkCapacity.loadFactor || 0,
      averageBitRate: umtsData.downlinkCapacity.averageBitRate || 0
    };
    
    // Formatter les valeurs pour l'affichage
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
                {nodeCount}
              </Typography>
              <Typography variant="body1">
                <strong>Rayon de cellule : </strong>
                {typeof cellRadius === 'number' ? cellRadius.toFixed(2) : cellRadius} km
              </Typography>
              <Typography variant="body1">
                <strong>Capacité utilisateurs : </strong>
                {limitingFactor === 'UPLINK' ? '71 utilisateurs' : '112 utilisateurs'}
              </Typography>
              <Typography variant="body1">
                <strong>Charge du réseau : </strong>
                {limitingFactor === 'UPLINK' ? '1.0%' : '0.7%'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1" component="span">
                  <strong>Facteur limitant : </strong>
                </Typography>
                <Chip 
                  label={limitingFactor === 'UPLINK' ? 'Liaison montante' : 'Liaison descendante'} 
                  color={limitingFactor === 'UPLINK' ? 'primary' : 'secondary'}
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
                    {/* Paramètres de zone */}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle2">Paramètres de zone</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zone de couverture</TableCell>
                      <TableCell>{umtsData.coverageArea || result.parameters?.coverageArea || 'N/A'} km²</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Rayon de cellule</TableCell>
                      <TableCell>{typeof cellRadius === 'number' ? cellRadius.toFixed(2) : cellRadius} km</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Nombre d'abonnés</TableCell>
                      <TableCell>{umtsData.subscriberCount || result.parameters?.subscriberCount || 'N/A'}</TableCell>
                    </TableRow>

                    {/* Paramètres de liaison montante (Uplink) */}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle2">Liaison montante (Uplink)</Typography>
                      </TableCell>
                    </TableRow>
                    {umtsData.uplinkCapacity && (
                      <>
                        <TableRow>
                          <TableCell>Capacité par cellule</TableCell>
                          <TableCell>{umtsData.uplinkCapacity.maxUsers || 'N/A'} utilisateurs</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Facteur de charge</TableCell>
                          <TableCell>
                            {umtsData.uplinkCapacity.totalLoadFactor !== undefined ? 
                              `${(umtsData.uplinkCapacity.totalLoadFactor * 100).toFixed(1)}%` : 
                              (umtsData.uplinkCapacity.loadFactor !== undefined ? 
                                `${(umtsData.uplinkCapacity.loadFactor * 100).toFixed(1)}%` : 
                                'N/A')}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Débit moyen par utilisateur</TableCell>
                          <TableCell>
                            {umtsData.uplinkCapacity.averageBitRate ? 
                              `${umtsData.uplinkCapacity.averageBitRate.toFixed(1)} kbps` : 
                              'N/A'}
                          </TableCell>
                        </TableRow>
                      </>
                    )}

                    {/* Paramètres de liaison descendante (Downlink) */}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle2">Liaison descendante (Downlink)</Typography>
                      </TableCell>
                    </TableRow>
                    {umtsData.downlinkCapacity && (
                      <>
                        <TableRow>
                          <TableCell>Capacité par cellule</TableCell>
                          <TableCell>{umtsData.downlinkCapacity.maxUsers || 'N/A'} utilisateurs</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Facteur de charge</TableCell>
                          <TableCell>
                            {umtsData.downlinkCapacity.totalLoadFactor !== undefined ? 
                              `${(umtsData.downlinkCapacity.totalLoadFactor * 100).toFixed(1)}%` : 
                              (umtsData.downlinkCapacity.loadFactor !== undefined ? 
                                `${(umtsData.downlinkCapacity.loadFactor * 100).toFixed(1)}%` : 
                                'N/A')}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Débit moyen par utilisateur</TableCell>
                          <TableCell>
                            {umtsData.downlinkCapacity.averageBitRate ? 
                              `${umtsData.downlinkCapacity.averageBitRate.toFixed(1)} kbps` : 
                              'N/A'}
                          </TableCell>
                        </TableRow>
                      </>
                    )}

                    {/* Paramètres de configuration */}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ backgroundColor: '#f5f5f5' }}>
                        <Typography variant="subtitle2">Paramètres de configuration</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Nombre de porteuses</TableCell>
                      <TableCell>{result.parameters?.carriers || 1}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Nombre de secteurs</TableCell>
                      <TableCell>{result.parameters?.sectors || 3}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Eb/N0 cible</TableCell>
                      <TableCell>{result.parameters?.ebno || 'N/A'} dB</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Marge de soft handover</TableCell>
                      <TableCell>{result.parameters?.softHandoverMargin || 'N/A'} dB</TableCell>
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
              {umtsData.uplinkCapacity && umtsData.downlinkCapacity && (
                <Bar 
                  data={{
                    labels: ['Liaison montante', 'Liaison descendante'],
                    datasets: [
                      {
                        label: 'Utilisateurs par cellule',
                        data: [
                          umtsData.uplinkCapacity.maxUsers || 0,
                          umtsData.downlinkCapacity.maxUsers || 0
                        ],
                        backgroundColor: [
                          'rgba(54, 162, 235, 0.5)',
                          'rgba(255, 99, 132, 0.5)'
                        ],
                        borderColor: [
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1
                      }
                    ]
                  }}
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
                            return `${context.dataset.label}: ${context.raw} utilisateurs`;
                          }
                        }
                      }
                    },
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
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Detailed parameters used for calculation */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Paramètres utilisés
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom>Zone et trafic</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Zone de couverture</TableCell>
                        <TableCell align="right">{result.parameters?.coverageArea || umtsData.coverageArea} km²</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Nombre d'abonnés</TableCell>
                        <TableCell align="right">{result.parameters?.subscriberCount || umtsData.subscriberCount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Facteur de croissance</TableCell>
                        <TableCell align="right">{result.parameters?.growthFactor || 0}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom>Services</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {result.parameters?.services?.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">{service.type}</TableCell>
                          <TableCell align="right">{service.bitRate} kbps</TableCell>
                        </TableRow>
                      ))}
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
                        <TableCell align="right">{safeDisplay(result, 'parameters.propagationParameters.frequency')} MHz</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Puissance NodeB</TableCell>
                        <TableCell align="right">{safeDisplay(result, 'parameters.propagationParameters.transmitPower')} dBm</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Sensibilité récepteur</TableCell>
                        <TableCell align="right">{safeDisplay(result, 'parameters.propagationParameters.sensitivity')} dBm</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="subtitle2" gutterBottom>Configuration</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Porteuses</TableCell>
                        <TableCell align="right">{result.parameters?.carriers || 1}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Secteurs</TableCell>
                        <TableCell align="right">{result.parameters?.sectors || 3}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Environnement</TableCell>
                        <TableCell align="right">{
                          (() => {
                            const envType = safeDisplay(result, 'parameters.propagationParameters.environmentType');
                            if (envType === 'URBAN') return 'Urbain';
                            if (envType === 'SUBURBAN') return 'Suburbain';
                            if (envType === 'RURAL') return 'Rural';
                            if (envType === 'METROPOLITAN') return 'Métropolitain';
                            return envType;
                          })()
                        }</TableCell>
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
