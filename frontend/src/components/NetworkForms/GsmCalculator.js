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
  IconButton,
  Snackbar
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import CalculateIcon from '@mui/icons-material/Calculate';
import { 
  calculateGsmDimensioning, 
  saveProjectConfiguration, 
  updateProjectConfiguration,
  saveProjectResult,
  getProjectConfigurations
} from '../../services/api/api.service';
import ResultsDisplay from '../Results/ResultsDisplay';

// Step titles
const steps = ['Paramètres de zone', 'Paramètres de trafic', 'Paramètres radio', 'Paramètres de capacité', 'Récapitulatif'];

const GsmCalculator = () => {
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
  
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      coverageArea: 100, // en km²
      trafficPerSubscriber: 0.02, // en Erlang
      subscriberCount: 50000,
      frequency: 900, // en MHz
      btsPower: 43, // en dBm
      mobileReceptionThreshold: -102, // en dBm
      propagationModel: 'OKUMURA_HATA',
      // Paramètres de capacité
      sectors: 3, // Nombre de secteurs par BTS
      trxPerSector: 4, // Nombre de TRX par secteur
    }
  });
  
  // Charger les données d'une configuration existante si configurationId est fourni
  useEffect(() => {
    const loadExistingConfiguration = async () => {
      if (projectId && configurationId) {
        try {
          setError(null);
          const response = await getProjectConfigurations(projectId);
          
          if (response.data && response.data.data) {
            const configs = response.data.data;
            const existingConfig = configs.find(config => config.id === configurationId);
            
            if (existingConfig && existingConfig.parameters) {
              // Réinitialiser le formulaire avec les paramètres de la configuration existante
              reset(existingConfig.parameters);
              setSuccessMessage('Configuration chargée avec succès');
              setShowSnackbar(true);
            }
          }
        } catch (err) {
          console.error('Erreur lors du chargement de la configuration:', err);
          setError('Impossible de charger la configuration existante.');
        }
      }
    };
    
    loadExistingConfiguration();
  }, [projectId, configurationId, reset]);

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
      
      // Ajouter les paramètres originaux au résultat pour l'affichage
      const resultWithParams = {
        ...response.data.data,
        parameters: data  // Ajouter les paramètres originaux
      };
      
      setCalculationResult(resultWithParams);
      
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
      
      const formValues = control._formValues;
      
      // Si pas de projectId, demander à l'utilisateur de créer un projet
      if (!projectId) {
        setSuccessMessage('Pour sauvegarder les résultats, veuillez d\'abord créer un projet.');
        setShowSnackbar(true);
        // Utiliser un chemin différent pour éviter la confusion avec l'ID "new"
        setTimeout(() => {
          navigate('/projects', { 
            state: { 
              createNew: true,
              calculationType: 'GSM', 
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
      
      // Sauvegarder ou mettre à jour la configuration
      let configId = configurationId;
      const configData = {
        name: `Configuration GSM ${new Date().toLocaleDateString()}`,
        parameters: formValues,
        projectId: projectId
      };
      
      let configResponse;
      
      if (configId) {
        // Mettre à jour une configuration existante
        configResponse = await updateProjectConfiguration(projectId, configId, configData);
        console.log('Réponse de mise à jour de configuration:', configResponse);
      } else {
        // Créer une nouvelle configuration
        configResponse = await saveProjectConfiguration(projectId, configData);
        console.log('Réponse de création de configuration:', configResponse);
      }
      
      // Extraire l'ID de la bonne structure de réponse (configResponse.data.data.id)
      if (configResponse?.data?.data?.id) {
        configId = configResponse.data.data.id;
      } else if (configResponse?.data?.id) {
        configId = configResponse.data.id;
      } else {
        throw new Error('Impossible de récupérer l\'ID de configuration');
      }
      
      // Sauvegarder les résultats
      const resultData = {
        name: `Résultat GSM ${new Date().toLocaleDateString()}`,
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
                        <Tooltip title="Surface totale à couvrir par le réseau GSM (Min: 0.1 km² - Max: recommandé < 10000 km²)">
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
                        <Tooltip title="Trafic moyen généré par un utilisateur en heure chargée (Min: 0.001 Erlang - Max: 0.2 Erlang)">
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
                        <Tooltip title="Nombre total d'utilisateurs à desservir (Min: 1 - Max: recommandé < 1 000 000)">
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
                        <Tooltip title="Fréquence d'opération du réseau GSM (Min: 800 MHz - Max: 2100 MHz, typiquement 900 MHz ou 1800 MHz)">
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
                        <Tooltip title="Puissance d'émission de la station de base (Min: 20 dBm - Max: 60 dBm, typiquement 43 dBm / 20W)">
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
                        <Tooltip title="Sensibilité du récepteur mobile (Min: -120 dBm - Max: -70 dBm, typiquement -102 dBm)">
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
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="sectors"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 1, message: 'Minimum 1 secteur' },
                  max: { value: 6, message: 'Maximum 6 secteurs' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre de secteurs par BTS"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.sectors}
                    helperText={errors.sectors?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Nombre de secteurs par BTS (Min: 1 - Max: 6, 1 pour omnidirectionnelle, 3 pour sectorisation standard)">
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
                name="trxPerSector"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 1, message: 'Minimum 1 TRX par secteur' },
                  max: { value: 12, message: 'Maximum 12 TRX par secteur' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="TRX par secteur"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.trxPerSector}
                    helperText={errors.trxPerSector?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Nombre d'émetteurs-récepteurs par secteur (Min: 1 - Max: 12, chaque TRX ajoute 8 canaux)">
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
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Ces paramètres influencent directement la capacité de trafic par BTS.<br />
                  Capacité par BTS = Secteurs × TRX par secteur × 8 canaux × 0.9 Erlang/canal
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
      case 4: // Étape de récapitulatif
        const formValues = control._formValues;
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Récapitulatif des paramètres
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Vérifiez vos paramètres avant de lancer le calcul. Vous pouvez revenir en arrière pour effectuer des modifications si nécessaire.
                </Typography>
              </Alert>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres de zone
                </Typography>
                <Typography variant="body2">
                  Zone de couverture: {formValues.coverageArea} km²
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres de trafic
                </Typography>
                <Typography variant="body2">
                  Trafic par abonné: {formValues.trafficPerSubscriber} Erlang
                </Typography>
                <Typography variant="body2">
                  Nombre d'abonnés: {formValues.subscriberCount}
                </Typography>
                <Typography variant="body2">
                  Trafic total estimé: {(formValues.trafficPerSubscriber * formValues.subscriberCount).toFixed(2)} Erlang
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres radio
                </Typography>
                <Typography variant="body2">
                  Fréquence: {formValues.frequency} MHz
                </Typography>
                <Typography variant="body2">
                  Puissance BTS: {formValues.btsPower} dBm
                </Typography>
                <Typography variant="body2">
                  Seuil de réception: {formValues.mobileReceptionThreshold} dBm
                </Typography>
                <Typography variant="body2">
                  Modèle de propagation: {formValues.propagationModel === 'OKUMURA_HATA' ? 'Okumura-Hata' : 'COST-231'}
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres de capacité
                </Typography>
                <Typography variant="body2">
                  Nombre de secteurs par BTS: {formValues.sectors}
                </Typography>
                <Typography variant="body2">
                  TRX par secteur: {formValues.trxPerSector}
                </Typography>
                <Typography variant="body2">
                  Capacité estimée par BTS: {(formValues.sectors * formValues.trxPerSector * 8 * 0.9).toFixed(2)} Erlang
                </Typography>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Button 
                  variant="outlined"
                  onClick={handleBack} 
                  disabled={activeStep === 0}
                >
                  Retour
                </Button>
              </Box>
              
              <Box>
                {/* Afficher le bouton Annuler si l'utilisateur est à une étape intermédiaire */}
                {activeStep > 0 && activeStep < steps.length - 1 && (
                  <Button
                    onClick={handleReset}
                    sx={{ mr: 1 }}
                    color="inherit"
                  >
                    Annuler
                  </Button>
                )}
                
                {/* Bouton Suivant ou Calculer selon l'étape */}
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isCalculating}
                  >
                    {isCalculating ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        Calcul en cours...
                      </>
                    ) : 'Calculer et Afficher les Résultats'}
                  </Button>
                )}
              </Box>
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
            <Typography variant="body2" sx={{ mb: 2 }}>
              où f est la fréquence (MHz), hb la hauteur d'antenne BTS (m), hm la hauteur d'antenne mobile (m), et d la distance (km).
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Modèle COST-231 (extension de Hata pour fréquences 1500-2000 MHz) :
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', my: 1 }}>
              L = 46.3 + 33.9log(f) - 13.82log(hb) - a(hm) + [44.9 - 6.55log(hb)]log(d) + C
            </Typography>
            <Typography variant="body2">
              où C = 0 pour villes moyennes et zones suburbaines, C = 3 pour zones métropolitaines.
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

export default GsmCalculator;
