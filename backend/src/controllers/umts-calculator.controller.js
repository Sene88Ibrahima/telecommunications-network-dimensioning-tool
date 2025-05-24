const { validationResult } = require('express-validator');
const umtsCalculatorService = require('../services/umts-calculator/umts-calculator.service');
const { Result } = require('../models');

/**
 * Fonction utilitaire pour calculer le débit moyen
 */
function calculateAverageBitRate(services) {
  if (!services || services.length === 0) return 0;
  const totalBitRate = services.reduce((sum, service) => sum + service.bitRate, 0);
  return totalBitRate / services.length;
}

/**
 * Calculate UMTS network dimensioning
 */
exports.calculateUmtsDimensioning = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      services,
      ebno,
      softHandoverMargin,
      propagationParameters,
      configurationId,
      saveResults,
      coverageArea = 100,    // Valeur par défaut
      sectorsPerSite = 3,    // Valeur par défaut
      subscriberCount = 5000  // Valeur par défaut
    } = req.body;

    // Calculate uplink capacity
    const uplinkCapacity = umtsCalculatorService.calculateUplinkCapacity(
      services,
      ebno
    );

    // Calculate downlink capacity
    const downlinkCapacity = umtsCalculatorService.calculateDownlinkCapacity(
      services,
      ebno
    );

    // Calculate cell coverage
    const cellCoverage = umtsCalculatorService.calculateCellCoverage(
      propagationParameters.transmitPower,
      propagationParameters.sensitivity,
      propagationParameters.margin,
      propagationParameters
    );

    // Vérification et correction du rayon de cellule
    if (cellCoverage.radius <= 0 || isNaN(cellCoverage.radius)) {
      // Fallback à une valeur par défaut raisonnable pour l'environnement urbain
      console.warn('Rayon de cellule invalide détecté, utilisation d\'une valeur par défaut');
      cellCoverage.radius = 0.8; // 800m est une valeur typique en milieu urbain pour UMTS
      cellCoverage.cellArea = 2.6 * Math.pow(cellCoverage.radius, 2); // Recalcul de la zone
    }
    
    // Calcul du nombre de cellules nécessaires pour la couverture
    const cellsForCoverage = Math.ceil(coverageArea / cellCoverage.cellArea);
    
    // Calcul du nombre de Node B (sites) nécessaires en tenant compte des secteurs
    const nodeCount = Math.ceil(cellsForCoverage / sectorsPerSite);

    // Determine limiting factor (capacity or coverage)
    const limitingFactor = uplinkCapacity.maxUsers < downlinkCapacity.maxUsers ? 'UPLINK' : 'DOWNLINK';
    const maxUsersPerCell = Math.min(uplinkCapacity.maxUsers, downlinkCapacity.maxUsers);

    // Préparation des structures de capacité avec informations supplémentaires
    uplinkCapacity.averageBitRate = calculateAverageBitRate(services);
    downlinkCapacity.averageBitRate = calculateAverageBitRate(services);

    // Prepare result object
    const result = {
      uplinkCapacity,
      downlinkCapacity,
      cellCoverage,
      limitingFactor,
      maxUsersPerCell,
      softHandoverMargin,
      services,
      nodeCount,
      cellRadius: cellCoverage.radius,
      coverageArea,
      sectorsPerSite,
      subscriberCount
    };


    // Save result to database if requested
    if (saveResults && configurationId) {
      await Result.create({
        name: `UMTS Dimensioning Result - ${new Date().toISOString()}`,
        calculationResults: result,
        projectId: req.body.projectId,
        configurationId
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de dimensionnement UMTS',
      error: error.message
    });
  }
};

/**
 * Calculate uplink capacity
 */
exports.calculateUplinkCapacity = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { services, ebno, loadFactor } = req.body;

    const capacity = umtsCalculatorService.calculateUplinkCapacity(
      services,
      ebno,
      loadFactor
    );
    
    return res.status(200).json({
      success: true,
      data: capacity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la capacité uplink',
      error: error.message
    });
  }
};

/**
 * Calculate downlink capacity
 */
exports.calculateDownlinkCapacity = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { services, ebno, loadFactor } = req.body;

    const capacity = umtsCalculatorService.calculateDownlinkCapacity(
      services,
      ebno,
      loadFactor
    );
    
    return res.status(200).json({
      success: true,
      data: capacity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la capacité downlink',
      error: error.message
    });
  }
};

/**
 * Calculate cell coverage
 */
exports.calculateCellCoverage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { transmitPower, sensitivity, margin, propagationParameters } = req.body;

    const coverage = umtsCalculatorService.calculateCellCoverage(
      transmitPower,
      sensitivity,
      margin,
      propagationParameters
    );
    
    return res.status(200).json({
      success: true,
      data: coverage
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la couverture cellulaire',
      error: error.message
    });
  }
};
