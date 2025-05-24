import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
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
  calculateOpticalLinkBudget,
  saveProjectConfiguration,
  saveProjectResult 
} from '../../services/api/api.service';
import ResultsDisplay from '../Results/ResultsDisplay';

// Step titles
const steps = ['Type de fibre', 'Paramètres de transmission', 'Connexions'];

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
  
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      fiberType: 'MONOMODE',
      linkLength: 10, // en km
      wavelength: 1310, // en nm
      transmitterPower: 0, // en dBm
      receiverSensitivity: -28, // en dBm
      connectorCount: 2,
      spliceCount: 4
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
                    label="Longueur d'onde (nm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.wavelength}
                    helperText={errors.wavelength?.message}
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
                    label="Longueur de la liaison (km)"
                    type="number"
                    inputProps={{ step: 0.1 }}
                    fullWidth
                    variant="outlined"
                    error={!!errors.linkLength}
                    helperText={errors.linkLength?.message}
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
                    label="Puissance émetteur (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.transmitterPower}
                    helperText={errors.transmitterPower?.message}
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
                    label="Sensibilité récepteur (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.receiverSensitivity}
                    helperText={errors.receiverSensitivity?.message}
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
                    label="Nombre de connecteurs"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.connectorCount}
                    helperText={errors.connectorCount?.message}
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
                    label="Nombre d'épissures"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.spliceCount}
                    helperText={errors.spliceCount?.message}
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
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
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
                <ResultsDisplay 
                  result={calculationResult} 
                  type="OPTIQUE"
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
  );
};

export default OpticalLinkCalculator;
