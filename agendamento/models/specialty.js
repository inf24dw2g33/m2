const { DataTypes, Model } = require('sequelize');

class Specialty extends Model {}

module.exports = (sequelize) => {
  Specialty.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Specialty',
    tableName: 'specialties',
    timestamps: false,
  });

 
  // Definir o método associate
  Specialty.associate = (models) => {
    // Uma Especialidade tem Muitos Doutores
    Specialty.hasMany(models.Doctor, {
      as: 'doctors', // Alias para aceder aos médicos a partir da especialidade (usado na rota /specialties/:id)
      foreignKey: 'specialty_id' // A coluna na tabela 'doctors' que liga a 'specialties'
    });
  };
 

  return Specialty;
};