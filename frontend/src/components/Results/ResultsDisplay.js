import React from 'react';
import {
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Chart, registerables } from 'chart.js';
import OpticalResultsDisplay from './OpticalResultsDisplay';
import HertzianResultsDisplay from './HertzianResultsDisplay';
import GsmResultsDisplay from './GsmResultsDisplay';

// Register ChartJS components
Chart.register(...registerables);

/**
 * Component to display calculation results
 * @param {Object} result - Result object from calculation
 * @param {string} type - Type of network (GSM, UMTS, HERTZIEN, OPTIQUE)
 */
const ResultsDisplay = ({ result, type }) => {
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
    <Box>
      {renderResults()}
    </Box>
  );
};

export default ResultsDisplay;
