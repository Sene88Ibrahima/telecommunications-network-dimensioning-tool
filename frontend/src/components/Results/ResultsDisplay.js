import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  ButtonGroup,
  Snackbar,
  Tooltip
} from '@mui/material';
import { Chart, registerables } from 'chart.js';
import OpticalResultsDisplay from './OpticalResultsDisplay';
import HertzianResultsDisplay from './HertzianResultsDisplay';
import GsmResultsDisplay from './GsmResultsDisplay';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Import des services d'exportation
import {
  exportToPdf,
  exportToExcel,
  prepareGsmDataForExcel,
  prepareUmtsDataForExcel,
  prepareHertzianDataForExcel,
  prepareOpticalDataForExcel
} from '../../services/export/export.service';

// Register ChartJS components
Chart.register(...registerables);

/**
 * Component to display calculation results
 * @param {Object} result - Result object from calculation
 * @param {string} type - Type of network (GSM, UMTS, HERTZIEN, OPTIQUE)
 */
const ResultsDisplay = ({ result, type }) => {
  // Références pour les containers de résultats (pour l'export PDF)
  const resultsContainerRef = useRef(null);
  
  // État pour les notifications
  const [notification, setNotification] = React.useState({ open: false, message: '', severity: 'info' });
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Fonction pour exporter en PDF
  const handleExportPdf = async () => {
    try {
      if (!resultsContainerRef.current) {
        setNotification({
          open: true,
          message: 'Impossible de générer le PDF: contenu non disponible',
          severity: 'error'
        });
        return;
      }
      
      // ID unique pour l'élément à exporter
      const elementId = 'results-container';
      resultsContainerRef.current.id = elementId;
      
      // Titre selon le type de réseau
      const titles = {
        GSM: 'Rapport de dimensionnement GSM',
        UMTS: 'Rapport de dimensionnement UMTS',
        HERTZIEN: 'Rapport de liaison hertzienne',
        OPTIQUE: 'Rapport de liaison optique'
      };
      
      // Générer le PDF
      const success = await exportToPdf(
        elementId,
        `${type.toLowerCase()}_results_${new Date().toISOString().split('T')[0]}`,
        titles[type] || 'Rapport de résultats'
      );
      
      if (success) {
        setNotification({
          open: true,
          message: 'Rapport PDF généré avec succès',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Erreur lors de la génération du PDF',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Erreur d\'export PDF:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de la génération du PDF',
        severity: 'error'
      });
    }
  };
  
  // Fonction pour exporter en Excel
  const handleExportExcel = () => {
    try {
      let data = [];
      let filename = '';
      
      // Préparer les données selon le type de réseau
      switch (type) {
        case 'GSM':
          data = prepareGsmDataForExcel(result.calculationResults || result);
          filename = `gsm_results_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'UMTS':
          data = prepareUmtsDataForExcel(result.calculationResults || result);
          filename = `umts_results_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'HERTZIEN':
          data = prepareHertzianDataForExcel(result);
          filename = `hertzian_results_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'OPTIQUE':
          data = prepareOpticalDataForExcel(result);
          filename = `optical_results_${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          setNotification({
            open: true,
            message: `Export Excel non disponible pour le type ${type}`,
            severity: 'warning'
          });
          return;
      }
      
      // Générer le fichier Excel
      const success = exportToExcel(data, filename);
      
      if (success) {
        setNotification({
          open: true,
          message: 'Fichier Excel généré avec succès',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Erreur lors de la génération du fichier Excel',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Erreur d\'export Excel:', error);
      setNotification({
        open: true,
        message: 'Erreur lors de la génération du fichier Excel',
        severity: 'error'
      });
    }
  };
  
  // Boutons d'exportation
  const renderExportButtons = () => (
    <ButtonGroup variant="outlined" size="small" sx={{ mt: 2, mb: 2 }}>
      <Tooltip title="Exporter en PDF">
        <Button 
          onClick={handleExportPdf} 
          startIcon={<PictureAsPdfIcon />}
          color="primary"
        >
          PDF
        </Button>
      </Tooltip>
      <Tooltip title="Exporter en Excel">
        <Button 
          onClick={handleExportExcel} 
          startIcon={<FileDownloadIcon />}
          color="success"
        >
          Excel
        </Button>
      </Tooltip>
    </ButtonGroup>
  );
  
  if (!result) {
    return <Typography variant="body1">Aucun résultat à afficher</Typography>;
  }
  
  // Log the result object to diagnose any issues
  console.log('Full result object:', result);

  // Render appropriate results based on network type
  const renderResults = () => {
    switch (type) {
      case 'GSM':
        return renderGsmResults();
      case 'UMTS':
        return renderUmtsResults();
      case 'HERTZIEN':
        return renderHertzianResults();
      case 'OPTIQUE':
        return renderOpticalResults();
      default:
        return <Typography>Type de réseau non pris en charge</Typography>;
    }
  };

  // GSM results display
  const renderGsmResults = () => {
    console.log('GSM result data:', result);
    
    // Vérifier si nous avons des données de calcul
    if (!result.calculationResults) {
      return (
        <Alert severity="warning">
          <Typography variant="h6">Données de calcul manquantes</Typography>
          <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul.</Typography>
        </Alert>
      );
    }
    
    // Utiliser le composant spécialisé GsmResultsDisplay
    return <GsmResultsDisplay result={result.calculationResults} />;
  };

  // UMTS results display
  const renderUmtsResults = () => {
    console.log('UMTS result data:', result);
    
    // Vérifier si nous avons des données de calcul
    if (!result.calculationResults) {
      return (
        <Alert severity="warning">
          <Typography variant="h6">Données de calcul manquantes</Typography>
          <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul.</Typography>
        </Alert>
      );
    }
    
    // TODO: Implémenter le composant spécialisé UmtsResultsDisplay
    // En attendant, utilisons l'affichage de base
    return (
      <Alert severity="info">
        <Typography variant="h6">Affichage UMTS en cours d'implémentation</Typography>
        <Typography variant="body2">L'affichage détaillé des résultats UMTS sera bientôt disponible.</Typography>
      </Alert>
    );
  };

  // Hertzian results display
  const renderHertzianResults = () => {
    console.log('Hertzian result data:', result);
    
    // Vérifier si nous avons des données de calcul
    if (!result.calculationResults && !result.distance) {
      return (
        <Alert severity="warning">
          <Typography variant="h6">Données de calcul manquantes</Typography>
          <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul.</Typography>
        </Alert>
      );
    }
    
    // Utiliser le composant spécialisé HertzianResultsDisplay
    return <HertzianResultsDisplay result={result} />;
  };

  // Optical results display
  const renderOpticalResults = () => {
    console.log('Optical result data:', result);
    
    // Vérifier si nous avons des données de calcul
    if (!result.calculationResults) {
      return (
        <Alert severity="warning">
          <Typography variant="h6">Données de calcul manquantes</Typography>
          <Typography variant="body2">Les résultats détaillés ne sont pas disponibles pour ce calcul.</Typography>
        </Alert>
      );
    }
    
    // Utiliser le composant spécialisé OpticalResultsDisplay
    return <OpticalResultsDisplay result={result.calculationResults} />;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Titre et boutons d'exportation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Résultats {type === 'GSM' || type === 'UMTS' ? `de dimensionnement ${type}` : `de liaison ${type}`}
        </Typography>
        {renderExportButtons()}
      </Box>
      
      {/* Container pour les résultats à exporter */}
      <Box ref={resultsContainerRef}>
        {renderResults()}
      </Box>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        message={notification.message}
      />
    </Box>
  );
};

export default ResultsDisplay;
