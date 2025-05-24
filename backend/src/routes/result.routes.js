const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const resultController = require('../controllers/result.controller');

// Get result by ID
router.get('/:id', 
  param('id').isUUID().withMessage('ID de résultat invalide'),
  resultController.getResultById
);

// Delete result by ID
router.delete('/:id',
  param('id').isUUID().withMessage('ID de résultat invalide'),
  resultController.deleteResult
);

module.exports = router;
