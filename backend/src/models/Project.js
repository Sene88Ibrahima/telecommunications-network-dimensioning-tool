module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    networkType: {
      type: DataTypes.ENUM('GSM', 'UMTS', 'HERTZIEN', 'OPTIQUE'),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });

  Project.associate = (models) => {
    // A project can have many configurations (one for each saved state)
    Project.hasMany(models.Configuration, {
      foreignKey: 'projectId',
      as: 'configurations'
    });
    
    // A project can have many results
    Project.hasMany(models.Result, {
      foreignKey: 'projectId',
      as: 'results'
    });
  };

  return Project;
};
