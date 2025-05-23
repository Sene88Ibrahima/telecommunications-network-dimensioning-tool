const { validationResult } = require('express-validator');
const umtsCalculatorService = require('../services/umts-calculator/umts-calculator.service');
const { Result } = require('../models');

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
      saveResults
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

    // Determine limiting factor (capacity or coverage)
    const limitingFactor = uplinkCapacity.maxUsers < downlinkCapacity.maxUsers ? 'UPLINK' : 'DOWNLINK';
    const maxUsersPerCell = Math.min(uplinkCapacity.maxUsers, downlinkCapacity.maxUsers);

    // Prepare result object
    const result = {
      uplinkCapacity,
      downlinkCapacity,
      cellCoverage,
      limitingFactor,
      maxUsersPerCell,
      softHandoverMargin,
      services
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
