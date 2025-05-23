const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const hertzianLinkController = require('../controllers/hertzian-link.controller');

// Calculate hertzian link budget
router.post('/',
  [
    body('frequency').isFloat({ min: 0.1 }).withMessage('La fréquence doit être supérieure à 0.1 GHz'),
    body('distance').isFloat({ min: 0.1 }).withMessage('La distance doit être supérieure à 0.1 km'),
    body('antennaHeight1').isFloat({ min: 0 }).withMessage('La hauteur d\'antenne doit être positive'),
    body('antennaHeight2').isFloat({ min: 0 }).withMessage('La hauteur d\'antenne doit être positive'),
    body('transmitPower').isFloat().withMessage('La puissance d\'émission est requise'),
    body('antennaGain1').isFloat().withMessage('Le gain d\'antenne est requis'),
    body('antennaGain2').isFloat().withMessage('Le gain d\'antenne est requis'),
    body('losses').isFloat({ min: 0 }).withMessage('Les pertes diverses doivent être positives')
  ],
  hertzianLinkController.calculateHertzianLinkBudget
);

// Calculate free space loss only
router.post('/free-space-loss',
  [
    body('frequency').isFloat({ min: 0.1 }).withMessage('La fréquence doit être supérieure à 0.1 GHz'),
    body('distance').isFloat({ min: 0.1 }).withMessage('La distance doit être supérieure à 0.1 km')
  ],
  hertzianLinkController.calculateFreeSpaceLoss
);

// Calculate link margin only
router.post('/link-margin',
  [
    body('transmitPower').isFloat().withMessage('La puissance d\'émission est requise'),
    body('receiverThreshold').isFloat().withMessage('Le seuil du récepteur est requis'),
    body('totalLosses').isFloat({ min: 0 }).withMessage('Les pertes totales doivent être positives')
  ],
  hertzianLinkController.calculateLinkMargin
);

// Calculate link availability
router.post('/link-availability',
  [
    body('linkMargin').isFloat().withMessage('La marge de liaison est requise'),
    body('frequency').isFloat({ min: 0.1 }).withMessage('La fréquence doit être supérieure à 0.1 GHz'),
    body('distance').isFloat({ min: 0.1 }).withMessage('La distance doit être supérieure à 0.1 km'),
    body('rainZone').isString().withMessage('La zone de pluie est requise')
  ],
  hertzianLinkController.calculateLinkAvailability
);

module.exports = router;
