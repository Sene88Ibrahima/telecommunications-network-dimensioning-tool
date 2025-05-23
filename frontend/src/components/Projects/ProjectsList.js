import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { getProjects, createProject, deleteProject } from '../../services/api/api.service';

const ProjectsList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openNewProjectDialog, setOpenNewProjectDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    networkType: 'GSM'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      setProjects(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Impossible de charger les projets. Veuillez réessayer plus tard.');
      // For development, use dummy data
      setProjects([
        { id: '1', name: 'Projet GSM Dakar', description: 'Dimensionnement du réseau GSM pour la ville de Dakar', networkType: 'GSM', createdAt: '2025-05-15T10:30:00Z', updatedAt: '2025-05-20T14:45:00Z' },
        { id: '2', name: 'Réseau UMTS Saint-Louis', description: 'Planification du réseau UMTS pour Saint-Louis', networkType: 'UMTS', createdAt: '2025-05-10T09:15:00Z', updatedAt: '2025-05-18T11:20:00Z' },
        { id: '3', name: 'Liaison hertzienne Thiès', description: 'Bilan de liaison pour le faisceau hertzien entre Thiès et Mbour', networkType: 'HERTZIEN', createdAt: '2025-05-05T16:40:00Z', updatedAt: '2025-05-15T08:30:00Z' },
        { id: '4', name: 'Fibre optique Touba', description: 'Dimensionnement de la liaison optique pour Touba', networkType: 'OPTIQUE', createdAt: '2025-05-01T11:00:00Z', updatedAt: '2025-05-12T15:10:00Z' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewProjectDialog = () => {
    setOpenNewProjectDialog(true);
  };

  const handleCloseNewProjectDialog = () => {
    setOpenNewProjectDialog(false);
    setNewProject({
      name: '',
      description: '',
      networkType: 'GSM'
    });
  };

  const handleCreateProject = async () => {
    try {
      const response = await createProject(newProject);
      const createdProject = response.data.data;
      setProjects([createdProject, ...projects]);
      handleCloseNewProjectDialog();
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Erreur lors de la création du projet. Veuillez réessayer.');
      
      // For development, add a mock project
      const mockId = Math.floor(Math.random() * 1000).toString();
      const mockProject = {
        id: mockId,
        ...newProject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProjects([mockProject, ...projects]);
      handleCloseNewProjectDialog();
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setProjectToDelete(null);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete.id);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Erreur lors de la suppression du projet. Veuillez réessayer.');
      
      // For development, remove from list anyway
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      handleCloseDeleteDialog();
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
        return <FolderIcon />;
    }
  };

  const getNetworkTypeColor = (type) => {
    switch(type) {
      case 'GSM':
        return 'primary';
      case 'UMTS':
        return 'secondary';
      case 'HERTZIEN':
        return 'success';
      case 'OPTIQUE':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Mes Projets
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewProjectDialog}
        >
          Nouveau Projet
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : projects.length > 0 ? (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nom du projet</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Type de réseau</TableCell>
                  <TableCell>Date de création</TableCell>
                  <TableCell>Dernière modification</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id} hover>
                    <TableCell component="th" scope="row">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 1, color: 'primary.main' }}>
                          {getNetworkTypeIcon(project.networkType)}
                        </Box>
                        <Link 
                          to={`/projects/${project.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography sx={{ '&:hover': { color: 'primary.main' } }}>
                            {project.name}
                          </Typography>
                        </Link>
                      </Box>
                    </TableCell>
                    <TableCell>{project.description}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={getNetworkTypeIcon(project.networkType)} 
                        label={project.networkType} 
                        color={getNetworkTypeColor(project.networkType)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(project.createdAt)}</TableCell>
                    <TableCell>{formatDate(project.updatedAt)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Modifier">
                        <IconButton 
                          onClick={() => navigate(`/projects/${project.id}`)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton 
                          onClick={() => handleDeleteClick(project)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Aucun projet trouvé
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Commencez par créer un nouveau projet pour votre dimensionnement réseau.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenNewProjectDialog}
            >
              Créer un projet
            </Button>
          </Box>
        )}
      </Paper>

      {/* Dialog for new project creation */}
      <Dialog open={openNewProjectDialog} onClose={handleCloseNewProjectDialog}>
        <DialogTitle>Créer un nouveau projet</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Veuillez renseigner les informations de base pour votre nouveau projet de dimensionnement.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du projet"
            type="text"
            fullWidth
            variant="outlined"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Type de réseau</InputLabel>
            <Select
              value={newProject.networkType}
              label="Type de réseau"
              onChange={(e) => setNewProject({ ...newProject, networkType: e.target.value })}
            >
              <MenuItem value="GSM">GSM</MenuItem>
              <MenuItem value="UMTS">UMTS</MenuItem>
              <MenuItem value="HERTZIEN">Liaison Hertzienne</MenuItem>
              <MenuItem value="OPTIQUE">Liaison Optique</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewProjectDialog}>Annuler</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained" 
            color="primary"
            disabled={!newProject.name}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for project deletion confirmation */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le projet "{projectToDelete?.name}" ? 
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

export default ProjectsList;
