import React, { useState } from 'react';
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

// Step titles
const steps = ['Paramètres de liaison', 'Équipements', 'Conditions environnementales'];

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
  
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      frequency: 18, // en GHz
      distance: 10, // en km
      antennaHeight1: 30, // en m
      antennaHeight2: 30, // en m
      transmitPower: 20, // en dBm
      antennaGain1: 30, // en dBi
      antennaGain2: 30, // en dBi
      receiverThreshold: -85, // en dBm
      losses: 5, // en dB (pertes diverses)
      rainZone: 'K' // zone de pluie ITU-R
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

  const onSubmit = async (data) => {
    try {
      setIsCalculating(true);
      setError(null);
      
      // Appel API pour le calcul
      const response = await calculateHertzianLinkBudget(data);
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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
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
                    helperText={errors.frequency?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Fréquence d'opération du faisceau hertzien">
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
                    helperText={errors.distance?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Distance entre les deux sites de la liaison">
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
                name="antennaHeight1"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'La hauteur minimale est 0 m' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hauteur antenne 1 (m)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.antennaHeight1}
                    helperText={errors.antennaHeight1?.message}
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
                  min: { value: 0, message: 'La hauteur minimale est 0 m' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hauteur antenne 2 (m)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.antennaHeight2}
                    helperText={errors.antennaHeight2?.message}
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
                    helperText={errors.transmitPower?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Puissance d'émission de l'équipement radio">
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
                    helperText={errors.receiverThreshold?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Sensibilité du récepteur (valeur négative)">
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
                    helperText={errors.antennaGain1?.message}
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
                    helperText={errors.antennaGain2?.message}
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
                name="losses"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'Les pertes minimales sont 0 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Pertes diverses (dB)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.losses}
                    helperText={errors.losses?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Pertes additionnelles: connecteurs, câbles, obstacles, etc.">
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
                name="rainZone"
                control={control}
                rules={{ required: 'Ce champ est requis' }}
                render={({ field }) => (
                  <FormControl fullWidth variant="outlined" error={!!errors.rainZone}>
                    <InputLabel>Zone de pluie ITU-R</InputLabel>
                    <Select {...field} label="Zone de pluie ITU-R">
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
                    {errors.rainZone && (
                      <Typography variant="caption" color="error">
                        {errors.rainZone.message}
                      </Typography>
                    )}
                  </FormControl>
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
          Bilan de Liaison Hertzienne
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
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
                <ResultsDisplay 
                  result={calculationResult} 
                  type="HERTZIEN"
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
