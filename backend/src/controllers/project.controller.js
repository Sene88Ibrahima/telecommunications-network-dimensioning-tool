const { validationResult } = require('express-validator');
const { Project, Configuration, Result } = require('../models');

/**
 * Get all projects
 */
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [['updatedAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: projects
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des projets',
      error: error.message
    });
  }
};

/**
 * Get project by ID
 */
exports.getProjectById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du projet',
      error: error.message
    });
  }
};

/**
 * Create new project
 */
exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { name, description, networkType } = req.body;
    const project = await Project.create({
      name,
      description,
      networkType
    });
    
    return res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: project
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du projet',
      error: error.message
    });
  }
};

/**
 * Update project
 */
exports.updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    project.name = name;
    if (description !== undefined) {
      project.description = description;
    }
    
    await project.save();
    
    return res.status(200).json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: project
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du projet',
      error: error.message
    });
  }
};

/**
 * Delete project
 */
exports.deleteProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    await project.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Projet supprimé avec succès'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du projet',
      error: error.message
    });
  }
};

/**
 * Get configurations for a project
 */
exports.getProjectConfigurations = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    const configurations = await Configuration.findAll({
      where: { projectId: id },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: configurations
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des configurations',
      error: error.message
    });
  }
};

/**
 * Save a new configuration to a project
 */
exports.saveProjectConfiguration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { name, parameters } = req.body;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    const configuration = await Configuration.create({
      name,
      parameters,
      projectId: id
    });
    
    return res.status(201).json({
      success: true,
      message: 'Configuration enregistrée avec succès',
      data: configuration
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la configuration',
      error: error.message
    });
  }
};

/**
 * Update an existing configuration
 */
exports.updateProjectConfiguration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id, configId } = req.params;
    const { name, parameters } = req.body;
    
    // Vérifier que le projet existe
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    // Vérifier que la configuration existe et appartient au projet
    const configuration = await Configuration.findOne({
      where: {
        id: configId,
        projectId: id
      }
    });
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée ou n\'appartient pas à ce projet'
      });
    }
    
    // Mettre à jour la configuration
    await configuration.update({
      name,
      parameters
    });
    
    return res.status(200).json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: configuration
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la configuration',
      error: error.message
    });
  }
};

/**
 * Get results for a project
 */
exports.getProjectResults = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    const results = await Result.findAll({
      where: { projectId: id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Configuration,
          as: 'configuration',
          attributes: ['id', 'name']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des résultats',
      error: error.message
    });
  }
};

/**
 * Save a new result to a project
 */
exports.saveProjectResult = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { name, calculationResults, configurationId } = req.body;
    
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }
    
    // Vérifier si la configuration existe si un ID de configuration est fourni
    if (configurationId) {
      const configExists = await Configuration.findOne({
        where: { id: configurationId, projectId: id }
      });
      
      if (!configExists) {
        return res.status(404).json({
          success: false,
          message: 'Configuration non trouvée'
        });
      }
    }
    
    // Créer le résultat
    const result = await Result.create({
      name,
      calculationResults,
      projectId: id,
      configurationId: configurationId || null
    });
    
    return res.status(201).json({
      success: true,
      message: 'Résultat enregistré avec succès',
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du résultat:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du résultat',
      error: error.message
    });
  }
};
