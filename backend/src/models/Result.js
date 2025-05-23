module.exports = (sequelize, DataTypes) => {
  const Result = sequelize.define('Result', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    calculationResults: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'JSON object containing all calculation results'
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    configurationId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Reference to the configuration used for this calculation'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  Result.associate = (models) => {
    // Result belongs to a project
    Result.belongsTo(models.Project, {
      foreignKey: 'projectId',
      as: 'project',
      onDelete: 'CASCADE'
    });
    
    // Result is derived from a configuration
    Result.belongsTo(models.Configuration, {
      foreignKey: 'configurationId',
      as: 'configuration'
    });
  };

  return Result;
};
