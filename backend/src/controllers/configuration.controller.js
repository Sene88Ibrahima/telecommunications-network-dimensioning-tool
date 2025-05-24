const { validationResult } = require('express-validator');
const { Configuration } = require('../models');

/**
 * Delete configuration by ID
 */
exports.deleteConfiguration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    
    const configuration = await Configuration.findByPk(id);
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }
    
    await configuration.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Configuration supprimée avec succès'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la configuration',
      error: error.message
    });
  }
};
