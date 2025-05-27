const { validationResult } = require('express-validator');
const opticalLinkService = require('../services/link-budget/optical-link.service');
const { Result } = require('../models');

/**
 * Calculate optical link budget
 */
exports.calculateOpticalLinkBudget = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      fiberType,
      linkLength,
      wavelength,
      transmitterPower,
      receiverSensitivity,
      connectorCount,
      spliceCount,
      configurationId,
      saveResults,
      // Nouveaux paramètres
      bitRate,
      spectralWidth,
      connectorLoss,
      spliceLoss,
      safetyMargin
    } = req.body;

    // Calculate optical budget
    const opticalBudget = opticalLinkService.calculateOpticalBudget(
      transmitterPower,
      receiverSensitivity
    );

    // Calculate total losses
    const totalLosses = opticalLinkService.calculateTotalLosses(
      fiberType,
      linkLength,
      wavelength,
      connectorCount,
      spliceCount,
      connectorLoss,
      spliceLoss,
      safetyMargin
    );
    
    // Calculate system margin
    const systemMargin = opticalBudget - totalLosses;
    
    // Utiliser les valeurs fournies ou les valeurs par défaut
    const connLoss = connectorLoss || (fiberType === 'MONOMODE' ? 0.5 : 1.0);
    const spliceLs = spliceLoss || (fiberType === 'MONOMODE' ? 0.1 : 0.3);
    const safety = safetyMargin || 3;
    const fiberAttenuation = opticalLinkService.getFiberAttenuation(fiberType, wavelength);
    
    const connectionLosses = (connectorCount * connLoss) + (spliceCount * spliceLs);
    
    const maxRange = opticalLinkService.calculateMaxRange(
      opticalBudget,
      fiberAttenuation,
      connectionLosses,
      safety
    );
    
    // Calculer la pénalité due à la dispersion si les paramètres sont fournis
    let dispersionPenalty = null;
    let chromaticDispersion = null;
    
    if (bitRate && spectralWidth) {
      chromaticDispersion = opticalLinkService.calculateChromaticDispersion(
        wavelength,
        linkLength,
        spectralWidth
      );
      
      dispersionPenalty = opticalLinkService.calculateDispersionPenalty(
        bitRate,
        chromaticDispersion
      );
    }

    // Prepare result object
    const result = {
      opticalBudget,
      totalLosses,
      systemMargin,
      maxRange,
      fiberType,
      linkLength,
      wavelength,
      transmitterPower,
      receiverSensitivity,
      connectorCount,
      spliceCount,
      fiberAttenuation,
      connectorLoss: connLoss,
      spliceLoss: spliceLs,
      connectionLosses,
      safetyMargin: safety
    };
    
    // Ajouter les paramètres supplémentaires s'ils sont disponibles
    if (bitRate) result.bitRate = bitRate;
    if (spectralWidth) result.spectralWidth = spectralWidth;
    if (chromaticDispersion) result.chromaticDispersion = chromaticDispersion;
    if (dispersionPenalty) result.dispersionPenalty = dispersionPenalty;

    // Save result to database if requested
    if (saveResults && configurationId) {
      await Result.create({
        name: `Optical Link Budget - ${new Date().toISOString()}`,
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
      message: 'Erreur lors du calcul du bilan de liaison optique',
      error: error.message
    });
  }
};

/**
 * Calculate optical budget only
 */
exports.calculateOpticalBudget = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { transmitterPower, receiverSensitivity } = req.body;

    const opticalBudget = opticalLinkService.calculateOpticalBudget(
      transmitterPower,
      receiverSensitivity
    );
    
    return res.status(200).json({
      success: true,
      data: {
        opticalBudget,
        transmitterPower,
        receiverSensitivity
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du budget optique',
      error: error.message
    });
  }
};

/**
 * Calculate total losses only
 */
exports.calculateTotalLosses = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { fiberType, linkLength, wavelength, connectorCount, spliceCount } = req.body;

    const totalLosses = opticalLinkService.calculateTotalLosses(
      fiberType,
      linkLength,
      wavelength,
      connectorCount,
      spliceCount
    );
    
    return res.status(200).json({
      success: true,
      data: {
        totalLosses,
        fiberType,
        linkLength,
        wavelength,
        connectorCount,
        spliceCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des pertes totales',
      error: error.message
    });
  }
};

/**
 * Calculate maximum range
 */
exports.calculateMaxRange = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { opticalBudget, linearAttenuation, connectionLosses } = req.body;

    const maxRange = opticalLinkService.calculateMaxRange(
      opticalBudget,
      linearAttenuation,
      connectionLosses
    );
    
    return res.status(200).json({
      success: true,
      data: {
        maxRange,
        opticalBudget,
        linearAttenuation,
        connectionLosses
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la portée maximale',
      error: error.message
    });
  }
};
