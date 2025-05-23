const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const opticalLinkController = require('../controllers/optical-link.controller');

// Calculate optical link budget
router.post('/',
  [
    body('fiberType').isIn(['MONOMODE', 'MULTIMODE']).withMessage('Type de fibre invalide'),
    body('linkLength').isFloat({ min: 0.1 }).withMessage('La longueur de liaison doit être supérieure à 0.1 km'),
    body('wavelength').isFloat({ min: 800, max: 1600 }).withMessage('Longueur d\'onde invalide (800-1600 nm)'),
    body('transmitterPower').isFloat().withMessage('La puissance de l\'émetteur est requise'),
    body('receiverSensitivity').isFloat().withMessage('La sensibilité du récepteur est requise'),
    body('connectorCount').isInt({ min: 0 }).withMessage('Le nombre de connecteurs doit être positif ou nul'),
    body('spliceCount').isInt({ min: 0 }).withMessage('Le nombre d\'épissures doit être positif ou nul')
  ],
  opticalLinkController.calculateOpticalLinkBudget
);

// Calculate optical budget only
router.post('/optical-budget',
  [
    body('transmitterPower').isFloat().withMessage('La puissance de l\'émetteur est requise'),
    body('receiverSensitivity').isFloat().withMessage('La sensibilité du récepteur est requise')
  ],
  opticalLinkController.calculateOpticalBudget
);

// Calculate total losses only
router.post('/total-losses',
  [
    body('fiberType').isIn(['MONOMODE', 'MULTIMODE']).withMessage('Type de fibre invalide'),
    body('linkLength').isFloat({ min: 0.1 }).withMessage('La longueur de liaison doit être supérieure à 0.1 km'),
    body('wavelength').isFloat({ min: 800, max: 1600 }).withMessage('Longueur d\'onde invalide (800-1600 nm)'),
    body('connectorCount').isInt({ min: 0 }).withMessage('Le nombre de connecteurs doit être positif ou nul'),
    body('spliceCount').isInt({ min: 0 }).withMessage('Le nombre d\'épissures doit être positif ou nul')
  ],
  opticalLinkController.calculateTotalLosses
);

// Calculate maximum range
router.post('/max-range',
  [
    body('opticalBudget').isFloat({ min: 0 }).withMessage('Le budget optique doit être positif'),
    body('linearAttenuation').isFloat({ min: 0 }).withMessage('L\'atténuation linéique doit être positive'),
    body('connectionLosses').isFloat({ min: 0 }).withMessage('Les pertes de connexion doivent être positives')
  ],
  opticalLinkController.calculateMaxRange
);

module.exports = router;
