const { DataTypes, Model } = require('sequelize');

class Doctor extends Model {}

module.exports = (sequelize) => {
 Doctor.init({
 id: {
 type: DataTypes.INTEGER,
 autoIncrement: true,
 primaryKey: true,
 },
 name: {
 type: DataTypes.STRING(100),
 allowNull: false,
 },
 specialty_id: {
 type: DataTypes.INTEGER,
 allowNull: false, // Certifique-se que isto está consistente com a sua DB
 },
  }, {
 sequelize,
 modelName: 'Doctor',
 tableName: 'doctors',
 timestamps: false,
});

   // Definir o método associate
  Doctor.associate = (models) => {
    // Um Doutor pertence a UMA Especialidade
    Doctor.belongsTo(models.Specialty, {
      as: 'specialty', // Alias para aceder à especialidade a partir do médico
      foreignKey: 'specialty_id' // A coluna na tabela 'doctors' que liga a 'specialties'
    });
    // Um Doutor pode ter muitos Pacientes (associação N:M)
    Doctor.hasMany(models.Appointment, {
    as: 'appointments', // Alias para os agendamentos de um doutor
    foreignKey: 'doctor_id' // Chave estrangeira na tabela 'appointments'
  });
  };
 

 return Doctor;
};