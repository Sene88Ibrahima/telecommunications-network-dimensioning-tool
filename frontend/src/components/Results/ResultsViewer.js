import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Typography, Grid, Box, Tabs, Tab,
  CircularProgress, Divider, Card, CardContent, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

// Import the API service
import { getResultById } from '../../services/api/api.service';

// Import ResultsDisplay component for detailed visualization
import ResultsDisplay from './ResultsDisplay';

const ResultsViewer = () => {
  // Utiliser useParams pour récupérer le paramètre d'URL
  const params = useParams();
  const resultId = params.id; 
  console.log('Current URL params:', params);
  console.log('Result ID from URL:', resultId);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  const [error, setError] = useState(null);

  // Fetch the actual result data from the API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching result with ID:', resultId);
        
        // Fetch the result from the API
        const response = await getResultById(resultId);
        console.log('API Response:', response);
        console.log('Response structure:', JSON.stringify(response.data, null, 2));
        
        if (response.data && response.data.data) {
          console.log('Setting results with data:', response.data.data);
          // Accéder aux données dans la structure correcte
          setResults(response.data.data);
        } else {
          console.error('Invalid API response structure', response.data);
          throw new Error('Structure de réponse API invalide');
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        console.error('Error details:', error.response || error.message || error);
        setError('Impossible de charger les résultats. ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchResults();
    } else {
      console.warn('No resultId provided');
    }
  }, [resultId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Erreur lors du chargement des résultats
            </Typography>
          </Alert>
          <Typography variant="body1">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  if (!results) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error">
            Résultats non disponibles
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Impossible de charger les résultats demandés. Veuillez réessayer ou revenir au tableau de bord.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Déterminer le type de réseau à partir des données récupérées
  const networkType = results.project?.networkType?.toUpperCase() || 'GSM';
  
  // Générer un titre adapté au type de réseau
  const getResultTitle = () => {
    const resultName = results.name || 'Résultat sans nom';
    
    if (networkType === 'GSM') {
      return `Dimensionnement GSM - ${resultName}`;
    } else if (networkType === 'UMTS') {
      return `Dimensionnement UMTS - ${resultName}`;
    } else if (networkType === 'HERTZIEN') {
      return `Bilan de Liaison Hertzienne - ${resultName}`;
    } else if (networkType === 'OPTIQUE') {
      return `Bilan de Liaison Optique - ${resultName}`;
    } else {
      return resultName;
    }
  };
  
  // Rendre les informations clés selon le type de réseau
  const renderKeyInfo = () => {
    const calculationResults = results.calculationResults || {};
    
    if (networkType === 'GSM') {
      // Déterminer le facteur limitant pour GSM
      const btsCount = calculationResults.btsCount || 0;
      const btsCountForCapacity = calculationResults.btsCountForCapacity || 0;
      const limitingFactor = btsCountForCapacity > btsCount ? 'Capacité' : 'Couverture';
      
      return (
        <>
          <Typography variant="body1">
            <strong>Nombre de BTS:</strong> {calculationResults.finalBtsCount || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Rayon de cellule:</strong> {calculationResults.cellRadius || 'N/A'} km
          </Typography>
          <Typography variant="body1">
            <strong>Trafic total:</strong> {calculationResults.totalTraffic || 'N/A'} Erlang
          </Typography>
          <Typography variant="body1">
            <strong>Dimensionnement limité par:</strong> {limitingFactor}
          </Typography>
        </>
      );
    } else if (networkType === 'UMTS') {
      return (
        <>
          <Typography variant="body1">
            <strong>Capacité utilisateurs:</strong> {calculationResults.userCapacity || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Charge du réseau:</strong> {calculationResults.networkLoad || 'N/A'}%
          </Typography>
          <Typography variant="body1">
            <strong>Rayon de cellule:</strong> {calculationResults.cellRadius || 'N/A'} km
          </Typography>
        </>
      );
    } else if (networkType === 'HERTZIEN') {
      return (
        <>
          <Typography variant="body1">
            <strong>Perte en espace libre:</strong> {calculationResults.freeSpaceLoss || 'N/A'} dB
          </Typography>
          <Typography variant="body1">
            <strong>Marge de liaison:</strong> {calculationResults.linkMargin || 'N/A'} dB
          </Typography>
          <Typography variant="body1">
            <strong>Disponibilité:</strong> {calculationResults.availability || 'N/A'}%
          </Typography>
        </>
      );
    } else if (networkType === 'OPTIQUE') {
      return (
        <>
          <Typography variant="body1">
            <strong>Budget optique:</strong> {calculationResults.opticalBudget || 'N/A'} dB
          </Typography>
          <Typography variant="body1">
            <strong>Pertes totales:</strong> {calculationResults.totalLosses || 'N/A'} dB
          </Typography>
          <Typography variant="body1">
            <strong>Portée maximale:</strong> {calculationResults.maxRange || 'N/A'} km
          </Typography>
        </>
      );
    } else {
      return (
        <Typography variant="body1">
          Aucune information clé disponible pour ce type de résultat.
        </Typography>
      );
    }
  };
  
  // Formatage adapté pour les paramètres
  const formatParameterName = (key) => {
    const nameMappings = {
      // GSM
      coverageArea: 'Zone de couverture',
      trafficPerSubscriber: 'Trafic par abonné',
      subscriberCount: 'Nombre d\'abonnés',
      frequency: 'Fréquence',
      btsPower: 'Puissance BTS',
      mobileReceptionThreshold: 'Seuil de réception',
      propagationModel: 'Modèle de propagation',
      
      // UMTS
      ebno: 'Eb/No',
      softHandoverMargin: 'Marge de handover',
      
      // Hertzien
      distance: 'Distance',
      antennaGain1: 'Gain antenne 1',
      antennaGain2: 'Gain antenne 2',
      transmitPower: 'Puissance d\'emission',
      receiverSensitivity: 'Sensibilité du récepteur',
      rainZone: 'Zone de pluie',
      
      // Optique
      fiberType: 'Type de fibre',
      linkLength: 'Longueur de liaison',
      wavelength: 'Longueur d\'onde',
      connectorCount: 'Nombre de connecteurs',
      spliceCount: 'Nombre dépissures'
    };
    
    return nameMappings[key] || key;
  };

  const formatParameterValue = (key, value) => {
    const unitMappings = {
      coverageArea: 'km²',
      trafficPerSubscriber: 'Erlang',
      frequency: 'MHz',
      btsPower: 'dBm',
      mobileReceptionThreshold: 'dBm',
      distance: 'km',
      antennaGain1: 'dBi',
      antennaGain2: 'dBi',
      transmitPower: 'dBm',
      receiverSensitivity: 'dBm',
      linkLength: 'km',
      wavelength: 'nm'
    };
    
    if (key === 'propagationModel') {
      const models = {
        OKUMURA_HATA: 'Okumura-Hata',
        COST231: 'COST-231',
        FREE_SPACE: 'Espace libre'
      };
      return models[value] || value;
    }
    
    if (key === 'fiberType') {
      const types = {
        MONOMODE: 'Monomode',
        MULTIMODE: 'Multimode'
      };
      return types[value] || value;
    }
    
    if (unitMappings[key]) {
      return `${value} ${unitMappings[key]}`;
    }
    
    return value;
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {getResultTitle()}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {results.configuration?.name || 'Configuration non spécifiée'}
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        {/* Informations de débogage */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2">
            ID du résultat: {resultId}
          </Typography>
          <Typography variant="body2">
            Type de réseau: {networkType}
          </Typography>
        </Box>
        
        {/* Navigation par onglets */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="result tabs">
            <Tab label="Résumé" />
            <Tab label="Détails" />
            <Tab label="Données brutes" /> {/* Nouvel onglet pour le débogage */}
          </Tabs>
        </Box>
        
        {/* Contenu des onglets */}
        <Box sx={{ py: 3 }}>
          {tabValue === 0 ? (
            // Onglet Résumé
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Informations clés
                      </Typography>
                      {renderKeyInfo()}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Paramètres
                      </Typography>
                      {Object.entries(results.configuration?.parameters || {}).map(([key, value]) => (
                        <Typography key={key} variant="body2" gutterBottom>
                          <strong>{formatParameterName(key)}:</strong> {formatParameterValue(key, value)}
                        </Typography>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : tabValue === 1 ? (
            // Onglet Détails - avec gestion des erreurs
            <Box>
              {(() => {
                try {
                  return <ResultsDisplay result={results} type={networkType} />;
                } catch (error) {
                  console.error('Erreur lors de l\'affichage des résultats détaillés:', error);
                  return (
                    <Alert severity="error">
                      <Typography variant="h6">Erreur d'affichage</Typography>
                      <Typography variant="body2">Une erreur s'est produite lors de l'affichage des résultats détaillés.</Typography>
                      <Typography variant="body2">{error.message}</Typography>
                    </Alert>
                  );
                }
              })()}
            </Box>
          ) : (
            // Onglet Données brutes - pour le débogage
            <Box>
              <Typography variant="h6" gutterBottom>Données brutes du résultat</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Structure des données pour débogage</Typography>
                <Typography variant="body2">Ces informations aident à comprendre le format des données reçues.</Typography>
              </Alert>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Résultat principal :</Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', mb: 3 }}>
                <pre style={{ overflowX: 'auto', maxHeight: '200px', padding: '10px' }}>
                  {JSON.stringify(results, null, 2)}
                </pre>
              </Paper>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Configuration :</Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5', mb: 3 }}>
                <pre style={{ overflowX: 'auto', maxHeight: '200px', padding: '10px' }}>
                  {JSON.stringify(results.configuration, null, 2)}
                </pre>
              </Paper>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Données de calcul :</Typography>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <pre style={{ overflowX: 'auto', maxHeight: '200px', padding: '10px' }}>
                  {JSON.stringify(results.calculationResults, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

// Utility function to format parameter names for display
const formatParameterName = (key) => {
  const names = {
    area: 'Surface',
    traffic: 'Trafic par abonné',
    subscribers: 'Nombre d\'abonnés',
    frequency: 'Fréquence',
    transmitPower: 'Puissance d\'émission',
    receiverThreshold: 'Seuil de réception',
  };
  
  return names[key] || key;
};

// Utility function to format parameter values with units
const formatParameterValue = (key, value) => {
  const units = {
    area: 'km²',
    traffic: 'Erlang',
    subscribers: '',
    frequency: 'MHz',
    transmitPower: 'dBm',
    receiverThreshold: 'dBm',
  };
  
  return `${value} ${units[key] || ''}`;
};

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default ResultsViewer;
