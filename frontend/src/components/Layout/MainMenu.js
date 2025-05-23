import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Divider,
  Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import CalculateIcon from '@mui/icons-material/Calculate';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import WifiIcon from '@mui/icons-material/Wifi';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const StyledNavLink = styled(NavLink)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.text.primary,
  '&.active': {
    '& .MuiListItemButton-root': {
      backgroundColor: theme.palette.action.selected,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemText-primary': {
      fontWeight: 'bold',
      color: theme.palette.primary.main,
    },
  },
}));

const MainMenu = () => {
  const [calculatorsOpen, setCalculatorsOpen] = React.useState(true);

  const handleCalculatorsClick = () => {
    setCalculatorsOpen(!calculatorsOpen);
  };

  return (
    <>
      <StyledNavLink to="/" end>
        <ListItemButton>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Tableau de bord" />
        </ListItemButton>
      </StyledNavLink>

      <StyledNavLink to="/projects">
        <ListItemButton>
          <ListItemIcon>
            <FolderIcon />
          </ListItemIcon>
          <ListItemText primary="Projets" />
        </ListItemButton>
      </StyledNavLink>

      <ListItem disablePadding>
        <ListItemButton onClick={handleCalculatorsClick}>
          <ListItemIcon>
            <CalculateIcon />
          </ListItemIcon>
          <ListItemText primary="Calculateurs" />
          {calculatorsOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
      </ListItem>

      <Collapse in={calculatorsOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          <StyledNavLink to="/calculator/gsm">
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemIcon>
                <SignalCellularAltIcon />
              </ListItemIcon>
              <ListItemText primary="Réseau GSM" />
            </ListItemButton>
          </StyledNavLink>

          <StyledNavLink to="/calculator/umts">
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemIcon>
                <WifiIcon />
              </ListItemIcon>
              <ListItemText primary="Réseau UMTS" />
            </ListItemButton>
          </StyledNavLink>

          <StyledNavLink to="/calculator/hertzian">
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemIcon>
                <SettingsInputAntennaIcon />
              </ListItemIcon>
              <ListItemText primary="Bilan hertzien" />
            </ListItemButton>
          </StyledNavLink>

          <StyledNavLink to="/calculator/optical">
            <ListItemButton sx={{ pl: 4 }}>
              <ListItemIcon>
                <FiberManualRecordIcon />
              </ListItemIcon>
              <ListItemText primary="Bilan optique" />
            </ListItemButton>
          </StyledNavLink>
        </List>
      </Collapse>

      <Divider sx={{ my: 1 }} />

      <StyledNavLink to="/reports">
        <ListItemButton>
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText primary="Rapports" />
        </ListItemButton>
      </StyledNavLink>
    </>
  );
};

export default MainMenu;
