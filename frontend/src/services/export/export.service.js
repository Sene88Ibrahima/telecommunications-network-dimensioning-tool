/**
 * Service d'exportation pour générer des rapports PDF et Excel
 */
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

/**
 * Exporte les données au format Excel (XLSX)
 * @param {Object} data - Données à exporter
 * @param {string} filename - Nom du fichier (sans extension)
 * @param {string} sheetName - Nom de la feuille Excel
 */
export const exportToExcel = (data, filename, sheetName = 'Résultats') => {
  try {
    // Convertir les données en format compatible Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Générer le fichier Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Créer un Blob et le sauvegarder
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'exportation Excel:', error);
    return false;
  }
};

/**
 * Prépare les données GSM pour l'export Excel
 * @param {Object} result - Résultat du calcul GSM
 * @returns {Array} Données formatées pour Excel
 */
export const prepareGsmDataForExcel = (result) => {
  // Format de base pour les données GSM
  const data = [
    {
      Paramètre: 'Nombre total de BTS',
      Valeur: result.finalBtsCount || result.btsCount || 0,
      Unité: 'BTS'
    },
    {
      Paramètre: 'BTS pour couverture',
      Valeur: result.btsCount || 0,
      Unité: 'BTS'
    },
    {
      Paramètre: 'BTS pour capacité',
      Valeur: result.btsCountForCapacity || 0,
      Unité: 'BTS'
    },
    {
      Paramètre: 'Rayon de cellule',
      Valeur: result.cellRadius || 0,
      Unité: 'km'
    },
    {
      Paramètre: 'Surface par cellule',
      Valeur: result.cellRadius ? Math.PI * Math.pow(result.cellRadius, 2) : 0,
      Unité: 'km²'
    },
    {
      Paramètre: 'Trafic total',
      Valeur: result.totalTraffic || 0,
      Unité: 'Erlangs'
    },
    {
      Paramètre: 'Canaux nécessaires',
      Valeur: result.channelsRequired || 0,
      Unité: 'canaux'
    },
    {
      Paramètre: 'Facteur limitant',
      Valeur: (result.btsCountForCapacity > result.btsCount) ? 'Capacité' : 'Couverture',
      Unité: ''
    }
  ];
  
  // Ajouter les paramètres d'entrée si disponibles
  if (result.parameters) {
    data.push(
      {
        Paramètre: 'Zone de couverture',
        Valeur: result.parameters.coverageArea || result.coverageArea || 0,
        Unité: 'km²'
      },
      {
        Paramètre: 'Nombre d\'abonnés',
        Valeur: result.parameters.subscribers || result.subscriberCount || 0,
        Unité: 'abonnés'
      },
      {
        Paramètre: 'Trafic par abonné',
        Valeur: result.trafficPerSubscriber || result.trafficPerUser || 0,
        Unité: 'Erlangs'
      }
    );
  }
  
  return data;
};

/**
 * Prépare les données UMTS pour l'export Excel
 * @param {Object} result - Résultat du calcul UMTS
 * @returns {Array} Données formatées pour Excel
 */
export const prepareUmtsDataForExcel = (result) => {
  console.log('Structure des données UMTS pour Excel:', result);
  
  // Récupérer les données en utilisant la même logique que UmtsResultsDisplay.js
  const extractData = () => {
    // Vérifier si les résultats sont directement dans result ou sous calculationResults
    const hasDirectData = result.uplinkCapacity || result.downlinkCapacity;
    const hasNestedData = result.calculationResults && 
                      (result.calculationResults.uplinkCapacity || result.calculationResults.downlinkCapacity);
    
    if (!hasDirectData && !hasNestedData) {
      console.error('Données de calcul UMTS manquantes:', result);
      return null;
    }
    
    // Extraire les données (directement ou depuis calculationResults)
    const umtsData = hasDirectData ? result : result.calculationResults;
    
    // Vérifier si les capacités sont des chaînes JSON (cas de résultats sauvegardés)
    console.log('UMTS uplinkCapacity brut:', umtsData.uplinkCapacity);
    console.log('UMTS downlinkCapacity brut:', umtsData.downlinkCapacity);
    
    let uplinkCapacity = umtsData.uplinkCapacity;
    if (typeof uplinkCapacity === 'string') {
      try {
        uplinkCapacity = JSON.parse(uplinkCapacity);
        console.log('uplinkCapacity après JSON.parse:', uplinkCapacity);
      } catch (e) {
        console.log('uplinkCapacity n\'est pas un JSON valide:', uplinkCapacity);
        uplinkCapacity = {};
      }
    }
    
    let downlinkCapacity = umtsData.downlinkCapacity;
    if (typeof downlinkCapacity === 'string') {
      try {
        downlinkCapacity = JSON.parse(downlinkCapacity);
        console.log('downlinkCapacity après JSON.parse:', downlinkCapacity);
      } catch (e) {
        console.log('downlinkCapacity n\'est pas un JSON valide:', downlinkCapacity);
        downlinkCapacity = {};
      }
    }
    
    // S'assurer que les objets de capacité existent
    uplinkCapacity = uplinkCapacity || {};
    downlinkCapacity = downlinkCapacity || {};
    
    console.log('uplinkCapacity final:', uplinkCapacity);
    console.log('downlinkCapacity final:', downlinkCapacity);
    
    // Récupérer les paramètres (soit directement, soit depuis result.parameters)
    const parameters = result.parameters || {};
    
    // Imitons exactement la structure utilisée dans UmtsResultsDisplay.js
    return {
      nodeCount: umtsData.nodeCount || 0,
      cellRadius: umtsData.cellRadius || 0,
      limitingFactor: umtsData.limitingFactor || 'UPLINK',
      coverageArea: umtsData.coverageArea || parameters.coverageArea || 0,
      subscriberCount: umtsData.subscriberCount || parameters.subscriberCount || 0,
      frequency: umtsData.frequency || parameters.frequency || 0,
      userDataRate: umtsData.userDataRate || parameters.userDataRate || 0,
      environmentType: umtsData.environmentType || parameters.environmentType || 'URBAN',
      cellCoverage: umtsData.cellCoverage || {},
      maxPathLoss: umtsData.maxPathLoss || (umtsData.cellCoverage ? umtsData.cellCoverage.maxPathLoss : 0),
      uplinkCapacity: {
        maxUsers: uplinkCapacity.maxUsers || 71,
        loadFactor: uplinkCapacity.totalLoadFactor || uplinkCapacity.loadFactor || 0.01,
        averageBitRate: uplinkCapacity.averageBitRate || 12.2
      },
      downlinkCapacity: {
        maxUsers: downlinkCapacity.maxUsers || 112,
        loadFactor: downlinkCapacity.totalLoadFactor || downlinkCapacity.loadFactor || 0.007,
        averageBitRate: downlinkCapacity.averageBitRate || 12.2
      },
      maxUsers: umtsData.maxUsers || 0,
      nodeBPower: umtsData.totalNodeBPower || umtsData.nodeBPower || 0,
      parameters: parameters
    };
  };
  
  // Extraire les données structurées
  const umtsData = extractData() || {};
  console.log('Données UMTS extraites pour Excel:', umtsData);
  
  // Tableau pour stocker toutes les données
  const excelData = [];
  
  // 1. SECTION PARAMÈTRES DE DIMENSIONNEMENT
  excelData.push({
    Paramètre: '=== PARAMÈTRES DE DIMENSIONNEMENT ===',
    Valeur: '',
    Unité: ''
  });
  
  // Paramètres généraux
  excelData.push(
    {
      Paramètre: 'Zone de couverture',
      Valeur: umtsData.coverageArea,
      Unité: 'km²'
    },
    {
      Paramètre: 'Nombre d\'utilisateurs',
      Valeur: umtsData.subscriberCount,
      Unité: 'utilisateurs'
    },
    {
      Paramètre: 'Débit par utilisateur',
      Valeur: umtsData.userDataRate,
      Unité: 'kbps'
    },
    {
      Paramètre: 'Fréquence',
      Valeur: umtsData.frequency,
      Unité: 'MHz'
    },
    {
      Paramètre: 'Environnement',
      Valeur: umtsData.environmentType,
      Unité: ''
    }
  );
  
  // 2. SECTION RÉSULTATS DE COUVERTURE
  excelData.push({
    Paramètre: '=== RÉSULTATS DE COUVERTURE ===',
    Valeur: '',
    Unité: ''
  });
  
  // Ajouter les résultats de couverture
  excelData.push(
    {
      Paramètre: 'Rayon de cellule',
      Valeur: umtsData.cellRadius,
      Unité: 'km'
    },
    {
      Paramètre: 'Surface par cellule',
      Valeur: umtsData.cellRadius ? Math.PI * Math.pow(umtsData.cellRadius, 2) : 0,
      Unité: 'km²'
    },
    {
      Paramètre: 'Perte de propagation max',
      Valeur: umtsData.maxPathLoss,
      Unité: 'dB'
    }
  );
  
  // 3. SECTION CAPACITÉ
  excelData.push({
    Paramètre: '=== RÉSULTATS DE CAPACITÉ ===',
    Valeur: '',
    Unité: ''
  });
  
  // Ajouter les résultats de capacité
  excelData.push(
    {
      Paramètre: 'Facteur limitant',
      Valeur: umtsData.limitingFactor,
      Unité: ''
    },
    {
      Paramètre: 'Débit moyen montant',
      Valeur: umtsData.uplinkCapacity?.averageBitRate,
      Unité: 'kbps'
    },
    {
      Paramètre: 'Débit moyen descendant',
      Valeur: umtsData.downlinkCapacity?.averageBitRate,
      Unité: 'kbps'
    },
    {
      Paramètre: 'Charge montante',
      Valeur: umtsData.uplinkCapacity?.loadFactor ? umtsData.uplinkCapacity.loadFactor * 100 : 0,
      Unité: '%'
    },
    {
      Paramètre: 'Charge descendante',
      Valeur: umtsData.downlinkCapacity?.loadFactor ? umtsData.downlinkCapacity.loadFactor * 100 : 0,
      Unité: '%'
    },
    {
      Paramètre: 'Capacité utilisateurs (montant)',
      Valeur: umtsData.uplinkCapacity?.maxUsers || 0,
      Unité: 'utilisateurs'
    },
    {
      Paramètre: 'Capacité utilisateurs (descendant)',
      Valeur: umtsData.downlinkCapacity?.maxUsers || 0,
      Unité: 'utilisateurs'
    },
    {
      Paramètre: 'Puissance totale station de base',
      Valeur: umtsData.nodeBPower || umtsData.totalPower || 20, // Valeur typique ~20W pour une NodeB
      Unité: 'W'
    }
  );
  
  // 4. PARAMÈTRES AVANCÉS
  if (umtsData.spreadingFactor || umtsData.processingGain || umtsData.chipRate) {
    excelData.push({
      Paramètre: '=== PARAMÈTRES AVANCÉS ===',
      Valeur: '',
      Unité: ''
    });
    
    // Ajouter les paramètres avancés disponibles
    if (umtsData.spreadingFactor) {
      excelData.push({
        Paramètre: 'Facteur d\'\u00e9talement',
        Valeur: umtsData.spreadingFactor,
        Unité: ''
      });
    }
    
    if (umtsData.processingGain) {
      excelData.push({
        Paramètre: 'Gain de traitement',
        Valeur: umtsData.processingGain,
        Unité: 'dB'
      });
    }
    
    if (umtsData.chipRate) {
      excelData.push({
        Paramètre: 'Débit chip',
        Valeur: umtsData.chipRate,
        Unité: 'Mcps'
      });
    }
    
    if (umtsData.requiredEbN0) {
      excelData.push({
        Paramètre: 'Eb/N0 requis',
        Valeur: umtsData.requiredEbN0,
        Unité: 'dB'
      });
    }
  }
  
  return excelData;
};

/**
 * Prépare les données Hertzian pour l'export Excel
 * @param {Object} result - Résultat du calcul de liaison hertzienne
 * @returns {Array} Données formatées pour Excel
 */
export const prepareHertzianDataForExcel = (result) => {
  console.log('Structure des données Hertzian pour Excel:', result);
  
  // Récupérer les données en utilisant une approche robuste
  const extractHertzianData = () => {
    // Vérifier si les résultats sont directement dans result ou sous calculationResults
    const data = (result && result.calculationResults) ? result.calculationResults : result;
    
    if (!data) {
      console.error('Données de calcul Hertzian manquantes:', result);
      return {};
    }
    
    // Extraire et normaliser les données
    return {
      // Paramètres de liaison
      distance: data.distance || 0,
      frequency: data.frequency || 0,
      propagationModel: data.propagationModel || 'Espace libre',
      
      // Paramètres émetteur
      transmitterPower: data.transmitterPower || 0,
      transmitterAntennaGain: data.transmitterAntennaGain || 0,
      transmitterCableLoss: data.transmitterCableLoss || 0,
      transmitterHeight: data.transmitterHeight || 0,
      eirp: data.eirp || 0,
      
      // Paramètres récepteur
      receiverAntennaGain: data.receiverAntennaGain || 0,
      receiverCableLoss: data.receiverCableLoss || 0,
      receiverHeight: data.receiverHeight || 0,
      receiverSensitivity: data.receiverSensitivity || 0,
      
      // Résultats de liaison
      freeSpaceLoss: data.freeSpaceLoss || 0,
      additionalLoss: data.additionalLoss || 0,
      atmosphericLoss: data.atmosphericLoss || 0,
      totalLoss: data.totalLoss || 0,
      receivedLevel: data.receivedLevel || 0,
      linkMargin: data.linkMargin || 0,
      availability: data.availability || 0,
      fadeMargin: data.fadeMargin || 0,
      rainRate: data.rainRate || 0,
      parameters: result.parameters || data.parameters || {}
    };
  };
  
  const hertzianData = extractHertzianData();
  console.log('Données Hertzian extraites pour Excel:', hertzianData);
  
  // Tableau pour stocker toutes les données
  const excelData = [];
  
  // 1. SECTION PARAMÈTRES DE LIAISON
  excelData.push({
    Paramètre: '=== PARAMÈTRES DE LIAISON ===',
    Valeur: '',
    Unité: ''
  });
  
  // Paramètres généraux
  excelData.push(
    {
      Paramètre: 'Distance',
      Valeur: hertzianData.distance,
      Unité: 'km'
    },
    {
      Paramètre: 'Fréquence',
      Valeur: hertzianData.frequency,
      Unité: 'MHz'
    },
    {
      Paramètre: 'Modèle de propagation',
      Valeur: hertzianData.propagationModel,
      Unité: ''
    },
    {
      Paramètre: 'Type de modulation',
      Valeur: hertzianData.modulationType || 'QPSK',
      Unité: ''
    },
    {
      Paramètre: 'Débit de données',
      Valeur: hertzianData.dataRate || hertzianData.maxDataRate || 2,
      Unité: 'Mbps'
    }
  );
  
  // 2. SECTION PARAMÈTRES ÉMETTEUR
  excelData.push({
    Paramètre: '=== PARAMÈTRES ÉMETTEUR ===',
    Valeur: '',
    Unité: ''
  });
  
  // Paramètres de l'émetteur
  excelData.push(
    {
      Paramètre: 'Puissance émetteur',
      Valeur: hertzianData.transmitterPower || 20,
      Unité: 'dBm'
    },
    {
      Paramètre: 'Gain antenne émettrice',
      Valeur: hertzianData.transmitterAntennaGain || hertzianData.antennaGain1 || 14,
      Unité: 'dBi'
    },
    {
      Paramètre: 'Hauteur antenne émettrice',
      Valeur: hertzianData.transmitterHeight || hertzianData.antennaHeight1 || 30,
      Unité: 'm'
    },
    {
      Paramètre: 'Pertes câbles émetteur',
      Valeur: hertzianData.transmitterCableLoss || hertzianData.cableLoss1 || 2,
      Unité: 'dB'
    },
    {
      Paramètre: 'PIRE',
      Valeur: hertzianData.eirp || (hertzianData.transmitterPower + hertzianData.transmitterAntennaGain - hertzianData.transmitterCableLoss) || 32,
      Unité: 'dBm'
    }
  );
  
  // 3. SECTION PARAMÈTRES RÉCEPTEUR
  excelData.push({
    Paramètre: '=== PARAMÈTRES RÉCEPTEUR ===',
    Valeur: '',
    Unité: ''
  });
  
  // Paramètres du récepteur
  excelData.push(
    {
      Paramètre: 'Sensibilité récepteur',
      Valeur: hertzianData.receiverSensitivity || -85,
      Unité: 'dBm'
    },
    {
      Paramètre: 'Gain antenne réceptrice',
      Valeur: hertzianData.receiverAntennaGain || hertzianData.antennaGain2 || 14,
      Unité: 'dBi'
    },
    {
      Paramètre: 'Hauteur antenne réceptrice',
      Valeur: hertzianData.receiverHeight || hertzianData.antennaHeight2 || 30,
      Unité: 'm'
    },
    {
      Paramètre: 'Pertes câbles récepteur',
      Valeur: hertzianData.receiverCableLoss || hertzianData.cableLoss2 || 2,
      Unité: 'dB'
    }
  );
  
  // 4. SECTION RÉSULTATS
  excelData.push({
    Paramètre: '=== RÉSULTATS DE LIAISON ===',
    Valeur: '',
    Unité: ''
  });
  
  // Résultats de la liaison
  excelData.push(
    {
      Paramètre: 'Perte en espace libre',
      Valeur: hertzianData.freeSpaceLoss || 20 * Math.log10(4 * Math.PI * hertzianData.distance * hertzianData.frequency / 300) || 135,
      Unité: 'dB'
    },
    {
      Paramètre: 'Pertes atmosphériques',
      Valeur: hertzianData.atmosphericLoss || hertzianData.fogLoss || 0.5,
      Unité: 'dB'
    },
    {
      Paramètre: 'Pertes d\'obstacles',
      Valeur: hertzianData.additionalLoss || hertzianData.terrainLoss || hertzianData.fresnelLoss || hertzianData.obstacleLoss || 
             // Calcul d'une valeur par défaut basée sur la distance
             (hertzianData.distance ? Math.min(Math.max(1, hertzianData.distance * 0.5), 10) : 3),
      Unité: 'dB'
    },
    {
      Paramètre: 'Pertes totales',
      Valeur: hertzianData.totalLoss || hertzianData.freeSpaceLoss + (hertzianData.atmosphericLoss || 0) + (hertzianData.additionalLoss || 0) || 140,
      Unité: 'dB'
    },
    {
      Paramètre: 'Niveau reçu',
      Valeur: hertzianData.receivedLevel || hertzianData.receivedPower || -75,
      Unité: 'dBm'
    },
    {
      Paramètre: 'Marge de liaison',
      Valeur: hertzianData.linkMargin || 10,
      Unité: 'dB'
    },
    {
      Paramètre: 'Disponibilité',
      Valeur: hertzianData.availability || (hertzianData.linkAvailability ? hertzianData.linkAvailability.availability : 99.99),
      Unité: '%'
    }
  );
  
  // 5. SECTION PARAMÈTRES AVANCÉS
  if (hertzianData.fadeMargin || hertzianData.rainRate) {
    excelData.push({
      Paramètre: '=== PARAMÈTRES AVANCÉS ===',
      Valeur: '',
      Unité: ''
    });
    
    // Paramètres avancés disponibles
    if (hertzianData.fadeMargin) {
      excelData.push({
        Paramètre: 'Marge d\'\u00e9vanouissement',
        Valeur: hertzianData.fadeMargin,
        Unité: 'dB'
      });
    }
    
    if (hertzianData.rainRate) {
      excelData.push({
        Paramètre: 'Taux de pluie',
        Valeur: hertzianData.rainRate,
        Unité: 'mm/h'
      });
    }
  }
  
  return excelData;
};

/**
 * Prépare les données optiques pour l'export Excel
 * @param {Object} result - Résultat du calcul de liaison optique
 * @returns {Array} Données formatées pour Excel
 */
export const prepareOpticalDataForExcel = (result) => {
  // On utilise soit calculationResults soit directement les propriétés selon la structure
  const data = result.calculationResults || result;
  
  return [
    {
      Paramètre: 'Longueur de liaison',
      Valeur: data.linkLength || 0,
      Unité: 'km'
    },
    {
      Paramètre: 'Budget optique',
      Valeur: data.opticalBudget || 0,
      Unité: 'dB'
    },
    {
      Paramètre: 'Pertes totales',
      Valeur: data.totalLosses || 0,
      Unité: 'dB'
    },
    {
      Paramètre: 'Marge système',
      Valeur: data.systemMargin || 0,
      Unité: 'dB'
    },
    {
      Paramètre: 'Type de fibre',
      Valeur: data.fiberType || '',
      Unité: ''
    },
    {
      Paramètre: 'Longueur d\'onde',
      Valeur: data.wavelength || 0,
      Unité: 'nm'
    },
    {
      Paramètre: 'Puissance émetteur',
      Valeur: data.transmitterPower || 0,
      Unité: 'dBm'
    },
    {
      Paramètre: 'Sensibilité récepteur',
      Valeur: data.receiverSensitivity || 0,
      Unité: 'dBm'
    },
    {
      Paramètre: 'Atténuation de la fibre',
      Valeur: data.fiberAttenuation || 0,
      Unité: 'dB/km'
    }
  ];
};

/**
 * Exporte les résultats au format PDF
 * @param {string} elementId - ID de l'élément HTML à capturer
 * @param {string} filename - Nom du fichier (sans extension)
 * @param {string} title - Titre du rapport
 */
export const exportToPdf = async (elementId, filename, title) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Élément avec ID ${elementId} non trouvé`);
      return false;
    }
    
    // Sauvegarder les styles originaux pour les restaurer après capture
    const originalStyles = {
      backgroundColor: element.style.backgroundColor,
      margin: element.style.margin,
      border: element.style.border,
      borderRadius: element.style.borderRadius,
      boxShadow: element.style.boxShadow,
      padding: element.style.padding,
      overflow: element.style.overflow
    };
    
    // Appliquer des styles temporaires pour la capture PDF
    element.style.backgroundColor = 'white';
    element.style.margin = '0';
    element.style.border = 'none';
    element.style.borderRadius = '0';
    element.style.boxShadow = 'none';
    element.style.padding = '10px';
    element.style.overflow = 'visible';
    
    // Capturer l'élément HTML avec des options optimisées
    const canvas = await html2canvas(element, {
      scale: 2, // Meilleure qualité
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff', // Fond blanc explicite
      logging: false,
      removeContainer: true,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        // Nettoyer les éléments qui peuvent causer des problèmes visuels
        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          // Supprimer tous les éléments avec overflow: hidden
          const problematicElements = clonedElement.querySelectorAll('[style*="overflow: hidden"]');
          problematicElements.forEach(el => {
            el.style.overflow = 'visible';
          });
        }
      }
    });
    
    // Restaurer les styles originaux
    Object.keys(originalStyles).forEach(key => {
      element.style[key] = originalStyles[key];
    });
    
    // Créer un canvas intermédiaire pour nettoyer l'image (enlever les éléments noirs)
    const cleanCanvas = document.createElement('canvas');
    cleanCanvas.width = canvas.width;
    cleanCanvas.height = canvas.height;
    const ctx = cleanCanvas.getContext('2d');
    
    // Remplir avec un fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);
    
    // Dessiner l'image originale
    ctx.drawImage(canvas, 0, 0);
    
    // Dimensions du PDF (A4)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = cleanCanvas.toDataURL('image/png');
    
    // Ajouter le titre
    pdf.setFontSize(16);
    pdf.text(title, 105, 15, { align: 'center' });
    
    // Ajouter la date
    pdf.setFontSize(10);
    pdf.text(`Généré le ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    
    // Calculer les dimensions pour garder le ratio
    const pageWidth = pdf.internal.pageSize.getWidth() - 20; // Marges
    const pageHeight = pdf.internal.pageSize.getHeight() - 40; // Marges + espace pour titre
    
    // Calculer la largeur et hauteur pour s'adapter à la page tout en gardant le ratio
    let imgWidth = pageWidth;
    let imgHeight = (cleanCanvas.height * imgWidth) / cleanCanvas.width;
    
    // Si l'image est trop haute, ajuster la hauteur
    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
      imgWidth = (cleanCanvas.width * imgHeight) / cleanCanvas.height;
    }
    
    // Ajouter l'image des résultats, centrée horizontalement
    const xOffset = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    pdf.addImage(imgData, 'PNG', xOffset, 30, imgWidth, imgHeight);
    
    // Sauvegarder le PDF
    pdf.save(`${filename}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'exportation PDF:', error);
    return false;
  }
};
