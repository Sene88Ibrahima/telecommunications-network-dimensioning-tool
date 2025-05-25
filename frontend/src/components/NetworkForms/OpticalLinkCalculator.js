import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
  calculateOpticalLinkBudget,
  saveProjectConfiguration,
  saveProjectResult 
} from '../../services/api/api.service';
import OpticalResultsDisplay from '../Results/OpticalResultsDisplay';

// Step titles
const steps = ['Type de fibre', 'Paramètres de transmission', 'Connexions', 'Paramètres avancés', 'Récapitulatif'];

const OpticalLinkCalculator = () => {
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
  
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      fiberType: 'MONOMODE',
      linkLength: 10, // en km
      wavelength: 1310, // en nm
      transmitterPower: 0, // en dBm
      receiverSensitivity: -28, // en dBm
      connectorCount: 2,
      spliceCount: 4,
      bitRate: 1, // en Gbps
      connectorLoss: 0.5, // en dB par connecteur
      spliceLoss: 0.1, // en dB par épissure
      safetyMargin: 3, // en dB
      spectralWidth: 1 // en nm (largeur spectrale de la source)
    }
  });

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

  // Fonction pour sauvegarder les résultats
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
              calculationType: 'OPTICAL', 
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
          name: `Configuration Optique ${new Date().toLocaleDateString()}`,
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
        name: `Résultat Optique ${new Date().toLocaleDateString()}`,
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
      
      // Rediriger vers le projet après quelques secondes
      setTimeout(() => {
        // S'assurer que l'ID est valide avant de naviguer
        if (projectId && projectId !== 'new' && projectId !== '') {
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
  
  const onSubmit = async (data) => {
    try {
      setIsCalculating(true);
      setError(null);
      
      // Appel API pour le calcul
      const response = await calculateOpticalLinkBudget(data);
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="fiberType"
                control={control}
                rules={{ required: 'Ce champ est requis' }}
                render={({ field }) => (
                  <FormControl fullWidth variant="outlined" error={!!errors.fiberType}>
                    <InputLabel>Type de fibre</InputLabel>
                    <Select {...field} label="Type de fibre">
                      <MenuItem value="MONOMODE">Monomode (SMF)</MenuItem>
                      <MenuItem value="MULTIMODE">Multimode (MMF)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="wavelength"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 800, message: 'Longueur d\'onde minimale 800 nm' },
                  max: { value: 1600, message: 'Longueur d\'onde maximale 1600 nm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Longueur d'onde (nm) - [800-1600]"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.wavelength}
                    helperText={errors.wavelength?.message || "Valeurs typiques: 850, 1310, 1550 nm"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Longueur d'onde en nanomètres (850, 1310, 1550 nm typiques)">
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
            <Grid item xs={12}>
              <Controller
                name="linkLength"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0.1, message: 'Longueur minimale 0.1 km' },
                  max: { value: 100, message: 'Longueur maximale 100 km' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Longueur de la liaison (km) - [0.1-100]"
                    type="number"
                    inputProps={{ step: 0.1, min: 0.1, max: 100 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.linkLength}
                    helperText={errors.linkLength?.message || "Entrez une valeur entre 0.1 et 100 km"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Distance totale de la liaison en kilomètres">
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
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="transmitterPower"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: -10, message: 'Puissance minimale -10 dBm' },
                  max: { value: 20, message: 'Puissance maximale 20 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Puissance émetteur (dBm) - [-10 à 20]"
                    type="number"
                    inputProps={{ step: 1, min: -10, max: 20 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.transmitterPower}
                    helperText={errors.transmitterPower?.message || "Valeurs typiques: 0 à 10 dBm"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Puissance du transmetteur optique en dBm">
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
                name="receiverSensitivity"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  max: { value: -5, message: 'Sensibilité maximale -5 dBm' },
                  min: { value: -40, message: 'Sensibilité minimale -40 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sensibilité récepteur (dBm) - [-40 à -5]"
                    type="number"
                    inputProps={{ step: 1, min: -40, max: -5 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.receiverSensitivity}
                    helperText={errors.receiverSensitivity?.message || "Valeurs typiques: -25 à -35 dBm"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Puissance minimale requise au récepteur (valeur négative)">
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
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="connectorCount"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Nombre minimum 0' },
                  max: { value: 20, message: 'Nombre maximum 20' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre de connecteurs - [0-20]"
                    type="number"
                    inputProps={{ step: 1, min: 0, max: 20 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.connectorCount}
                    helperText={errors.connectorCount?.message || "Min: 0, Max: 20"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Nombre total de connecteurs sur la liaison">
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
                name="spliceCount"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Nombre minimum 0' },
                  max: { value: 50, message: 'Nombre maximum 50' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre d'épissures - [0-50]"
                    type="number"
                    inputProps={{ step: 1, min: 0, max: 50 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.spliceCount}
                    helperText={errors.spliceCount?.message || "Min: 0, Max: 50"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Nombre total d'épissures sur la liaison">
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

      case 3: // Paramètres avancés
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="bitRate"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0.1, message: 'Débit minimum 0.1 Gbps' },
                  max: { value: 100, message: 'Débit maximum 100 Gbps' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Débit (Gbps) - [0.1-100]"
                    type="number"
                    inputProps={{ step: 0.1, min: 0.1, max: 100 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.bitRate}
                    helperText={errors.bitRate?.message || "Valeurs typiques: 1 à 40 Gbps"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Débit de données en Gigabits par seconde">
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
                name="spectralWidth"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0.1, message: 'Minimum 0.1 nm' },
                  max: { value: 10, message: 'Maximum 10 nm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Largeur spectrale (nm) - [0.1-10]"
                    type="number"
                    inputProps={{ step: 0.1, min: 0.1, max: 10 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.spectralWidth}
                    helperText={errors.spectralWidth?.message || "Valeurs typiques: 0.1 à 2 nm"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Largeur spectrale de la source optique en nanomètres">
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
                name="connectorLoss"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0.1, message: 'Minimum 0.1 dB' },
                  max: { value: 2, message: 'Maximum 2 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Perte par connecteur (dB) - [0.1-2]"
                    type="number"
                    inputProps={{ step: 0.1, min: 0.1, max: 2 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.connectorLoss}
                    helperText={errors.connectorLoss?.message || "Monomode: 0.5 dB, Multimode: 1.0 dB"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Perte par connecteur en dB (typique: 0.5 dB pour monomode, 1.0 dB pour multimode)">
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
                name="spliceLoss"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0.01, message: 'Minimum 0.01 dB' },
                  max: { value: 1, message: 'Maximum 1 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Perte par épissure (dB) - [0.01-1]"
                    type="number"
                    inputProps={{ step: 0.01, min: 0.01, max: 1 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.spliceLoss}
                    helperText={errors.spliceLoss?.message || "Monomode: 0.1 dB, Multimode: 0.3 dB"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Perte par épissure en dB (typique: 0.1 dB pour monomode, 0.3 dB pour multimode)">
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
                name="safetyMargin"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Minimum 0 dB' },
                  max: { value: 10, message: 'Maximum 10 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Marge de sécurité (dB) - [0-10]"
                    type="number"
                    inputProps={{ step: 0.5, min: 0, max: 10 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.safetyMargin}
                    helperText={errors.safetyMargin?.message || "Valeur typique: 3 dB"}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Marge de sécurité pour tenir compte du vieillissement et des incertitudes (typique: 3 dB)">
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
      case 4: // Récapitulatif
        const formValues = watch();
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Récapitulatif des paramètres
            </Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Type de fibre et distance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Type de fibre
                    </Typography>
                    <Typography variant="body1">
                      {formValues.fiberType === 'MONOMODE' ? 'Monomode (SMF)' : 'Multimode (MMF)'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Longueur d'onde
                    </Typography>
                    <Typography variant="body1">
                      {formValues.wavelength} nm
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Longueur de liaison
                    </Typography>
                    <Typography variant="body1">
                      {formValues.linkLength} km
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres de transmission
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Puissance d'émission
                    </Typography>
                    <Typography variant="body1">
                      {formValues.transmitterPower} dBm
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sensibilité récepteur
                    </Typography>
                    <Typography variant="body1">
                      {formValues.receiverSensitivity} dBm
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Connexions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Nombre de connecteurs
                    </Typography>
                    <Typography variant="body1">
                      {formValues.connectorCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Nombre d'épissures
                    </Typography>
                    <Typography variant="body1">
                      {formValues.spliceCount}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres avancés
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Débit
                    </Typography>
                    <Typography variant="body1">
                      {formValues.bitRate} Gbps
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Largeur spectrale
                    </Typography>
                    <Typography variant="body1">
                      {formValues.spectralWidth} nm
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Perte par connecteur
                    </Typography>
                    <Typography variant="body1">
                      {formValues.connectorLoss} dB
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Perte par épissure
                    </Typography>
                    <Typography variant="body1">
                      {formValues.spliceLoss} dB
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Marge de sécurité
                    </Typography>
                    <Typography variant="body1">
                      {formValues.safetyMargin} dB
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Bilan de Liaison Optique
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Cet outil permet de calculer le bilan de liaison optique en évaluant le budget optique disponible, 
            les pertes totales, la marge système, et la portée maximale en fonction des paramètres de fibre et d'équipements.
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
                <OpticalResultsDisplay 
                  result={calculationResult}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setActiveStep(steps.length - 1)} 
                    startIcon={<ArrowBackIcon />}
                  >
                    Retour aux paramètres
                  </Button>
                  <Box>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {activeStep > 0 && (
                <Button 
                  onClick={handleBack} 
                  sx={{ mr: 1 }}
                  disabled={isCalculating}
                  startIcon={<ArrowBackIcon />}
                >
                  Précédent
                </Button>
              )}
              
              <Box sx={{ marginLeft: 'auto' }}>
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
            </Box>
          </form>
        )}
        </Paper>

        {/* Section d'aide et formules */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Formules utilisées
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" component="div">
              <ul>
                <li><strong>Budget optique</strong> = Puissance émission - Sensibilité récepteur</li>
                <li><strong>Pertes fibre</strong> = Atténuation linéique × Longueur</li>
                <li><strong>Pertes connexions</strong> = (Nombre connecteurs × Perte par connecteur) + (Nombre épissures × Perte par épissure)</li>
                <li><strong>Pertes totales</strong> = Pertes fibre + Pertes connexions + Marge sécurité</li>
                <li><strong>Portée max</strong> = Budget optique / (Atténuation linéique + Pertes connexions)</li>
              </ul>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Atténuation typique:
              </Typography>
              <Typography variant="body2">
                <ul>
                  <li>Fibre monomode (1310nm): 0.35 dB/km</li>
                  <li>Fibre monomode (1550nm): 0.25 dB/km</li>
                  <li>Fibre multimode (850nm): 3.0 dB/km</li>
                  <li>Connecteurs monomode: 0.5 dB/connecteur</li>
                  <li>Épissures monomode: 0.1 dB/épissure</li>
                </ul>
              </Typography>
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Plages de valeurs recommandées:
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <ul>
                    <li><strong>Longueur d'onde</strong>: 800-1600 nm</li>
                    <li><strong>Longueur de liaison</strong>: 0.1-100 km</li>
                    <li><strong>Puissance d'émission</strong>: -10 à 20 dBm</li>
                    <li><strong>Sensibilité récepteur</strong>: -40 à -5 dBm</li>
                  </ul>
                </Grid>
                <Grid item xs={12} md={6}>
                  <ul>
                    <li><strong>Débit</strong>: 0.1-100 Gbps</li>
                    <li><strong>Perte par connecteur</strong>: 0.1-2 dB</li>
                    <li><strong>Perte par épissure</strong>: 0.01-1 dB</li>
                    <li><strong>Marge de sécurité</strong>: 0-10 dB</li>
                  </ul>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
        
        {/* Snackbar pour les messages de succès */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={6000}
          onClose={() => setShowSnackbar(false)}
          message={successMessage}
        />
      </Box>

    </Box>
  );
};

export default OpticalLinkCalculator;
