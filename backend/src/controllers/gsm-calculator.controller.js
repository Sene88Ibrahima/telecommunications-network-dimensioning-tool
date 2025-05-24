const { validationResult } = require('express-validator');
const gsmCalculatorService = require('../services/gsm-calculator/gsm-calculator.service');
const { Result } = require('../models');

/**
 * Calculate GSM network dimensioning
 */
exports.calculateGsmDimensioning = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      coverageArea,
      trafficPerSubscriber,
      subscriberCount,
      frequency,
      btsPower,
      mobileReceptionThreshold,
      propagationModel,
      configurationId,
      saveResults
    } = req.body;

    // Calculate cell radius based on RF parameters
    const cellRadius = gsmCalculatorService.calculateCellRadius(
      frequency,
      btsPower,
      mobileReceptionThreshold,
      propagationModel
    );

    // Calculate number of BTS needed for coverage
    const btsCount = gsmCalculatorService.calculateBtsCount(
      coverageArea,
      cellRadius
    );

    // Calculate traffic requirements
    const totalTraffic = trafficPerSubscriber * subscriberCount;
    
    // Calcul de la capacité par BTS en fonction des paramètres d'entrée
    // On prend en compte le nombre de secteurs et de TRX par secteur (paramètres configurables)
    // Par défaut: 3 secteurs, 4 TRX par secteur, 8 timeslots par TRX, efficacité de 0.9 Erlang par timeslot
    
    // Ces paramètres pourraient être passés dans la requête à l'avenir
    const sectors = req.body.sectors || 3;
    const trxPerSector = req.body.trxPerSector || 4;
    const timeslotsPerTRX = 8; // Standard GSM
    const erlangPerTimeslot = 0.9; // Efficacité théorique avec 1% de blocage
    
    // Calcul de la capacité totale par BTS
    const trafficPerBTS = sectors * trxPerSector * timeslotsPerTRX * erlangPerTimeslot;
    
    // Calculate BTS needed for capacity
    const btsCountForCapacity = Math.ceil(totalTraffic / trafficPerBTS);
    
    // Final BTS count is the maximum of coverage and capacity requirements
    const finalBtsCount = Math.max(btsCount, btsCountForCapacity);
    
    // Calculate number of channels required
    // Assume 0.8 Erlang per channel with 2% blocking probability (using Erlang B)
    const channelsRequired = Math.ceil(totalTraffic / 0.8);
    
    // Prepare result object
    const result = {
      cellRadius,
      btsCount,
      btsCountForCapacity,
      finalBtsCount,
      totalTraffic,
      channelsRequired,
      coverageArea,
      trafficPerSubscriber,
      subscriberCount,
      // Ajouter tous les paramètres d'entrée pour l'affichage
      frequency,
      btsPower,
      mobileReceptionThreshold,
      propagationModel,
      // Ajouter les paramètres de capacité pour une meilleure compréhension
      capacityParams: {
        sectors,
        trxPerSector,
        timeslotsPerTRX,
        erlangPerTimeslot,
        trafficPerBTS
      }
    };

    // Save result to database if requested
    if (saveResults && configurationId) {
      await Result.create({
        name: `GSM Dimensioning Result - ${new Date().toISOString()}`,
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
      message: 'Erreur lors du calcul de dimensionnement GSM',
      error: error.message
    });
  }
};

/**
 * Calculate only cell radius
 */
exports.calculateCellRadius = async (req, res) => {
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
      btsPower,
      mobileReceptionThreshold,
      propagationModel
    } = req.body;

    const cellRadius = gsmCalculatorService.calculateCellRadius(
      frequency,
      btsPower,
      mobileReceptionThreshold,
      propagationModel
    );
    
    return res.status(200).json({
      success: true,
      data: {
        cellRadius,
        frequency,
        btsPower,
        mobileReceptionThreshold,
        propagationModel
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du rayon de cellule',
      error: error.message
    });
  }
};

/**
 * Calculate only number of BTS
 */
exports.calculateBtsCount = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { coverageArea, cellRadius } = req.body;

    const btsCount = gsmCalculatorService.calculateBtsCount(
      coverageArea,
      cellRadius
    );
    
    return res.status(200).json({
      success: true,
      data: {
        btsCount,
        coverageArea,
        cellRadius
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du nombre de BTS',
      error: error.message
    });
  }
};

/**
 * Calculate only traffic capacity
 */
exports.calculateTrafficCapacity = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { channelCount, occupancyRate } = req.body;

    const trafficCapacity = gsmCalculatorService.calculateTrafficCapacity(
      channelCount,
      occupancyRate
    );
    
    return res.status(200).json({
      success: true,
      data: {
        trafficCapacity,
        channelCount,
        occupancyRate
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul de la capacité de trafic',
      error: error.message
    });
  }
};
