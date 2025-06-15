// models/appointment.js

const { DataTypes, Model } = require('sequelize');

class Appointment extends Model {}

module.exports = (sequelize) => {
 Appointment.init({
 id: {
 type: DataTypes.INTEGER,
 autoIncrement: true,
 primaryKey: true,
 },
 date: {
 type: DataTypes.DATEONLY,
 allowNull: false,
 },
 time: {
 type: DataTypes.TIME,
 allowNull: false,
 },
 notes: {
 type: DataTypes.TEXT,
 allowNull: true,
 },
 // As chaves estrangeiras user_id e doctor_id já estão aqui,
 // mas as associações precisam de ser definidas abaixo.
 user_id: {
 type: DataTypes.INTEGER,
 allowNull: false,
 },
 doctor_id: {
 type: DataTypes.INTEGER,
 allowNull: false,
 },
 
}, {
 sequelize,
 modelName: 'Appointment',
 tableName: 'appointments',
 timestamps: false, // Se não usar createdAt e updatedAt
 });

  
  Appointment.associate = (models) => {
    // Um Agendamento pertence a UM Utilizador (Paciente)
    Appointment.belongsTo(models.User, {
      as: 'paciente', // Alias para aceder ao utilizador a partir do agendamento
      foreignKey: 'user_id' // Coluna na tabela 'appointments' que aponta para 'users'
    });

    // Um Agendamento pertence a UM Doutor
    Appointment.belongsTo(models.Doctor, {
      as: 'medico', // Alias para aceder ao doutor a partir do agendamento
      foreignKey: 'doctor_id' // Coluna na tabela 'appointments' que aponta para 'doctors'
    });


  };
  


 return Appointment; // Retorna o modelo definido
};