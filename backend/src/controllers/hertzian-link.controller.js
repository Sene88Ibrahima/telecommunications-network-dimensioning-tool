const { validationResult } = require('express-validator');
const hertzianLinkService = require('../services/link-budget/hertzian-link.service');
const { Result } = require('../models');

/**
 * Calculate hertzian link budget
 */
exports.calculateHertzianLinkBudget = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      frequency,
      distance,
      antennaHeight1,
      antennaHeight2,
      transmitPower,
      antennaGain1,
      antennaGain2,
      losses,
      configurationId,
      saveResults
    } = req.body;

    // Calculate free space loss
    const freeSpaceLoss = hertzianLinkService.calculateFreeSpaceLoss(
      frequency,
      distance
    );

    // Calculate system gain
    const systemGain = transmitPower + antennaGain1 + antennaGain2;
    
    // Calculate total losses
    const totalLosses = freeSpaceLoss + losses;
    
    // Calculate link margin
    const receiverThreshold = req.body.receiverThreshold || -85; // Default value if not provided
    const linkMargin = hertzianLinkService.calculateLinkMargin(
      systemGain,
      receiverThreshold,
      totalLosses
    );

    // Calculate link availability
    const rainZone = req.body.rainZone || 'K'; // Default rain zone
    const linkAvailability = hertzianLinkService.calculateLinkAvailability(
      linkMargin,
      frequency,
      distance,
      rainZone
    );

    // Prepare result object
    const result = {
      freeSpaceLoss,
      systemGain,
      totalLosses,
      linkMargin,
      linkAvailability,
      frequency,
      distance,
      transmitPower,
      antennaGain1,
      antennaGain2,
      losses,
      receiverThreshold,
      rainZone
    };

    // Save result to database if requested
    if (saveResults && configurationId) {
      await Result.create({
        name: `Hertzian Link Budget - ${new Date().toISOString()}`,
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
      message: 'Erreur lors du calcul du bilan de liaison hertzienne',
      error: error.message
    });
  }
};

/**
 * Calculate free space loss only
 */
exports.calculateFreeSpaceLoss = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { frequency, distance } = req.body;

    const freeSpaceLoss = hertzianLinkService.calculateFreeSpaceLoss(
      frequency,
      distance
    );
    
    return res.status(200).json({
      success: true,
      data: {
        freeSpaceLoss,
        frequency,
        distance
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la perte en espace libre',
      error: error.message
    });
  }
};

/**
 * Calculate link margin only
 */
exports.calculateLinkMargin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { transmitPower, receiverThreshold, totalLosses } = req.body;

    // For link margin calculation, we need to include antenna gains if provided
    const antennaGain1 = req.body.antennaGain1 || 0;
    const antennaGain2 = req.body.antennaGain2 || 0;
    
    const systemGain = transmitPower + antennaGain1 + antennaGain2;
    
    const linkMargin = hertzianLinkService.calculateLinkMargin(
      systemGain,
      receiverThreshold,
      totalLosses
    );
    
    return res.status(200).json({
      success: true,
      data: {
        linkMargin,
        systemGain,
        transmitPower,
        antennaGain1,
        antennaGain2,
        receiverThreshold,
        totalLosses
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la marge de liaison',
      error: error.message
    });
  }
};

/**
 * Calculate link availability
 */
exports.calculateLinkAvailability = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { linkMargin, frequency, distance, rainZone } = req.body;

    const linkAvailability = hertzianLinkService.calculateLinkAvailability(
      linkMargin,
      frequency,
      distance,
      rainZone
    );
    
    return res.status(200).json({
      success: true,
      data: {
        linkAvailability,
        linkMargin,
        frequency,
        distance,
        rainZone
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la disponibilité de liaison',
      error: error.message
    });
  }
};
