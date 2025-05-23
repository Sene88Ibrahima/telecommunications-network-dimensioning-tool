import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import WifiIcon from '@mui/icons-material/Wifi';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import FolderIcon from '@mui/icons-material/Folder';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import axios from 'axios';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(2),
  color: theme.palette.text.primary,
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const CardStyled = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: theme.shadows[8]
  }
}));

const Dashboard = () => {
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await axios.get('/api/projects?limit=5');
        setRecentProjects(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recent projects:', err);
        setError('Impossible de charger les projets récents. Veuillez réessayer plus tard.');
        setLoading(false);
        // Use dummy data for development
        setRecentProjects([
          { id: '1', name: 'Projet GSM Dakar', networkType: 'GSM', updatedAt: '2025-05-20T12:00:00Z' },
          { id: '2', name: 'Réseau UMTS Saint-Louis', networkType: 'UMTS', updatedAt: '2025-05-18T09:30:00Z' },
          { id: '3', name: 'Liaison hertzienne Thiès', networkType: 'HERTZIEN', updatedAt: '2025-05-15T14:45:00Z' }
        ]);
      }
    };

    fetchRecentProjects();
  }, []);

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

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom component="div" sx={{ mb: 4 }}>
        Outil de Dimensionnement des Réseaux de Télécommunications
      </Typography>

      <Grid container spacing={4}>
        {/* Calculators Section */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom component="div">
            Calculateurs disponibles
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <CardStyled variant="outlined">
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <SignalCellularAltIcon />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      Réseau GSM
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Calculez le nombre de BTS, rayon de cellule, capacité trafic, et dimensionnement en couverture et capacité pour les réseaux GSM.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/calculator/gsm" color="primary">
                    Ouvrir le calculateur
                  </Button>
                </CardActions>
              </CardStyled>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <CardStyled variant="outlined">
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <WifiIcon />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      Réseau UMTS
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Dimensionnez les réseaux UMTS (3G) avec calcul de capacité uplink/downlink, planification de fréquences et estimation de couverture.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/calculator/umts" color="primary">
                    Ouvrir le calculateur
                  </Button>
                </CardActions>
              </CardStyled>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <CardStyled variant="outlined">
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <SettingsInputAntennaIcon />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      Bilan de liaison hertzienne
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Calculez les bilans de liaison pour les faisceaux hertziens: perte espace libre, marge de liaison, disponibilité.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/calculator/hertzian" color="primary">
                    Ouvrir le calculateur
                  </Button>
                </CardActions>
              </CardStyled>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <CardStyled variant="outlined">
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <FiberManualRecordIcon />
                    </Avatar>
                    <Typography variant="h6" component="div">
                      Bilan de liaison optique
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Évaluez les liaisons optiques avec calcul du budget optique, pertes totales, portée maximale et marge système.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} to="/calculator/optical" color="primary">
                    Ouvrir le calculateur
                  </Button>
                </CardActions>
              </CardStyled>
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Projects Section */}
        <Grid item xs={12} md={4}>
          <Item>
            <Typography variant="h5" gutterBottom component="div">
              Projets récents
            </Typography>
            {loading ? (
              <Typography variant="body2">Chargement des projets...</Typography>
            ) : error ? (
              <Typography variant="body2" color="error">{error}</Typography>
            ) : (
              <>
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {recentProjects.map((project) => (
                    <React.Fragment key={project.id}>
                      <ListItem
                        secondaryAction={
                          <Tooltip title="Ouvrir le projet">
                            <IconButton edge="end" component={Link} to={`/projects/${project.id}`}>
                              <OpenInNewIcon />
                            </IconButton>
                          </Tooltip>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar>
                            {getNetworkTypeIcon(project.networkType)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={project.name}
                          secondary={`Modifié le ${formatDate(project.updatedAt)}`}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component={Link} 
                    to="/projects"
                    fullWidth
                  >
                    Voir tous les projets
                  </Button>
                </Box>
              </>
            )}
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
