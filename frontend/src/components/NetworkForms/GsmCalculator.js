import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import CalculateIcon from '@mui/icons-material/Calculate';
import { calculateGsmDimensioning } from '../../services/api/api.service';
import ResultsDisplay from '../Results/ResultsDisplay';

// Step titles
const steps = ['Paramètres de zone', 'Paramètres de trafic', 'Paramètres radio'];

const GsmCalculator = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [error, setError] = useState(null);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      coverageArea: 100, // en km²
      trafficPerSubscriber: 0.02, // en Erlang
      subscriberCount: 50000,
      frequency: 900, // en MHz
      btsPower: 43, // en dBm
      mobileReceptionThreshold: -102, // en dBm
      propagationModel: 'OKUMURA_HATA',
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
      const response = await calculateGsmDimensioning(data);
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
            <Grid item xs={12}>
              <Controller
                name="coverageArea"
                control={control}
                rules={{ required: 'Ce champ est requis', min: { value: 0.1, message: 'La zone doit être supérieure à 0.1 km²' } }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Zone de couverture (km²)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.coverageArea}
                    helperText={errors.coverageArea?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Surface totale à couvrir par le réseau GSM">
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
                name="trafficPerSubscriber"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 0.001, message: 'La valeur minimale est 0.001 Erlang' },
                  max: { value: 0.2, message: 'La valeur maximale est 0.2 Erlang' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Trafic par abonné (Erlang)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.trafficPerSubscriber}
                    helperText={errors.trafficPerSubscriber?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Trafic moyen généré par un utilisateur en heure chargée">
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
                name="subscriberCount"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 1, message: 'Le nombre d\'abonnés doit être au moins 1' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre d'abonnés"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.subscriberCount}
                    helperText={errors.subscriberCount?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Nombre total d'utilisateurs à desservir">
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
                name="frequency"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 800, message: 'La fréquence minimale est 800 MHz' },
                  max: { value: 2100, message: 'La fréquence maximale est 2100 MHz' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fréquence (MHz)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.frequency}
                    helperText={errors.frequency?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Fréquence d'opération du réseau GSM (900 MHz ou 1800 MHz typiquement)">
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
                name="btsPower"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 20, message: 'La puissance minimale est 20 dBm' },
                  max: { value: 60, message: 'La puissance maximale est 60 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Puissance émission BTS (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.btsPower}
                    helperText={errors.btsPower?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Puissance d'émission de la station de base">
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
                name="mobileReceptionThreshold"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  max: { value: -70, message: 'La sensibilité doit être inférieure à -70 dBm' },
                  min: { value: -120, message: 'La sensibilité doit être supérieure à -120 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Seuil de réception mobile (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.mobileReceptionThreshold}
                    helperText={errors.mobileReceptionThreshold?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Sensibilité du récepteur mobile (valeur négative)">
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
              <FormControl component="fieldset">
                <FormLabel component="legend">Modèle de propagation</FormLabel>
                <Controller
                  name="propagationModel"
                  control={control}
                  rules={{ required: 'Veuillez sélectionner un modèle' }}
                  render={({ field }) => (
                    <RadioGroup {...field} row>
                      <FormControlLabel 
                        value="OKUMURA_HATA" 
                        control={<Radio />} 
                        label={
                          <Tooltip title="Recommandé pour les zones urbaines et suburbaines">
                            <span>Okumura-Hata</span>
                          </Tooltip>
                        } 
                      />
                      <FormControlLabel 
                        value="COST231" 
                        control={<Radio />} 
                        label={
                          <Tooltip title="Recommandé pour les fréquences plus élevées (1500-2000 MHz)">
                            <span>COST-231</span>
                          </Tooltip>
                        } 
                      />
                    </RadioGroup>
                  )}
                />
                {errors.propagationModel && (
                  <Typography variant="caption" color="error">
                    {errors.propagationModel.message}
                  </Typography>
                )}
              </FormControl>
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
          Dimensionnement de Réseau GSM
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Cet outil permet de calculer le nombre de BTS nécessaires, le rayon de cellule, et la capacité trafic
          pour dimensionner un réseau GSM en fonction des paramètres de zone, trafic et radio.
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
                  Résultats du dimensionnement
                </Typography>
                <ResultsDisplay 
                  result={calculationResult} 
                  type="GSM"
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
                  >
                    Sauvegarder les résultats
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
              <li><strong>Nombre de BTS</strong> = Surface / (3√3 × R²/2)</li>
              <li><strong>Capacité trafic</strong> = Nombre de canaux × Taux d'occupation</li>
              <li><strong>Rayon cellule</strong> = √(Puissance émission / (Seuil réception × Perte propagation))</li>
            </ul>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Modèle Okumura-Hata (zone urbaine) :
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', my: 1 }}>
              L = 69.55 + 26.16log(f) - 13.82log(hb) - a(hm) + [44.9 - 6.55log(hb)]log(d)
            </Typography>
            <Typography variant="body2">
              où f est la fréquence (MHz), hb la hauteur d'antenne BTS (m), hm la hauteur d'antenne mobile (m), et d la distance (km).
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GsmCalculator;
