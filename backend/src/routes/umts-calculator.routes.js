const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const umtsCalculatorController = require('../controllers/umts-calculator.controller');

// Calculate UMTS network dimensioning
router.post('/',
  [
    body('services').isArray().withMessage('Les services doivent être un tableau'),
    body('services.*.type').isIn(['VOICE', 'DATA', 'VIDEO']).withMessage('Type de service invalide'),
    body('services.*.bitRate').isFloat({ min: 0 }).withMessage('Le débit doit être positif'),
    body('services.*.activityFactor').isFloat({ min: 0, max: 1 }).withMessage('Le facteur d\'activité doit être entre 0 et 1'),
    body('ebno').isFloat({ min: 0 }).withMessage('Eb/N0 cible doit être positif'),
    body('softHandoverMargin').isFloat({ min: 0 }).withMessage('La marge de soft handover doit être positive'),
    body('propagationParameters').isObject().withMessage('Les paramètres de propagation doivent être un objet')
  ],
  umtsCalculatorController.calculateUmtsDimensioning
);

// Calculate uplink capacity
router.post('/uplink-capacity',
  [
    body('services').isArray().withMessage('Les services doivent être un tableau'),
    body('ebno').isFloat({ min: 0 }).withMessage('Eb/N0 cible doit être positif'),
    body('loadFactor').isFloat({ min: 0, max: 1 }).withMessage('Le facteur de charge doit être entre 0 et 1')
  ],
  umtsCalculatorController.calculateUplinkCapacity
);

// Calculate downlink capacity
router.post('/downlink-capacity',
  [
    body('services').isArray().withMessage('Les services doivent être un tableau'),
    body('ebno').isFloat({ min: 0 }).withMessage('Eb/N0 cible doit être positif'),
    body('loadFactor').isFloat({ min: 0, max: 1 }).withMessage('Le facteur de charge doit être entre 0 et 1')
  ],
  umtsCalculatorController.calculateDownlinkCapacity
);

// Calculate cell coverage
router.post('/cell-coverage',
  [
    body('transmitPower').isFloat({ min: 0 }).withMessage('La puissance d\'émission doit être positive'),
    body('sensitivity').isFloat().withMessage('La sensibilité est requise'),
    body('margin').isFloat({ min: 0 }).withMessage('La marge doit être positive'),
    body('propagationParameters').isObject().withMessage('Les paramètres de propagation doivent être un objet')
  ],
  umtsCalculatorController.calculateCellCoverage
);

module.exports = router;
