import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Snackbar
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import CalculateIcon from '@mui/icons-material/Calculate';
import { 
  calculateHertzianLinkBudget, 
  saveProjectConfiguration, 
  saveProjectResult 
} from '../../services/api/api.service';
import ResultsDisplay from '../Results/ResultsDisplay';
import HertzianResultsDisplay from '../Results/HertzianResultsDisplay';

// Step titles
const steps = ['Paramètres de liaison', 'Équipements radio', 'Modulation et Débit', 'Conditions environnementales', 'Récapitulatif'];

const HertzianLinkCalculator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = location.state?.projectId;
  const configurationId = location.state?.configurationId;
  
  const [activeStep, setActiveStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Définir les valeurs valides pour les listes déroulantes
  const validModulationTypes = ['BPSK', 'QPSK', 'QAM16', 'QAM64', 'QAM256', 'QAM1024'];
  const validTargetBERs = ['0.1', '0.01', '0.001', '0.0001', '0.00001', '0.000001', '0.0000001', '0.00000001', '0.000000001'];
  const validRainZones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q'];
  const validTerrainTypes = ['WATER', 'FLAT', 'AVERAGE', 'HILLY', 'MOUNTAINOUS', 'URBAN'];
  
  // Configuration initiale du formulaire avec valeurs par défaut
  const { control, handleSubmit, formState: { errors }, watch, setValue, getValues } = useForm({
    defaultValues: {
      // Paramètres de liaison
      frequency: 18, // en GHz
      distance: 10, // en km
      antennaHeight1: 30, // en m
      antennaHeight2: 30, // en m
      siteElevation1: 100, // en m (altitude du site 1)
      siteElevation2: 100, // en m (altitude du site 2)
      
      // Paramètres d'équipement
      transmitPower: 23, // en dBm
      antennaGain1: 38, // en dBi
      antennaGain2: 38, // en dBi
      receiverThreshold: -85, // en dBm
      cableLosses: 2, // en dB (pertes câbles)
      connectorLosses: 0.5, // en dB (pertes connecteurs)
      otherLosses: 2, // en dB (autres pertes diverses)
      
      // IMPORTANT: Les valeurs des sélecteurs sont maintenant initialisées avec des valeurs sûres
      // qui correspondent exactement aux options disponibles
      modulationType: 'QAM64',
      dataRate: 155, // en Mbps
      targetBER: '0.000001',
      bandwidthMHz: 28, // Bande passante en MHz
      
      // Conditions environnementales
      rainZone: 'K',
      terrainType: 'AVERAGE',
      fresnelClearance: 80, // en % de la zone de Fresnel dégagée 
      fogDensity: 0.05 // en g/m³ (densité du brouillard)
    }
  });
  
  // Fonction pour vérifier si une valeur est valide pour un Select
  const isValidSelectValue = (value, validOptions) => {
    return typeof value === 'string' && validOptions.includes(value);
  };
  
  // Fonctions de formatage pour les Select
  const formatSelectValue = (name, value, defaultValue) => {
    switch(name) {
      case 'modulationType':
        return isValidSelectValue(value, validModulationTypes) ? value : defaultValue;
      case 'targetBER':
        return isValidSelectValue(value, validTargetBERs) ? value : defaultValue;
      case 'rainZone':
        return isValidSelectValue(value, validRainZones) ? value : defaultValue;
      case 'terrainType':
        return isValidSelectValue(value, validTerrainTypes) ? value : defaultValue;
      default:
        return value;
    }
  };
  
  // Initialisation avec des contrôleurs personnalisés pour les Select
  React.useEffect(() => {
    console.log('Initialisation des composants Select avec des valeurs valides...');
    
    // S'assurer que les valeurs des select sont correctes dès le départ
    setValue('modulationType', 'QAM64');
    setValue('targetBER', '0.000001');
    setValue('rainZone', 'K');
    setValue('terrainType', 'AVERAGE');
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCalculationResult(null);
    setError(null);
  };

  const onSubmit = async (data) => {
    try {
      setIsCalculating(true);
      setError(null);
      
      // S'assurer que toutes les valeurs numériques sont correctement converties
      const numericParams = {
        frequency: parseFloat(data.frequency),
        distance: parseFloat(data.distance),
        transmitPower: parseFloat(data.transmitPower),
        antennaGain1: parseFloat(data.antennaGain1),
        antennaGain2: parseFloat(data.antennaGain2),
        receiverThreshold: parseFloat(data.receiverThreshold),
        antennaHeight1: parseFloat(data.antennaHeight1),
        antennaHeight2: parseFloat(data.antennaHeight2),
        siteElevation1: parseFloat(data.siteElevation1),
        siteElevation2: parseFloat(data.siteElevation2),
        cableLosses: parseFloat(data.cableLosses || 0),
        connectorLosses: parseFloat(data.connectorLosses || 0),
        otherLosses: parseFloat(data.otherLosses || 0),
        dataRate: parseFloat(data.dataRate),
        bandwidthMHz: parseFloat(data.bandwidthMHz || 20),
        fresnelClearance: parseFloat(data.fresnelClearance),
        fogDensity: parseFloat(data.fogDensity || 0)
      };
      
      // Vérifier si des valeurs sont NaN après conversion
      const nanValues = Object.entries(numericParams)
        .filter(([_, value]) => isNaN(value))
        .map(([key]) => key);
      
      if (nanValues.length > 0) {
        throw new Error(`Valeurs invalides pour: ${nanValues.join(', ')}. Veuillez entrer des nombres valides.`);
      }
      
      // Valider une dernière fois les valeurs des Select avant l'envoi à l'API
      const validatedModulationType = formatSelectValue('modulationType', data.modulationType, 'QAM64');
      const validatedTargetBER = formatSelectValue('targetBER', data.targetBER, '0.000001');
      const validatedRainZone = formatSelectValue('rainZone', data.rainZone, 'K');
      const validatedTerrainType = formatSelectValue('terrainType', data.terrainType, 'AVERAGE');
      
      // Journaliser les corrections si nécessaire
      if (validatedModulationType !== data.modulationType) {
        console.log('Correction de modulationType avant envoi API:', validatedModulationType);
      }
      if (validatedTargetBER !== data.targetBER) {
        console.log('Correction de targetBER avant envoi API:', validatedTargetBER);
      }
      if (validatedRainZone !== data.rainZone) {
        console.log('Correction de rainZone avant envoi API:', validatedRainZone);
      }
      if (validatedTerrainType !== data.terrainType) {
        console.log('Correction de terrainType avant envoi API:', validatedTerrainType);
      }
      
      // Préparer les données à envoyer à l'API
      const apiData = {
        // Paramètres de base
        frequency: numericParams.frequency,
        distance: numericParams.distance,
        transmitPower: numericParams.transmitPower,
        antennaGain1: numericParams.antennaGain1,
        antennaGain2: numericParams.antennaGain2,
        receiverThreshold: numericParams.receiverThreshold,
        antennaHeight1: numericParams.antennaHeight1,
        antennaHeight2: numericParams.antennaHeight2,
        siteElevation1: numericParams.siteElevation1,
        siteElevation2: numericParams.siteElevation2,
        
        // Agréger toutes les pertes en un seul paramètre comme attendu par le backend
        losses: numericParams.cableLosses + numericParams.connectorLosses + numericParams.otherLosses,
        
        // Paramètres de modulation et débit avec les valeurs validées
        modulationType: validatedModulationType,
        dataRate: numericParams.dataRate,
        targetBER: parseFloat(validatedTargetBER),  // Convertir targetBER en nombre
        bandwidthMHz: numericParams.bandwidthMHz,
        
        // Paramètres environnementaux avec les valeurs validées
        rainZone: validatedRainZone,
        terrainType: validatedTerrainType,
        fresnelClearance: numericParams.fresnelClearance,
        fogDensity: numericParams.fogDensity,
        
        // ID de configuration si disponible
        configurationId: configurationId,
        saveResults: false // Ne pas sauvegarder automatiquement
      };
      
      console.log('Données envoyées à l\'API:', apiData);
      
      // Appel API pour le calcul
      const response = await calculateHertzianLinkBudget(apiData);
      setCalculationResult(response.data.data);
      
      // Aller à l'étape des résultats (étape après la dernière étape du formulaire)
      setActiveStep(steps.length);
    } catch (err) {
      console.error('Erreur lors du calcul:', err);
      setError(err.response?.data?.message || 'Erreur lors du calcul. Veuillez vérifier vos paramètres.');
    } finally {
      setIsCalculating(false);
    }
  };
  
  const handleSaveResult = async () => {
    if (!calculationResult) {
      setError('Aucun résultat à sauvegarder');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const formValues = watch();
      
      // Si pas de projectId, demander à l'utilisateur de créer un projet
      if (!projectId) {
        setSuccessMessage('Pour sauvegarder les résultats, veuillez d\'abord créer un projet.');
        setShowSnackbar(true);
        // Utiliser un chemin différent pour éviter la confusion avec l'ID "new"
        setTimeout(() => {
          navigate('/projects', { 
            state: { 
              createNew: true,
              calculationType: 'HERTZIEN', 
              calculationData: formValues 
            } 
          });
        }, 2000);
        return;
      }
      
      // Vérifier que l'ID du projet est valide (pas 'new' ou une chaîne vide)
      if (projectId === 'new' || projectId === '') {
        setError('Identifiant de projet invalide. Veuillez créer un nouveau projet.');
        return;
      }
      
      // Sauvegarder la configuration si elle n'existe pas déjà
      let configId = configurationId;
      if (!configId) {
        const configData = {
          name: `Configuration Hertzienne ${new Date().toLocaleDateString()}`,
          parameters: formValues,
          projectId: projectId
        };
        
        const configResponse = await saveProjectConfiguration(projectId, configData);
        console.log('Réponse de configuration:', configResponse);
        
        // Extraire l'ID de la bonne structure de réponse (configResponse.data.data.id)
        if (configResponse?.data?.data?.id) {
          configId = configResponse.data.data.id;
        } else if (configResponse?.data?.id) {
          configId = configResponse.data.id;
        } else {
          throw new Error('Impossible de récupérer l\'ID de configuration');
        }
      }
      
      // Sauvegarder les résultats
      const resultData = {
        name: `Résultat Hertzien ${new Date().toLocaleDateString()}`,
        calculationResults: calculationResult,
        projectId: projectId,
        configurationId: configId
      };
      
      const resultResponse = await saveProjectResult(projectId, resultData);
      console.log('Réponse de sauvegarde de résultat:', resultResponse);
      
      // Extraire l'ID du résultat si disponible
      let resultId = null;
      if (resultResponse?.data?.data?.id) {
        resultId = resultResponse.data.data.id;
      } else if (resultResponse?.data?.id) {
        resultId = resultResponse.data.id;
      }
      
      // Afficher un message de succès
      setSuccessMessage('Résultats sauvegardés avec succès!');
      setShowSnackbar(true);
      
      // Rediriger vers la page de résultat hertzien spécifique après quelques secondes
      setTimeout(() => {
        // Si nous avons un ID de résultat valide, rediriger vers la page de résultat hertzien
        if (resultId) {
          navigate(`/results/hertzian/${resultId}`, { replace: true });
        }
        // Sinon, rediriger vers le projet
        else if (projectId && projectId !== 'new' && projectId !== '') {
          navigate(`/projects/${projectId}`, { replace: true });
        } else {
          // En cas d'ID invalide, aller à la liste des projets
          navigate('/projects', { replace: true });
        }
      }, 2000);
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde des résultats.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Paramètres généraux de la liaison hertzienne. Les valeurs recommandées sont indiquées dans les champs.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="frequency"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 0.1, message: 'La fréquence minimale est 0.1 GHz' },
                  max: { value: 100, message: 'La fréquence maximale est 100 GHz' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fréquence (GHz)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.frequency}
                    helperText={errors.frequency?.message || 'Plage recommandée : 0.1 - 100 GHz'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Fréquence d'opération du faisceau hertzien. Les bandes typiques sont: 2.4, 5.8, 11, 18, 23, 38 GHz.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="distance"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 0.1, message: 'La distance minimale est 0.1 km' },
                  max: { value: 100, message: 'La distance maximale est 100 km' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Distance (km)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.distance}
                    helperText={errors.distance?.message || 'Plage recommandée : 0.1 - 100 km'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Distance entre les deux sites de la liaison. La portée maximale dépend de la fréquence et de l'environnement.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            
            {/* Hauteurs d'antennes */}
            <Grid item xs={12} md={6}>
              <Controller
                name="antennaHeight1"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 3, message: 'La hauteur minimale est 3 m' },
                  max: { value: 150, message: 'La hauteur maximale est 150 m' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hauteur antenne 1 (m)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.antennaHeight1}
                    helperText={errors.antennaHeight1?.message || 'Plage recommandée : 3 - 150 m'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Hauteur de l'antenne 1 par rapport au sol. Les tours typiques varient de 10 à 120 mètres.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="antennaHeight2"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 3, message: 'La hauteur minimale est 3 m' },
                  max: { value: 150, message: 'La hauteur maximale est 150 m' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hauteur antenne 2 (m)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.antennaHeight2}
                    helperText={errors.antennaHeight2?.message || 'Plage recommandée : 3 - 150 m'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Hauteur de l'antenne 2 par rapport au sol. Les tours typiques varient de 10 à 120 mètres.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            
            {/* Altitudes des sites */}
            <Grid item xs={12} md={6}>
              <Controller
                name="siteElevation1"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'L\'altitude minimale est 0 m (niveau de la mer)' },
                  max: { value: 5000, message: 'L\'altitude maximale est 5000 m' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Altitude site 1 (m)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.siteElevation1}
                    helperText={errors.siteElevation1?.message || 'Altitude par rapport au niveau de la mer (0 - 5000 m)'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Altitude du site 1 par rapport au niveau de la mer. Influence le dégagement du trajet radioélectrique.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="siteElevation2"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'L\'altitude minimale est 0 m (niveau de la mer)' },
                  max: { value: 5000, message: 'L\'altitude maximale est 5000 m' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Altitude site 2 (m)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.siteElevation2}
                    helperText={errors.siteElevation2?.message || 'Altitude par rapport au niveau de la mer (0 - 5000 m)'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Altitude du site 2 par rapport au niveau de la mer. Influence le dégagement du trajet radioélectrique.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );
      case 1: // Équipements
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Paramètres des équipements radio. Ces données influencent directement la qualité de la liaison.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="transmitPower"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: -10, message: 'La puissance minimale est -10 dBm' },
                  max: { value: 40, message: 'La puissance maximale est 40 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Puissance d'émission (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.transmitPower}
                    helperText={errors.transmitPower?.message || 'Plage recommandée : 10 - 30 dBm'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Puissance d'émission de l'équipement radio. Valeurs typiques: 20 dBm (100 mW) à 30 dBm (1 W).">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="receiverThreshold"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  max: { value: -30, message: 'Le seuil doit être inférieur à -30 dBm' },
                  min: { value: -120, message: 'Le seuil doit être supérieur à -120 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Seuil du récepteur (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.receiverThreshold}
                    helperText={errors.receiverThreshold?.message || 'Plage typique : -95 à -65 dBm'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Sensibilité du récepteur (valeur négative). Représente le niveau minimal de signal requis pour une réception correcte.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="antennaGain1"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Le gain minimal est 0 dBi' },
                  max: { value: 50, message: 'Le gain maximal est 50 dBi' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Gain antenne 1 (dBi)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.antennaGain1}
                    helperText={errors.antennaGain1?.message || 'Plage typique : 15 - 45 dBi'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Gain de l'antenne du site 1. Plus le gain est élevé, plus l'antenne est directive et plus la portée potentielle est grande.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="antennaGain2"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Le gain minimal est 0 dBi' },
                  max: { value: 50, message: 'Le gain maximal est 50 dBi' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Gain antenne 2 (dBi)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.antennaGain2}
                    helperText={errors.antennaGain2?.message || 'Plage typique : 15 - 45 dBi'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Gain de l'antenne du site 2. Plus le gain est élevé, plus l'antenne est directive et plus la portée potentielle est grande.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            
            {/* Pertes diverses - Nouveaux paramètres détaillés */}
            <Grid item xs={12} md={4}>
              <Controller
                name="cableLosses"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Les pertes minimales sont 0 dB' },
                  max: { value: 20, message: 'Les pertes maximales sont 20 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Pertes câbles (dB)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.cableLosses}
                    helperText={errors.cableLosses?.message || 'Plage typique : 0.5 - 5 dB'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Pertes dues aux câbles coaxiaux ou guides d'ondes. Dépendent de la longueur et du type de câble.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="connectorLosses"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Les pertes minimales sont 0 dB' },
                  max: { value: 5, message: 'Les pertes maximales sont 5 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Pertes connecteurs (dB)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.connectorLosses}
                    helperText={errors.connectorLosses?.message || 'Plage typique : 0.1 - 1 dB'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Pertes dues aux connecteurs. Chaque connecteur ajoute une petite perte, généralement 0.2-0.5 dB par connecteur.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller
                name="otherLosses"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Les pertes minimales sont 0 dB' },
                  max: { value: 20, message: 'Les pertes maximales sont 20 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Autres pertes (dB)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.otherLosses}
                    helperText={errors.otherLosses?.message || 'Pertes diverses (branches, obstacles, etc.)'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Pertes diverses : obstacles partiels, branches d'arbres, dégradation des équipements, etc.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );
      case 2: // Modulation et Débit (Nouvelle étape)
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Ces paramètres définissent les caractéristiques de transmission numérique de la liaison.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="modulationType"
                control={control}
                rules={{ required: 'Ce champ est requis' }}
                render={({ field }) => {
                  // S'assurer que la valeur est toujours valide avant le rendu
                  const safeValue = formatSelectValue('modulationType', field.value, 'QAM64');
                  
                  // Si la valeur a été changée, mettre à jour le champ
                  if (safeValue !== field.value) {
                    field.onChange(safeValue);
                  }
                  
                  return (
                    <FormControl fullWidth variant="outlined" error={!!errors.modulationType}>
                      <InputLabel>Type de modulation</InputLabel>
                      <Select {...field} value={safeValue} label="Type de modulation">
                        <MenuItem value="BPSK">BPSK (1 bit/symbole)</MenuItem>
                        <MenuItem value="QPSK">QPSK (2 bits/symbole)</MenuItem>
                        <MenuItem value="QAM16">16-QAM (4 bits/symbole)</MenuItem>
                        <MenuItem value="QAM64">64-QAM (6 bits/symbole)</MenuItem>
                        <MenuItem value="QAM256">256-QAM (8 bits/symbole)</MenuItem>
                        <MenuItem value="QAM1024">1024-QAM (10 bits/symbole)</MenuItem>
                      </Select>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        Les modulations plus élevées permettent de meilleurs débits mais nécessitent un meilleur rapport signal/bruit.
                      </Typography>
                    </FormControl>
                  );
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="dataRate"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 1, message: 'Le débit minimum est 1 Mbps' },
                  max: { value: 10000, message: 'Le débit maximum est 10 Gbps (10000 Mbps)' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Débit de données (Mbps)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.dataRate}
                    helperText={errors.dataRate?.message || 'Débit cible pour la liaison (1 - 10000 Mbps)'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Débit binaire visé pour la liaison. La faisabilité dépend de la bande passante, de la modulation et du SNR.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="targetBER"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis'
                  // Pas besoin de min/max car c'est une liste prédéfinie de valeurs
                }}
                render={({ field }) => {
                  // S'assurer que la valeur est toujours valide avant le rendu
                  const safeValue = formatSelectValue('targetBER', field.value, '0.000001');
                  
                  // Si la valeur a été changée, mettre à jour le champ
                  if (safeValue !== field.value) {
                    field.onChange(safeValue);
                  }
                  
                  return (
                    <FormControl fullWidth variant="outlined" error={!!errors.targetBER}>
                      <InputLabel>Taux d'erreur binaire (BER) cible</InputLabel>
                      <Select {...field} value={safeValue} label="Taux d'erreur binaire (BER) cible">
                        <MenuItem value="0.1">10⁻¹ (Très dégradé, inutilisable)</MenuItem>
                        <MenuItem value="0.01">10⁻² (Dégradé, test uniquement)</MenuItem>
                        <MenuItem value="0.001">10⁻³ (Minimalement utilisable)</MenuItem>
                        <MenuItem value="0.0001">10⁻⁴ (Acceptable pour certaines applications)</MenuItem>
                        <MenuItem value="0.00001">10⁻⁵ (Standard pour la voix)</MenuItem>
                        <MenuItem value="0.000001">10⁻⁶ (Standard pour les données)</MenuItem>
                        <MenuItem value="0.0000001">10⁻⁷ (Haute qualité)</MenuItem>
                        <MenuItem value="0.00000001">10⁻⁸ (Très haute qualité)</MenuItem>
                        <MenuItem value="0.000000001">10⁻⁹ (Qualité carrier-grade)</MenuItem>
                      </Select>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        Le BER définit la qualité de transmission; 10⁻⁶ est typique pour les données.
                      </Typography>
                    </FormControl>
                  );
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="bandwidthMHz"
                control={control}
                rules={{ 
                  min: { value: 0.125, message: 'La bande passante minimale est 0.125 MHz' },
                  max: { value: 100, message: 'La bande passante maximale est 100 MHz' }
                }}
                render={({ field: { onChange, onBlur, value, ...field } }) => (
                  <TextField
                    {...field}
                    value={value || '20'}
                    onChange={(e) => {
                      const val = e.target.value;
                      onChange(val === '' ? '' : Number(val));
                    }}
                    onBlur={onBlur}
                    label="Bande passante (MHz)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.bandwidthMHz}
                    helperText={errors.bandwidthMHz?.message || 'Bande passante du canal (défault : 20 MHz)'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Bande passante du canal de communication. Affecte directement le débit maximal possible avec une modulation donnée.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );
        
      case 3: // Conditions environnementales (anciennement étape 2)
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Paramètres environnementaux qui influencent la disponibilité de la liaison hertzienne.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="rainZone"
                control={control}
                rules={{ required: 'Ce champ est requis' }}
                render={({ field }) => {
                  // S'assurer que la valeur est toujours valide avant le rendu
                  const safeValue = formatSelectValue('rainZone', field.value, 'K');
                  
                  // Si la valeur a été changée, mettre à jour le champ
                  if (safeValue !== field.value) {
                    field.onChange(safeValue);
                  }
                  
                  return (
                    <FormControl fullWidth variant="outlined" error={!!errors.rainZone}>
                      <InputLabel>Zone de pluie ITU-R</InputLabel>
                      <Select {...field} value={safeValue} label="Zone de pluie ITU-R">
                        <MenuItem value="A">A (Région très sèche)</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                        <MenuItem value="C">C</MenuItem>
                        <MenuItem value="D">D</MenuItem>
                        <MenuItem value="E">E (Région modérée)</MenuItem>
                        <MenuItem value="F">F</MenuItem>
                        <MenuItem value="G">G</MenuItem>
                        <MenuItem value="H">H</MenuItem>
                        <MenuItem value="J">J</MenuItem>
                        <MenuItem value="K">K (Région tropicale modérée)</MenuItem>
                        <MenuItem value="L">L</MenuItem>
                        <MenuItem value="M">M (Région tropicale humide)</MenuItem>
                        <MenuItem value="N">N</MenuItem>
                        <MenuItem value="P">P (Région très humide)</MenuItem>
                        <MenuItem value="Q">Q</MenuItem>
                      </Select>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        Classement ITU-R des zones selon leur pluviométrie; affecte la disponibilité.
                      </Typography>
                    </FormControl>
                  );
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="terrainType"
                control={control}
                rules={{ required: 'Ce champ est requis' }}
                render={({ field }) => {
                  // S'assurer que la valeur est toujours valide avant le rendu
                  const safeValue = formatSelectValue('terrainType', field.value, 'AVERAGE');
                  
                  // Si la valeur a été changée, mettre à jour le champ
                  if (safeValue !== field.value) {
                    field.onChange(safeValue);
                  }
                  
                  return (
                    <FormControl fullWidth variant="outlined" error={!!errors.terrainType}>
                      <InputLabel>Type de terrain</InputLabel>
                      <Select {...field} value={safeValue} label="Type de terrain">
                        <MenuItem value="WATER">Eau / Mer (Terrain très dégagé)</MenuItem>
                        <MenuItem value="FLAT">Terrain plat (Dégagé)</MenuItem>
                        <MenuItem value="AVERAGE">Terrain moyen (Quelques obstacles)</MenuItem>
                        <MenuItem value="HILLY">Terrain vallons (Obstacles modérés)</MenuItem>
                        <MenuItem value="MOUNTAINOUS">Montagneux (Nombreux obstacles)</MenuItem>
                        <MenuItem value="URBAN">Urbain (Bâtiments et structures)</MenuItem>
                      </Select>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                        Le type de terrain influe sur la réflexion et la diffraction du signal.
                      </Typography>
                    </FormControl>
                  );
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="fresnelClearance"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Le dégagement minimum est 0%' },
                  max: { value: 100, message: 'Le dégagement maximum est 100%' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dégagement zone Fresnel (%)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.fresnelClearance}
                    helperText={errors.fresnelClearance?.message || 'Recommandé : > 60% pour une bonne liaison'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Pourcentage de la première zone de Fresnel dégagée. Un dégagement de 60% ou plus est recommandé pour une liaison fiable.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Controller
                name="fogDensity"
                control={control}
                rules={{ 
                  min: { value: 0, message: 'La densité minimale est 0 g/m³' },
                  max: { value: 0.5, message: 'La densité maximale est 0.5 g/m³' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Densité de brouillard (g/m³)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.fogDensity}
                    helperText={errors.fogDensity?.message || '0 = pas de brouillard, 0.05-0.5 = brouillard léger à dense'}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Densité du brouillard en g/m³. Affecte principalement les fréquences > 30 GHz. Pour des fréquences < 10 GHz, l'effet est négligeable.">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
        );
        
      case 4: // Récapitulatif (nouvelle étape)
        const formValues = watch();
        // S'assurer que toutes les valeurs sont numériques avant de les additionner
        const cableLosses = parseFloat(formValues.cableLosses || 0);
        const connectorLosses = parseFloat(formValues.connectorLosses || 0);
        const otherLosses = parseFloat(formValues.otherLosses || 0);
        const totalLosses = cableLosses + connectorLosses + otherLosses;
        
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Vérifiez les paramètres de votre liaison hertzienne avant de lancer le calcul.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Paramètres de liaison
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Fréquence :</strong> {formValues.frequency} GHz
                    </Typography>
                    <Typography variant="body2">
                      <strong>Distance :</strong> {formValues.distance} km
                    </Typography>
                    <Typography variant="body2">
                      <strong>Hauteur antenne 1 :</strong> {formValues.antennaHeight1} m
                    </Typography>
                    <Typography variant="body2">
                      <strong>Hauteur antenne 2 :</strong> {formValues.antennaHeight2} m
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Altitude site 1 :</strong> {formValues.siteElevation1} m
                    </Typography>
                    <Typography variant="body2">
                      <strong>Altitude site 2 :</strong> {formValues.siteElevation2} m
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Équipements radio
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Puissance d'émission :</strong> {formValues.transmitPower} dBm
                    </Typography>
                    <Typography variant="body2">
                      <strong>Gain antenne 1 :</strong> {formValues.antennaGain1} dBi
                    </Typography>
                    <Typography variant="body2">
                      <strong>Gain antenne 2 :</strong> {formValues.antennaGain2} dBi
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Seuil de réception :</strong> {formValues.receiverThreshold} dBm
                    </Typography>
                    <Typography variant="body2">
                      <strong>Pertes câbles :</strong> {formValues.cableLosses} dB
                    </Typography>
                    <Typography variant="body2">
                      <strong>Pertes connecteurs :</strong> {formValues.connectorLosses} dB
                    </Typography>
                    <Typography variant="body2">
                      <strong>Autres pertes :</strong> {formValues.otherLosses} dB
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                      <strong>Pertes totales :</strong> {totalLosses ? totalLosses.toFixed(2) : '0.00'} dB
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Modulation et Débit
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Type de modulation :</strong> {formValues.modulationType}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Débit cible :</strong> {formValues.dataRate} Mbps
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>BER cible :</strong> {formValues.targetBER}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Bande passante :</strong> {formValues.bandwidthMHz || 20} MHz
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Conditions environnementales
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Zone de pluie :</strong> {formValues.rainZone}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Type de terrain :</strong> {formValues.terrainType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Dégagement Fresnel :</strong> {formValues.fresnelClearance}%
                    </Typography>
                    <Typography variant="body2">
                      <strong>Densité de brouillard :</strong> {formValues.fogDensity} g/m³
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bilan de Liaison Hertzienne
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Cet outil permet de calculer le bilan de liaison pour un faisceau hertzien en évaluant la perte en espace libre,
          la marge de liaison, et la disponibilité du lien en fonction des paramètres techniques et environnementaux.
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length ? (
          // Affichage des résultats
          <Box>
            {error ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            ) : calculationResult ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Résultats du bilan de liaison
                </Typography>
                <HertzianResultsDisplay 
                  result={calculationResult}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleReset} 
                    sx={{ mr: 1 }}
                  >
                    Nouveau calcul
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<SaveIcon />}
                    color="primary"
                    onClick={handleSaveResult}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Sauvegarde...
                      </>
                    ) : 'Sauvegarder les résultats'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <CircularProgress />
            )}
          </Box>
        ) : (
          // Formulaire de saisie
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ mb: 3 }}>
              {renderStepContent(activeStep)}
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              {activeStep > 0 && (
                <Button 
                  onClick={handleBack} 
                  sx={{ mr: 1 }}
                  disabled={isCalculating}
                >
                  Précédent
                </Button>
              )}
              
              {activeStep < steps.length - 1 ? (
                <Button 
                  variant="contained" 
                  onClick={handleNext}
                >
                  Suivant
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  color="primary" 
                  type="submit"
                  startIcon={<CalculateIcon />}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Calcul en cours...
                    </>
                  ) : 'Calculer'}
                </Button>
              )}
            </Box>
          </form>
        )}
      </Paper>

      {/* Section d'aide et formules */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Formules utilisées
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" component="div">
            <ul>
              <li><strong>Perte espace libre</strong> = 32.45 + 20log(f) + 20log(d)</li>
              <li><strong>Gain système</strong> = Puissance émission + Gain antenne 1 + Gain antenne 2</li>
              <li><strong>Marge liaison</strong> = Gain système - Seuil réception - Pertes totales</li>
              <li><strong>Disponibilité</strong> = f(Marge, Fréquence, Distance, Zone de pluie)</li>
            </ul>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Où:
            </Typography>
            <Typography variant="body2">
              <ul>
                <li>f = fréquence en MHz</li>
                <li>d = distance en km</li>
              </ul>
            </Typography>
          </Typography>
        </CardContent>
      </Card>
      
      {/* Snackbar pour les notifications de succès */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        message={successMessage}
      />
    </Box>
  );
};

export default HertzianLinkCalculator;
