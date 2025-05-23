const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const projectController = require('../controllers/project.controller');

// Get all projects
router.get('/', projectController.getAllProjects);

// Get project by ID
router.get('/:id', 
  param('id').isUUID().withMessage('ID de projet invalide'),
  projectController.getProjectById
);

// Create new project
router.post('/',
  [
    body('name').notEmpty().withMessage('Le nom du projet est requis'),
    body('networkType').isIn(['GSM', 'UMTS', 'HERTZIEN', 'OPTIQUE']).withMessage('Type de réseau invalide')
  ],
  projectController.createProject
);

// Update project
router.put('/:id',
  [
    param('id').isUUID().withMessage('ID de projet invalide'),
    body('name').notEmpty().withMessage('Le nom du projet est requis')
  ],
  projectController.updateProject
);

// Delete project
router.delete('/:id',
  param('id').isUUID().withMessage('ID de projet invalide'),
  projectController.deleteProject
);

// Get configurations for a project
router.get('/:id/configurations',
  param('id').isUUID().withMessage('ID de projet invalide'),
  projectController.getProjectConfigurations
);

// Save a new configuration to a project
router.post('/:id/configurations',
  [
    param('id').isUUID().withMessage('ID de projet invalide'),
    body('name').notEmpty().withMessage('Le nom de la configuration est requis'),
    body('parameters').isObject().withMessage('Les paramètres doivent être un objet JSON')
  ],
  projectController.saveProjectConfiguration
);

// Get results for a project
router.get('/:id/results',
  param('id').isUUID().withMessage('ID de projet invalide'),
  projectController.getProjectResults
);

module.exports = router;
