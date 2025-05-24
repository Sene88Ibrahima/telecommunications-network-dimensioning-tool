const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const configurationController = require('../controllers/configuration.controller');

// Delete configuration by ID
router.delete('/:id',
  param('id').isUUID().withMessage('ID de configuration invalide'),
  configurationController.deleteConfiguration
);

module.exports = router;
