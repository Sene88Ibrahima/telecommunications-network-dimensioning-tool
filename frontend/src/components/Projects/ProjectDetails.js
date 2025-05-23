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
  Tooltip
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
  getProjectResults 
} from '../../services/api/api.service';

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
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // For development, use mock data
      const mockProject = {
        id,
        name: 'Projet GSM Dakar',
        description: 'Dimensionnement du réseau GSM pour la ville de Dakar',
        networkType: 'GSM',
        createdAt: '2025-05-15T10:30:00Z',
        updatedAt: '2025-05-20T14:45:00Z'
      };
      
      const mockConfigurations = [
        {
          id: '1',
          name: 'Configuration initiale',
          parameters: {
            coverageArea: 100,
            trafficPerSubscriber: 0.02,
            subscriberCount: 50000,
            frequency: 900,
            btsPower: 43,
            mobileReceptionThreshold: -102,
            propagationModel: 'OKUMURA_HATA'
          },
          projectId: id,
          createdAt: '2025-05-16T11:30:00Z'
        },
        {
          id: '2',
          name: 'Configuration optimisée',
          parameters: {
            coverageArea: 100,
            trafficPerSubscriber: 0.025,
            subscriberCount: 60000,
            frequency: 900,
            btsPower: 45,
            mobileReceptionThreshold: -102,
            propagationModel: 'OKUMURA_HATA'
          },
          projectId: id,
          createdAt: '2025-05-18T14:45:00Z'
        }
      ];
      
      const mockResults = [
        {
          id: '1',
          name: 'Résultat initial',
          calculationResults: {
            cellRadius: 2.1,
            btsCount: 28,
            btsCountForCapacity: 25,
            finalBtsCount: 28,
            totalTraffic: 1000,
            channelsRequired: 1250
          },
          projectId: id,
          configurationId: '1',
          createdAt: '2025-05-16T11:35:00Z'
        },
        {
          id: '2',
          name: 'Résultat optimisé',
          calculationResults: {
            cellRadius: 2.3,
            btsCount: 24,
            btsCountForCapacity: 30,
            finalBtsCount: 30,
            totalTraffic: 1500,
            channelsRequired: 1875
          },
          projectId: id,
          configurationId: '2',
          createdAt: '2025-05-18T14:50:00Z'
        }
      ];
      
      setProject(mockProject);
      setEditedProject(mockProject);
      setConfigurations(mockConfigurations);
      setResults(mockResults);
      
      // In a real implementation, you would fetch from the API
      /*
      const projectResponse = await getProjectById(id);
      setProject(projectResponse.data.data);
      setEditedProject(projectResponse.data.data);
      
      const configurationsResponse = await getProjectConfigurations(id);
      setConfigurations(configurationsResponse.data.data || []);
      
      const resultsResponse = await getProjectResults(id);
      setResults(resultsResponse.data.data || []);
      */
      
      setError(null);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Impossible de charger les données du projet. Veuillez réessayer plus tard.');
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
      // For development, just update the local state
      setProject(editedProject);
      setEditMode(false);
      
      // In a real implementation, you would call the API
      /*
      const response = await updateProject(id, editedProject);
      setProject(response.data.data);
      setEditMode(false);
      */
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Erreur lors de la mise à jour du projet. Veuillez réessayer.');
    }
  };

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteProject = async () => {
    try {
      // In a real implementation, you would call the API
      /*
      await deleteProject(id);
      */
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Erreur lors de la suppression du projet. Veuillez réessayer.');
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
    switch(networkType) {
      case 'GSM':
        return '/calculator/gsm';
      case 'UMTS':
        return '/calculator/umts';
      case 'HERTZIEN':
        return '/calculator/hertzian';
      case 'OPTIQUE':
        return '/calculator/optical';
      default:
        return '/';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Type de réseau:
                  </Typography>
                  <Chip 
                    icon={getNetworkTypeIcon(project.networkType)} 
                    label={project.networkType} 
                    size="small" 
                  />
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
              onClick={() => navigate(getCalculatorPath(project.networkType))}
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
                        onClick={() => navigate(getCalculatorPath(project.networkType), { state: { configurationId: config.id } })}
                      >
                        Utiliser
                      </Button>
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<DeleteIcon />}
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
                onClick={() => navigate(getCalculatorPath(project.networkType))}
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
        open={openDeleteDialog}
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
    </Box>
  );
};

export default ProjectDetails;
