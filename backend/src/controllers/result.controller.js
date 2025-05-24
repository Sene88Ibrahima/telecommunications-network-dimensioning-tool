const { validationResult } = require('express-validator');
const { Result, Configuration, Project } = require('../models');

/**
 * Get result by ID
 */
exports.getResultById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    console.log(`Fetching result with ID: ${id}`);
    
    const result = await Result.findByPk(id, {
      include: [
        {
          model: Configuration,
          as: 'configuration',
          attributes: ['id', 'name', 'parameters']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'networkType']
        }
      ]
    });
    
    if (!result) {
      console.log(`Result with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Résultat non trouvé'
      });
    }
    
    // Vérifier que le résultat a un attribut calculationResults qui est un objet JSON
    if (result.calculationResults && typeof result.calculationResults === 'string') {
      try {
        // Tenter de parser les calculationResults s'ils sont stockés en tant que chaîne JSON
        result.calculationResults = JSON.parse(result.calculationResults);
      } catch (parseError) {
        console.error('Erreur lors du parsing des calculationResults:', parseError);
        // Si le parsing échoue, laisser les données telles quelles
      }
    }
    
    console.log(`Successfully retrieved result: ${result.id}, type: ${result.project?.networkType}`);
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du résultat:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du résultat',
      error: error.message
    });
  }
};

/**
 * Delete result by ID
 */
exports.deleteResult = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    
    const result = await Result.findByPk(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Résultat non trouvé'
      });
    }
    
    await result.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Résultat supprimé avec succès'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du résultat',
      error: error.message
    });
  }
};
