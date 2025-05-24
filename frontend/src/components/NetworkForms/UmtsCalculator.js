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
  Snackbar,
  InputAdornment
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
import UmtsResultsDisplay from '../Results/UmtsResultsDisplay';

// Step titles
const steps = ['Zone et trafic', 'Services', 'Paramètres radio', 'Paramètres de propagation', 'Récapitulatif'];

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
      // Nouveaux paramètres de zone et trafic
      coverageArea: 100, // en km²
      subscriberCount: 50000,
      growthFactor: 20, // pourcentage d'augmentation prévue
      subscriberDensity: 500, // abonnés par km²

      // Paramètres de capacité spécifiques UMTS
      carriers: 1, // nombre de porteuses par cellule
      sectors: 3, // nombre de secteurs par site

      // Paramètres de services existants
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
      
      // Assurer que les données ont la structure attendue
      const formattedData = {
        ...data,
        // S'assurer que propagationParameters existe et contient toutes les valeurs
        propagationParameters: {
          frequency: data.propagationParameters?.frequency || 2100,
          transmitPower: data.propagationParameters?.transmitPower || 43,
          sensitivity: data.propagationParameters?.sensitivity || -120,
          margin: data.propagationParameters?.margin || 8,
          baseStationHeight: data.propagationParameters?.baseStationHeight || 30,
          mobileHeight: data.propagationParameters?.mobileHeight || 1.5,
          environmentType: data.propagationParameters?.environmentType || 'URBAN'
        }
      };
      
      // Appel API pour le calcul
      const response = await calculateUmtsDimensioning(formattedData);
      
      // Formater les résultats pour éviter les NaN et autres valeurs problématiques
      const sanitizeValue = (value, defaultValue = 0) => {
        return (value !== undefined && value !== null && !isNaN(value)) ? value : defaultValue;
      };
      
      // S'assurer que les structures pour les capacités existent
      const uplinkCapacity = response.data.data.uplinkCapacity || {};
      const downlinkCapacity = response.data.data.downlinkCapacity || {};
      
      // Nettoyer les valeurs problématiques
      const sanitizedResults = {
        ...response.data.data,
        nodeCount: sanitizeValue(response.data.data.nodeCount),
        cellRadius: sanitizeValue(response.data.data.cellRadius),
        uplinkCapacity: {
          ...uplinkCapacity,
          maxUsers: sanitizeValue(uplinkCapacity.maxUsers),
          loadFactor: sanitizeValue(uplinkCapacity.loadFactor),
          averageBitRate: sanitizeValue(uplinkCapacity.averageBitRate)
        },
        downlinkCapacity: {
          ...downlinkCapacity,
          maxUsers: sanitizeValue(downlinkCapacity.maxUsers),
          loadFactor: sanitizeValue(downlinkCapacity.loadFactor),
          averageBitRate: sanitizeValue(downlinkCapacity.averageBitRate)
        }
      };
      
      // Préparer les résultats pour l'affichage, en s'assurant que tous les paramètres sont inclus
      const resultWithParams = {
        ...sanitizedResults,
        parameters: formattedData,  // Utiliser les données formatées
        // Ajouter les données importantes directement au niveau racine pour faciliter l'accès
        coverageArea: formattedData.coverageArea,
        subscriberCount: formattedData.subscriberCount,
        nodeCount: sanitizedResults.nodeCount,
        cellRadius: sanitizedResults.cellRadius,
        propagationModel: formattedData.propagationParameters.environmentType
      };
      
      console.log('Sanitized UMTS results:', sanitizedResults);
      
      console.log('UMTS result with parameters:', resultWithParams);
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
      
      // Rediriger vers la page de résultat UMTS spécifique après quelques secondes
      setTimeout(() => {
        // Si nous avons un ID de résultat valide, rediriger vers la page de résultat UMTS
        if (resultId) {
          navigate(`/results/umts/${resultId}`, { replace: true });
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
    console.log('Rendering step:', step); // Debug pour voir quelle étape est affichée
    switch (step) {
      case 0: // Zone et trafic
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Controller
                name="coverageArea"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 0.1, message: 'La zone doit être supérieure à 0.1 km²' } 
                }}
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
                        <Tooltip title="Surface totale à couvrir par le réseau UMTS (Min: 0.1 km² - Max: recommandé < 5000 km²)">
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
            
            <Grid item xs={12} md={6}>
              <Controller
                name="growthFactor"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 0, message: 'Le facteur de croissance ne peut pas être négatif' },
                  max: { value: 100, message: 'Le facteur de croissance ne peut pas dépasser 100%' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Facteur de croissance (%)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.growthFactor}
                    helperText={errors.growthFactor?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Prévision de croissance du nombre d'abonnés en pourcentage (Min: 0% - Max: 100%)">
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
                name="carriers"
                control={control}
                rules={{ 
                  required: 'Ce champ est requis', 
                  min: { value: 1, message: 'Minimum 1 porteuse' },
                  max: { value: 3, message: 'Maximum 3 porteuses' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre de porteuses"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.carriers}
                    helperText={errors.carriers?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Nombre de porteuses de 5 MHz par secteur (Min: 1 - Max: 3)">
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
                    label="Nombre de secteurs par site"
                    type="number"
                    fullWidth
                    variant="outlined"
                    error={!!errors.sectors}
                    helperText={errors.sectors?.message}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Nombre de secteurs par NodeB (Min: 1 - Max: 6, typiquement 3)">
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
                  Le facteur de croissance permet de dimensionner le réseau pour les besoins futurs.<br />
                  Le nombre de porteuses et de secteurs influence directement la capacité de la cellule UMTS.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        );
        
      case 1: // Services
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
                              <Tooltip title="Type de service UMTS (Voix: 12.2 kbps, Données: variable, Vidéo: haute qualité)">
                                <Select {...field}>
                                  <MenuItem value="VOICE">Voix</MenuItem>
                                  <MenuItem value="DATA">Données</MenuItem>
                                  <MenuItem value="VIDEO">Vidéo</MenuItem>
                                </Select>
                              </Tooltip>
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
                              InputProps={{
                                endAdornment: (
                                  <Tooltip title="Débit du service en kbps (Min: 12.2 pour voix, Max: 384 pour données/vidéo recommandé)">
                                    <IconButton size="small">
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )
                              }}
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
                              InputProps={{
                                endAdornment: (
                                  <Tooltip title="Facteur d'activité du service (Min: 0, Max: 1, Voix: ~0.4, Données: ~0.3, Vidéo: ~0.7)">
                                    <IconButton size="small">
                                      <InfoIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )
                              }}
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
                        <Tooltip title="Rapport signal/bruit par bit cible (Min: 0 dB, Max: 20 dB, Voix: ~5-7 dB, Données: ~1-3 dB, Vidéo: ~3-5 dB)">
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
                        <Tooltip title="Marge allouée au soft handover pour la transition entre cellules (Min: 0 dB, Max: 10 dB, valeur typique: 3 dB)">
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
      case 2: // Paramètres radio - correcté pour être l'Etape 3 dans la liste des étapes
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Paramètres radio spécifiques aux couches physiques et MAC d'UMTS.
                </Typography>
              </Alert>
            </Grid>
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
                        <Tooltip title="Rapport signal/bruit par bit cible (Min: 0 dB, Max: 20 dB, Voix: ~5-7 dB, Données: ~1-3 dB, Vidéo: ~3-5 dB)">
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
                        <Tooltip title="Marge allouée au soft handover pour la transition entre cellules (Min: 0 dB, Max: 10 dB, valeur typique: 3 dB)">
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
      case 3: // Paramètres de propagation - c'est cette étape qui manquait
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Paramètres de propagation qui déterminent la couverture des cellules UMTS.
                </Typography>
              </Alert>
            </Grid>
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
                        <Tooltip title="Fréquence d'opération du réseau UMTS (Min: 1500 MHz, Max: 2200 MHz, valeur typique: 2100 MHz)">
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
                        <Tooltip title="Puissance d'émission du NodeB (Min: 20 dBm, Max: 60 dBm, valeur typique: 43 dBm)">
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
                        <Tooltip title="Sensibilité du récepteur (Min: -130 dBm, Max: -70 dBm, valeur typique: -110 dBm)">
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
                        <Tooltip title="Marge supplémentaire pour compenser les variations de signal (Min: 0 dB, Max: 20 dB, valeur typique: 10-12 dB)">
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
                    <Select 
                      {...field} 
                      label="Type d'environnement"
                      startAdornment={
                        <InputAdornment position="start">
                          <Tooltip title="Type d'environnement qui influence les paramètres de propagation (Urbain: forte densité, Métropolitain: très forte densité, Suburbain: densité moyenne, Rural: faible densité)">
                            <IconButton size="small" edge="start">
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      }
                    >
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
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="Hauteur de l'antenne NodeB par rapport au sol (Min: 10m, Max: 100m, valeur typique: 30-40m)">
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
                  Paramètres de zone et trafic
                </Typography>
                <Typography variant="body2">
                  Zone de couverture: {formValues.coverageArea} km²
                </Typography>
                <Typography variant="body2">
                  Nombre d'abonnés: {formValues.subscriberCount}
                </Typography>
                <Typography variant="body2">
                  Facteur de croissance: {formValues.growthFactor}%
                </Typography>
                <Typography variant="body2">
                  Nombre de porteuses: {formValues.carriers}
                </Typography>
                <Typography variant="body2">
                  Nombre de secteurs par site: {formValues.sectors}
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres de services
                </Typography>
                {formValues.services.map((service, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Service {index + 1}: {service.type} - {service.bitRate} kbps (Facteur d'activité: {service.activityFactor})
                    </Typography>
                  </Box>
                ))}
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres radio
                </Typography>
                <Typography variant="body2">
                  Eb/N0 cible: {formValues.ebno} dB
                </Typography>
                <Typography variant="body2">
                  Marge de soft handover: {formValues.softHandoverMargin} dB
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Paramètres de propagation
                </Typography>
                <Typography variant="body2">
                  Fréquence: {formValues.propagationParameters.frequency} MHz
                </Typography>
                <Typography variant="body2">
                  Puissance d'émission: {formValues.propagationParameters.transmitPower} dBm
                </Typography>
                <Typography variant="body2">
                  Sensibilité récepteur: {formValues.propagationParameters.sensitivity} dBm
                </Typography>
                <Typography variant="body2">
                  Marge de liaison: {formValues.propagationParameters.margin} dB
                </Typography>
                <Typography variant="body2">
                  Type d'environnement: {
                    formValues.propagationParameters.environmentType === 'URBAN' ? 'Urbain' :
                    formValues.propagationParameters.environmentType === 'SUBURBAN' ? 'Suburbain' :
                    formValues.propagationParameters.environmentType === 'RURAL' ? 'Rural' :
                    formValues.propagationParameters.environmentType === 'METROPOLITAN' ? 'Métropolitain' : 
                    formValues.propagationParameters.environmentType
                  }
                </Typography>
                <Typography variant="body2">
                  Hauteur antenne NodeB: {formValues.propagationParameters.baseStationHeight} m
                </Typography>
                <Typography variant="body2">
                  Hauteur mobile: {formValues.propagationParameters.mobileHeight} m
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
                <UmtsResultsDisplay 
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
                    startIcon={<CalculateIcon />}
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
