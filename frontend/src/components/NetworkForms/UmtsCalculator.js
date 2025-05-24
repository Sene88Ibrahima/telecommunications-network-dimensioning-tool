import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CalculateIcon from '@mui/icons-material/Calculate';
import { 
  calculateUmtsDimensioning, 
  saveProjectConfiguration, 
  saveProjectResult 
} from '../../services/api/api.service';
import ResultsDisplay from '../Results/ResultsDisplay';

// Step titles
const steps = ['Services', 'Paramètres radio', 'Paramètres de propagation'];

const UmtsCalculator = () => {
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
      services: [
        { type: 'VOICE', bitRate: 12.2, activityFactor: 0.5 }
      ],
      ebno: 6.0,
      softHandoverMargin: 3.0,
      propagationParameters: {
        frequency: 2100,
        transmitPower: 43,
        sensitivity: -120,
        margin: 8,
        baseStationHeight: 30,
        mobileHeight: 1.5,
        environmentType: 'URBAN'
      }
    }
  });

  // Field array for dynamic services list
  const { fields, append, remove } = useFieldArray({
    control,
    name: "services"
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

  const addService = () => {
    append({ type: 'DATA', bitRate: 64, activityFactor: 0.3 });
  };

  const onSubmit = async (data) => {
    try {
      setIsCalculating(true);
      setError(null);
      
      // Appel API pour le calcul
      const response = await calculateUmtsDimensioning(data);
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
              calculationType: 'UMTS', 
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
          name: `Configuration UMTS ${new Date().toLocaleDateString()}`,
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
        name: `Résultat UMTS ${new Date().toLocaleDateString()}`,
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
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Services UMTS
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Définissez les différents services (voix, données, vidéo) pris en charge par le réseau UMTS.
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type de service</TableCell>
                    <TableCell>Débit (kbps)</TableCell>
                    <TableCell>Facteur d'activité</TableCell>
                    <TableCell width="80px">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Controller
                          name={`services.${index}.type`}
                          control={control}
                          rules={{ required: 'Requis' }}
                          render={({ field }) => (
                            <FormControl fullWidth size="small" error={!!errors.services?.[index]?.type}>
                              <Select {...field}>
                                <MenuItem value="VOICE">Voix</MenuItem>
                                <MenuItem value="DATA">Données</MenuItem>
                                <MenuItem value="VIDEO">Vidéo</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`services.${index}.bitRate`}
                          control={control}
                          rules={{ 
                            required: 'Requis',
                            min: { value: 0.1, message: 'Min 0.1' }
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              size="small"
                              fullWidth
                              error={!!errors.services?.[index]?.bitRate}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`services.${index}.activityFactor`}
                          control={control}
                          rules={{ 
                            required: 'Requis',
                            min: { value: 0, message: 'Min 0' },
                            max: { value: 1, message: 'Max 1' }
                          }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="number"
                              size="small"
                              fullWidth
                              inputProps={{ step: 0.1, min: 0, max: 1 }}
                              error={!!errors.services?.[index]?.activityFactor}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <IconButton 
                            size="small" 
                            onClick={() => remove(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addService}
                size="small"
              >
                Ajouter un service
              </Button>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="ebno"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 0, message: 'La valeur minimale est 0 dB' },
                  max: { value: 20, message: 'La valeur maximale est 20 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Eb/N0 cible (dB)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.ebno}
                    helperText={errors.ebno?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Rapport signal/bruit par bit cible pour assurer la qualité de communication">
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
                name="softHandoverMargin"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 0, message: 'La valeur minimale est 0 dB' },
                  max: { value: 10, message: 'La valeur maximale est 10 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Marge de soft handover (dB)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.softHandoverMargin}
                    helperText={errors.softHandoverMargin?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Marge allouée au soft handover qui permet une transition en douceur entre cellules">
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
                name="propagationParameters.frequency"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 1500, message: 'La fréquence minimale est 1500 MHz' },
                  max: { value: 2200, message: 'La fréquence maximale est 2200 MHz' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Fréquence (MHz)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.propagationParameters?.frequency}
                    helperText={errors.propagationParameters?.frequency?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Fréquence d'opération du réseau UMTS (généralement 2100 MHz)">
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
                name="propagationParameters.transmitPower"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 20, message: 'La puissance minimale est 20 dBm' },
                  max: { value: 60, message: 'La puissance maximale est 60 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Puissance d'émission (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.propagationParameters?.transmitPower}
                    helperText={errors.propagationParameters?.transmitPower?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Puissance d'émission de la station de base (NodeB)">
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
                name="propagationParameters.sensitivity"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  max: { value: -70, message: 'La sensibilité doit être inférieure à -70 dBm' },
                  min: { value: -130, message: 'La sensibilité doit être supérieure à -130 dBm' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sensibilité du récepteur (dBm)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.propagationParameters?.sensitivity}
                    helperText={errors.propagationParameters?.sensitivity?.message}
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
                name="propagationParameters.margin"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 0, message: 'La marge doit être positive' },
                  max: { value: 20, message: 'La marge maximum est 20 dB' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Marge de liaison (dB)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.propagationParameters?.margin}
                    helperText={errors.propagationParameters?.margin?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Marge supplémentaire pour compenser les variations de signal">
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
                name="propagationParameters.environmentType"
                control={control}
                rules={{ required: 'Ce champ est requis' }}
                render={({ field }) => (
                  <FormControl fullWidth variant="outlined" error={!!errors.propagationParameters?.environmentType}>
                    <InputLabel>Type d'environnement</InputLabel>
                    <Select {...field} label="Type d'environnement">
                      <MenuItem value="URBAN">Urbain</MenuItem>
                      <MenuItem value="SUBURBAN">Suburbain</MenuItem>
                      <MenuItem value="RURAL">Rural</MenuItem>
                      <MenuItem value="METROPOLITAN">Métropolitain</MenuItem>
                    </Select>
                    {errors.propagationParameters?.environmentType && (
                      <Typography variant="caption" color="error">
                        {errors.propagationParameters.environmentType.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="propagationParameters.baseStationHeight"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis',
                  min: { value: 10, message: 'La hauteur minimale est 10m' },
                  max: { value: 100, message: 'La hauteur maximale est 100m' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hauteur antenne NodeB (m)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.propagationParameters?.baseStationHeight}
                    helperText={errors.propagationParameters?.baseStationHeight?.message}
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
          Dimensionnement de Réseau UMTS
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Cet outil permet de calculer les paramètres de dimensionnement pour un réseau UMTS (3G)
          en fonction des services souhaités, des paramètres radio et de l'environnement.
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
                  type="UMTS"
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
              <li><strong>Capacité utilisateurs</strong> = (Eb/N0)⁻¹ × Facteur charge</li>
              <li><strong>Couverture</strong> = f(Puissance, Sensibilité, Marge)</li>
              <li><strong>Gain de traitement</strong> = Chip rate (3.84 Mcps) / Débit service</li>
            </ul>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Facteur de charge uplink :
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', my: 1 }}>
              η = (1 + i) * (Eb/No) * v / Gp
            </Typography>
            <Typography variant="body2">
              où i est le facteur d'interférence, v le facteur d'activité, et Gp le gain de traitement.
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

export default UmtsCalculator;
