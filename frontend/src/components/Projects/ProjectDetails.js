import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CalculateIcon from '@mui/icons-material/Calculate';
import DescriptionIcon from '@mui/icons-material/Description';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { 
  getProjectById, 
  updateProject, 
  getProjectConfigurations, 
  getProjectResults,
  deleteResult,
  deleteConfiguration,
  deleteProject
} from '../../services/api/api.service';

// Fonction utilitaire pour formater les dates
const formatDate = (dateString) => {
  if (!dateString) return 'Non définie';
  
  try {
    const date = new Date(dateString);
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    // Formater la date au format local
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erreur de formatage de date:', error);
    return 'Erreur de date';
  }
};

// Fonction pour formater les paramètres de configuration
const formatParameters = (parameters, networkType) => {
  if (!parameters) return 'Paramètres non disponibles';

  try {
    const paramList = [];
    
    // Paramètres communs à tous les types de réseau
    if (parameters.coverageArea) paramList.push(`Zone de couverture: ${parameters.coverageArea} km²`);
    
    // Paramètres spécifiques selon le type de réseau
    switch (networkType?.toLowerCase()) {
      case 'gsm':
        if (parameters.trafficPerSubscriber) paramList.push(`Trafic par abonné: ${parameters.trafficPerSubscriber} Erlang`);
        if (parameters.subscriberCount) paramList.push(`Nombre d'abonnés: ${parameters.subscriberCount}`);
        if (parameters.frequency) paramList.push(`Fréquence: ${parameters.frequency} MHz`);
        if (parameters.btsPower) paramList.push(`Puissance BTS: ${parameters.btsPower} dBm`);
        break;
        
      case 'umts':
      case '3g':
        if (parameters.chipRate) paramList.push(`Débit chip: ${parameters.chipRate} Mcps`);
        if (parameters.processingGain) paramList.push(`Gain de traitement: ${parameters.processingGain} dB`);
        if (parameters.subscriberCount) paramList.push(`Nombre d'abonnés: ${parameters.subscriberCount}`);
        break;
        
      case 'lte':
      case '4g':
        if (parameters.bandwidth) paramList.push(`Bande passante: ${parameters.bandwidth} MHz`);
        if (parameters.dataRate) paramList.push(`Débit de données: ${parameters.dataRate} Mbps`);
        if (parameters.subscriberCount) paramList.push(`Nombre d'abonnés: ${parameters.subscriberCount}`);
        break;
        
      case '5g':
        if (parameters.bandwidth) paramList.push(`Bande passante: ${parameters.bandwidth} MHz`);
        if (parameters.dataRate) paramList.push(`Débit de données: ${parameters.dataRate} Gbps`);
        if (parameters.density) paramList.push(`Densité de terminaux: ${parameters.density} /km²`);
        break;
        
      default:
        // Afficher tous les paramètres disponibles si le type n'est pas reconnu
        Object.entries(parameters).forEach(([key, value]) => {
          paramList.push(`${key}: ${value}`);
        });
    }
    
    return paramList.join('\n');
  } catch (error) {
    console.error('Erreur de formatage des paramètres:', error);
    return 'Erreur de formatage';
  }
};

// Fonction pour obtenir l'icône du type de réseau
const getNetworkTypeIcon = (networkType) => {
  switch (networkType?.toLowerCase()) {
    case 'gsm':
      return <SignalCellularAltIcon />;
    case 'umts':
    case '3g':
      return <WifiIcon />;
    case 'lte':
    case '4g':
      return <SettingsInputAntennaIcon />;
    case '5g':
      return <FiberManualRecordIcon />;
    default:
      return <SignalCellularAltIcon color="disabled" />;
  }
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
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

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [project, setProject] = useState(null);
  const [configurations, setConfigurations] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteResultDialogOpen, setDeleteResultDialogOpen] = useState(false);
  const [deleteConfigDialogOpen, setDeleteConfigDialogOpen] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [selectedConfigId, setSelectedConfigId] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les données réelles depuis l'API
      const projectResponse = await getProjectById(id);
      console.log('Réponse de l\'API pour le projet:', projectResponse);
      
      // Vérifier la structure de la réponse
      if (!projectResponse || !projectResponse.data) {
        throw new Error('Réponse API invalide - Pas de données projet');
      }
      
      console.log('Données du projet:', projectResponse.data);
      
      // Extraire les données réelles du projet depuis la structure API
      // La structure est projectResponse.data.data (les données sont dans un sous-objet 'data')
      const project = projectResponse.data.data || {};
      console.log('Données réelles du projet:', project);
      
      // Normaliser les données du projet pour éviter les erreurs
      const normalizedProject = {
        id: project.id || id,
        name: project.name || 'Projet sans nom',
        description: project.description || '',
        networkType: project.networkType || '',
        createdAt: project.createdAt || null,
        updatedAt: project.updatedAt || null
      };
      
      // Récupérer les configurations du projet
      const configurationsResponse = await getProjectConfigurations(id);
      console.log('Réponse API pour les configurations:', configurationsResponse);
      // Même structure que pour les projets: la réponse est dans un sous-objet 'data'
      const configurations = configurationsResponse?.data?.data || [];
      console.log('Configurations réelles:', configurations);
      
      // Récupérer les résultats du projet
      const resultsResponse = await getProjectResults(id);
      console.log('Réponse API pour les résultats:', resultsResponse);
      // Même structure que pour les projets: la réponse est dans un sous-objet 'data'
      const results = resultsResponse?.data?.data || [];
      console.log('Résultats réels:', results);
      
      // Mettre à jour les états avec les données normalisées
      setProject(normalizedProject);
      setEditedProject(normalizedProject); 
      setConfigurations(configurations);
      setResults(results);
      
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Impossible de charger les données du projet. Veuillez réessayer plus tard.');
      
      // En cas d'erreur, utiliser des valeurs par défaut
      const defaultProject = {
        id,
        name: 'Projet non disponible',
        description: 'Les données du projet ne peuvent pas être chargées',
        networkType: 'N/A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setProject(defaultProject);
      setEditedProject(defaultProject);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit
      setEditedProject(project);
    }
    setEditMode(!editMode);
  };

  const handleSaveProject = async () => {
    try {
      setError(null);
      
      // Appeler l'API pour mettre à jour le projet
      const response = await updateProject(id, editedProject);
      
      // Mettre à jour les données locales avec la réponse de l'API
      if (response && response.data) {
        setProject(response.data);
        setEditMode(false);
        // Afficher un message temporaire de succès
        alert('Projet mis à jour avec succès!');
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError(`Erreur lors de la mise à jour du projet: ${err.message}`);
    }
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteProject = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appel API pour supprimer le projet
      const response = await deleteProject(id);
      console.log('Réponse de suppression du projet:', response);
      
      // Fermer le dialogue et rediriger vers la liste des projets
      handleCloseDeleteDialog();
      navigate('/projects');
      
    } catch (err) {
      console.error('Erreur lors de la suppression du projet:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du projet');
      handleCloseDeleteDialog();
    } finally {
      setLoading(false);
    }
  };
  
  // Fonctions pour gérer la suppression des résultats
  const handleOpenDeleteResultDialog = (resultId) => {
    setSelectedResultId(resultId);
    setDeleteResultDialogOpen(true);
  };

  const handleCloseDeleteResultDialog = () => {
    setDeleteResultDialogOpen(false);
    setSelectedResultId(null);
  };

  const handleDeleteResult = async () => {
    if (!selectedResultId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Appel API pour supprimer le résultat
      const response = await deleteResult(selectedResultId);
      console.log('Réponse de suppression du résultat:', response);
      
      // Mettre à jour la liste des résultats
      setResults(results.filter(result => result.id !== selectedResultId));
      
      // Fermer le dialogue
      handleCloseDeleteResultDialog();
      
    } catch (err) {
      console.error('Erreur lors de la suppression du résultat:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression du résultat');
      handleCloseDeleteResultDialog();
    } finally {
      setLoading(false);
    }
  };
  
  // Fonctions pour gérer la suppression des configurations
  const handleOpenDeleteConfigDialog = (configId) => {
    setSelectedConfigId(configId);
    setDeleteConfigDialogOpen(true);
  };

  const handleCloseDeleteConfigDialog = () => {
    setDeleteConfigDialogOpen(false);
    setSelectedConfigId(null);
  };

  const handleDeleteConfig = async () => {
    if (!selectedConfigId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Appel API pour supprimer la configuration
      const response = await deleteConfiguration(selectedConfigId);
      console.log('Réponse de suppression de la configuration:', response);
      
      // Mettre à jour la liste des configurations
      setConfigurations(configurations.filter(config => config.id !== selectedConfigId));
      
      // Fermer le dialogue
      handleCloseDeleteConfigDialog();
      
    } catch (err) {
      console.error('Erreur lors de la suppression de la configuration:', err);
      setError(err.response?.data?.message || 'Erreur lors de la suppression de la configuration');
      handleCloseDeleteConfigDialog();
    } finally {
      setLoading(false);
    }
  };

  const getNetworkTypeIcon = (type) => {
    switch(type) {
      case 'GSM':
        return <SignalCellularAltIcon />;
      case 'UMTS':
        return <WifiIcon />;
      case 'HERTZIEN':
        return <SettingsInputAntennaIcon />;
      case 'OPTIQUE':
        return <FiberManualRecordIcon />;
      default:
        return null;
    }
  };

  const getCalculatorPath = (networkType) => {
    // Normaliser le type de réseau pour gérer les variations
    const type = networkType?.toLowerCase();
    
    if (!type) return '/';
    
    // Gérer les différentes variantes possibles pour chaque type
    if (type.includes('gsm') || type.includes('2g')) {
      return '/calculator/gsm';
    } else if (type.includes('umts') || type.includes('3g')) {
      return '/calculator/umts';
    } else if (type.includes('lte') || type.includes('4g')) {
      return '/calculator/umts'; // Rediriger vers UMTS si pas de calculateur LTE
    } else if (type.includes('hertzien') || type.includes('hertz') || type.includes('radio')) {
      return '/calculator/hertzian';
    } else if (type.includes('opti') || type.includes('fibre') || type.includes('fiber') || type.includes('liaison')) {
      return '/calculator/optical';
    } else {
      // Afficher un message et rediriger vers la page d'accueil des calculateurs
      console.warn(`Type de réseau non reconnu: ${networkType}`);
      return '/';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    
    try {
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('Date invalide:', dateString);
        return 'Date non disponible';
      }
      
      // Formater la date correctement
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Erreur de date';
    }
  };

  const formatParameters = (parameters, networkType) => {
    if (!parameters) return 'Aucun paramètre';
    
    switch(networkType) {
      case 'GSM':
        return `Zone: ${parameters.coverageArea} km², Abonnés: ${parameters.subscriberCount}, Fréquence: ${parameters.frequency} MHz`;
      case 'UMTS':
        return `Services: ${parameters.services?.length || 0}, Eb/N0: ${parameters.ebno} dB`;
      case 'HERTZIEN':
        return `Fréquence: ${parameters.frequency} GHz, Distance: ${parameters.distance} km`;
      case 'OPTIQUE':
        return `Type: ${parameters.fiberType === 'MONOMODE' ? 'Monomode' : 'Multimode'}, Longueur: ${parameters.linkLength} km`;
      default:
        return 'Paramètres non disponibles';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Alert severity="error">
        Projet non trouvé ou erreur lors du chargement.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Retour à la liste
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 2, color: 'primary.main' }}>
                {getNetworkTypeIcon(project.networkType)}
              </Box>
              {editMode ? (
                <TextField
                  value={editedProject.name}
                  onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: 300 }}
                />
              ) : (
                <Typography variant="h4" component="h1">
                  {project.name}
                </Typography>
              )}
            </Box>
            <Box>
              {editMode ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleEditToggle}
                    sx={{ mr: 1 }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProject}
                  >
                    Enregistrer
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditToggle}
                    sx={{ mr: 1 }}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleOpenDeleteDialog}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {editMode ? (
                <TextField
                  value={editedProject.description}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                />
              ) : (
                <Typography variant="body1" color="text.secondary" paragraph>
                  {project.description || 'Aucune description'}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Type de réseau:
                  </Typography>
                  {editMode ? (
                    <Select
                      value={editedProject.networkType || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, networkType: e.target.value })}
                      size="small"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="GSM">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SignalCellularAltIcon fontSize="small" sx={{ mr: 1 }} />
                          GSM
                        </Box>
                      </MenuItem>
                      <MenuItem value="UMTS">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WifiIcon fontSize="small" sx={{ mr: 1 }} />
                          UMTS
                        </Box>
                      </MenuItem>
                      <MenuItem value="LTE">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SettingsInputAntennaIcon fontSize="small" sx={{ mr: 1 }} />
                          LTE
                        </Box>
                      </MenuItem>
                      <MenuItem value="5G">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FiberManualRecordIcon fontSize="small" sx={{ mr: 1 }} />
                          5G
                        </Box>
                      </MenuItem>
                    </Select>
                  ) : (
                    <Chip 
                      icon={getNetworkTypeIcon(project?.networkType || 'GSM')} 
                      label={project?.networkType || 'Non défini'} 
                      size="small" 
                      color={project?.networkType ? 'primary' : 'default'}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Créé le:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(project.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Dernière modification:
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(project.updatedAt)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalculateIcon />}
              onClick={() => navigate(getCalculatorPath(project.networkType), { state: { projectId: project.id } })}
            >
              Ouvrir le calculateur {project.networkType}
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="project tabs"
            centered
          >
            <Tab label="Configurations" />
            <Tab label="Résultats" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {configurations.length > 0 ? (
            <Grid container spacing={3}>
              {configurations.map((config) => (
                <Grid item xs={12} md={6} lg={4} key={config.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {config.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Créé le {formatDate(config.createdAt)}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        {formatParameters(config.parameters, project.networkType)}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<CalculateIcon />}
                        onClick={() => navigate(getCalculatorPath(project.networkType), { state: { configurationId: config.id, projectId: project.id } })}
                      >
                        Utiliser
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteConfigDialog(config.id)}
                      >
                        Supprimer
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Aucune configuration enregistrée pour ce projet.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<CalculateIcon />}
                onClick={() => navigate(getCalculatorPath(project.networkType), { state: { projectId: project.id } })}
                sx={{ mt: 2 }}
              >
                Créer une configuration
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {results.length > 0 ? (
            <Grid container spacing={3}>
              {results.map((result) => (
                <Grid item xs={12} md={6} lg={4} key={result.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {result.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Calculé le {formatDate(result.createdAt)}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <List dense>
                        {project.networkType === 'GSM' && (
                          <>
                            <ListItem>
                              <ListItemText 
                                primary="Nombre de BTS" 
                                secondary={result.calculationResults.finalBtsCount} 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Rayon de cellule" 
                                secondary={`${result.calculationResults.cellRadius} km`} 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Trafic total" 
                                secondary={`${result.calculationResults.totalTraffic} Erlang`} 
                              />
                            </ListItem>
                          </>
                        )}
                      </List>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<DescriptionIcon />}
                        onClick={() => navigate(`/results/${result.id}`)}
                      >
                        Voir détails
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenDeleteResultDialog(result.id)}
                      >
                        Supprimer
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Aucun résultat enregistré pour ce projet.
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<CalculateIcon />}
                onClick={() => navigate(getCalculatorPath(project.networkType))}
                sx={{ mt: 2 }}
              >
                Effectuer un calcul
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen} 
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le projet "{project.name}" ? 
            Cette action est irréversible et supprimera également toutes les configurations et résultats associés.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Annuler</Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation pour supprimer un résultat */}
      <Dialog open={deleteResultDialogOpen} onClose={handleCloseDeleteResultDialog}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer ce résultat ? 
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteResultDialog}>Annuler</Button>
          <Button onClick={handleDeleteResult} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de confirmation pour supprimer une configuration */}
      <Dialog open={deleteConfigDialogOpen} onClose={handleCloseDeleteConfigDialog}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette configuration ? 
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfigDialog}>Annuler</Button>
          <Button onClick={handleDeleteConfig} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetails;
