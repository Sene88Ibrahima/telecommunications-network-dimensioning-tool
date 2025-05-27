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
    // Extract parameters from request body
    const { 
      // Paramètres de base
      frequency, 
      distance, 
      transmitPower,
      antennaGain1, 
      antennaGain2,
      losses,
      configurationId,
      saveResults,
      
      // Paramètres de modulation et débit
      modulationType,
      dataRate,
      targetBER,
      bandwidthMHz = 20, // Valeur par défaut: 20 MHz
      
      // Paramètres environnementaux
      rainZone = 'K', // Valeur par défaut: zone K (tropicale modérée)
      terrainType = 'AVERAGE', // Valeur par défaut: terrain moyen
      fresnelClearance = 60, // Valeur par défaut: 60% de dégagement
      fogDensity = 0 // Valeur par défaut: pas de brouillard
    } = req.body;

    // Calculate free space loss
    const freeSpaceLoss = hertzianLinkService.calculateFreeSpaceLoss(
      frequency,
      distance
    );

    // Calculate system gain
    const systemGain = transmitPower + antennaGain1 + antennaGain2;
    
    // Gérer les nouveaux paramètres avec des valeurs par défaut s'ils sont manquants
    let terrainLoss = 0;
    let fogLoss = 0;
    let fresnelLoss = 0;
    
    try {
      // Calculer les pertes additionnelles dues au terrain et obstacles (si les paramètres sont disponibles)
      if (terrainType && distance) {
        terrainLoss = hertzianLinkService.calculateTerrainLoss(terrainType, distance);
      }
      
      // Calculer les pertes dues au brouillard (significatives seulement en haute fréquence)
      if (fogDensity !== undefined && frequency) {
        fogLoss = hertzianLinkService.calculateFogLoss(fogDensity, frequency);
      }
      
      // Calculer les pertes dues au dégagement insuffisant de la zone de Fresnel
      if (fresnelClearance !== undefined) {
        fresnelLoss = hertzianLinkService.calculateFresnelLoss(fresnelClearance);
      }
    } catch (err) {
      console.error('Erreur lors du calcul des pertes additionnelles:', err);
      // En cas d'erreur, on continue avec les pertes par défaut (0)
    }
    
    // Calculate total losses (incluant toutes les pertes additionnelles)
    const totalLosses = freeSpaceLoss + losses + terrainLoss + fogLoss + fresnelLoss;
    
    // Calculer le seuil de réception requis en fonction de la modulation et du BER cible
    let customReceiverThreshold = req.body.receiverThreshold;
    if (!customReceiverThreshold && modulationType && targetBER) {
      try {
        customReceiverThreshold = hertzianLinkService.calculateReceiverThreshold(
          modulationType, 
          bandwidthMHz || 20, 
          targetBER
        );
      } catch (err) {
        console.error('Erreur lors du calcul du seuil de réception:', err);
        // En cas d'erreur, on utilise une valeur par défaut
        customReceiverThreshold = -85;
      }
    }
    
    // Utiliser la valeur calculée ou la valeur par défaut
    const receiverThreshold = customReceiverThreshold || -85;
    
    // S'assurer que le seuil du récepteur est négatif (convention normale)
    const validReceiverThreshold = receiverThreshold < 0 ? receiverThreshold : -Math.abs(receiverThreshold);
    
    console.log('Données de calcul dans le contrôleur:', {
      systemGain,
      receiverThreshold: validReceiverThreshold,
      totalLosses
    });
    
    // Calculate link margin avec seuil valide
    const linkMargin = hertzianLinkService.calculateLinkMargin(
      systemGain,
      validReceiverThreshold,
      totalLosses
    );

    // Protection contre les marges de liaison extrês
    const safeMargin = Math.max(linkMargin, -40); // Plafonner la marge minimale à -40 dB
    
    // Calculate link availability avec gestion d'erreur
    let linkAvailability = { availability: 99.99 };
    try {
      // Si la marge est très négative, ne pas utiliser le service normal
      if (safeMargin < -30) {
        // Liaison complètement inutilisable
        linkAvailability = {
          availability: 0.01, // Presque 0%
          unavailability: 99.99, // Presque 100%
          rainAttenuation: 0.1, // Valeur approximative pour l'atténuation due à la pluie
          fadeMargin: parseFloat(safeMargin.toFixed(2)),
          downtimeMinutes: 525600, // 365 jours * 24 heures * 60 minutes
          rainZone: rainZone || 'K'
        };
      } else {
        linkAvailability = hertzianLinkService.calculateLinkAvailability(
          safeMargin,
          frequency,
          distance,
          rainZone || 'K',
          terrainType || 'AVERAGE'
        );
      }
    } catch (err) {
      console.error('Erreur lors du calcul de la disponibilité:', err);
      // En cas d'erreur, on utilise des valeurs par défaut
      linkAvailability = {
        availability: 99.9,
        unavailability: 0.1,
        rainAttenuation: 0,
        fadeMargin: safeMargin,
        downtimeMinutes: 0,
        rainZone: rainZone || 'K'
      };
    }
    
    // Calculer le débit maximum possible avec la modulation et bande passante choisies
    let maxDataRate = 0;
    let dataRateFeasible = false; // Par défaut à false pour les liens avec marge négative
    
    try {
      // Protection contre les marges très négatives pour le calcul du débit
      if (safeMargin < -20) {
        // Lien inutilisable, débit minimal
        maxDataRate = 0.01; // 10 kbps, valeur minimale
        dataRateFeasible = false;
      } else if (modulationType && bandwidthMHz) {
        // Calculer normalement pour les marges acceptables
        maxDataRate = hertzianLinkService.calculateMaxDataRate(
          modulationType, 
          bandwidthMHz, 
          safeMargin // Utiliser la marge sécurisée
        );
        
        // Vérifier si le débit demandé est faisable avec les paramètres actuels
        dataRateFeasible = dataRate ? maxDataRate >= dataRate : true;
      }
      
      // Vérification finale pour s'assurer que le débit n'est jamais négatif
      if (maxDataRate < 0) {
        maxDataRate = 0.01;
        dataRateFeasible = false;
      }
    } catch (err) {
      console.error('Erreur lors du calcul du débit maximal:', err);
      // En cas d'erreur, on utilise une valeur minimale sécurisée
      maxDataRate = 0.01;
      dataRateFeasible = false;
    }

    // Prepare result object
    const result = {
      // Paramètres de base
      frequency,
      distance,
      transmitPower,
      antennaGain1,
      antennaGain2,
      losses,
      
      // Résultats des calculs de base
      freeSpaceLoss,
      systemGain,
      totalLosses,
      linkMargin,
      receiverThreshold,
      
      // Détails des pertes
      terrainLoss,
      fogLoss,
      fresnelLoss,
      
      // Paramètres environnementaux
      rainZone,
      terrainType,
      fresnelClearance,
      fogDensity,
      
      // Paramètres de modulation et débit
      modulationType,
      dataRate,
      targetBER,
      bandwidthMHz,
      maxDataRate,
      dataRateFeasible,
      
      // Disponibilité de la liaison
      linkAvailability
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
