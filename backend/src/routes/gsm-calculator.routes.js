const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const gsmCalculatorController = require('../controllers/gsm-calculator.controller');

// Calculate GSM network dimensioning
router.post('/',
  [
    body('coverageArea').isFloat({ min: 0.1 }).withMessage('La zone de couverture doit être supérieure à 0.1 km²'),
    body('trafficPerSubscriber').isFloat({ min: 0 }).withMessage('Le trafic par abonné doit être positif'),
    body('subscriberCount').isInt({ min: 1 }).withMessage('Le nombre d\'abonnés doit être au moins 1'),
    body('frequency').isFloat({ min: 800, max: 2100 }).withMessage('Fréquence invalide (800-2100 MHz)'),
    body('btsPower').isFloat().withMessage('La puissance d\'émission BTS est requise'),
    body('mobileReceptionThreshold').isFloat().withMessage('Le seuil de réception mobile est requis'),
    body('propagationModel').isIn(['OKUMURA_HATA', 'COST231']).withMessage('Modèle de propagation invalide')
  ],
  gsmCalculatorController.calculateGsmDimensioning
);

// Calculate only cell radius
router.post('/cell-radius',
  [
    body('frequency').isFloat({ min: 800, max: 2100 }).withMessage('Fréquence invalide (800-2100 MHz)'),
    body('btsPower').isFloat().withMessage('La puissance d\'émission BTS est requise'),
    body('mobileReceptionThreshold').isFloat().withMessage('Le seuil de réception mobile est requis'),
    body('propagationModel').isIn(['OKUMURA_HATA', 'COST231']).withMessage('Modèle de propagation invalide')
  ],
  gsmCalculatorController.calculateCellRadius
);

// Calculate only number of BTS
router.post('/bts-count',
  [
    body('coverageArea').isFloat({ min: 0.1 }).withMessage('La zone de couverture doit être supérieure à 0.1 km²'),
    body('cellRadius').isFloat({ min: 0.1 }).withMessage('Le rayon de cellule doit être supérieur à 0.1 km')
  ],
  gsmCalculatorController.calculateBtsCount
);

// Calculate only traffic capacity
router.post('/traffic-capacity',
  [
    body('channelCount').isInt({ min: 1 }).withMessage('Le nombre de canaux doit être au moins 1'),
    body('occupancyRate').isFloat({ min: 0, max: 1 }).withMessage('Le taux d\'occupation doit être entre 0 et 1')
  ],
  gsmCalculatorController.calculateTrafficCapacity
);

module.exports = router;
