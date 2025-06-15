const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
});

const User = require('./user')(sequelize);
const Specialty = require('./specialty')(sequelize);
const Doctor = require('./doctor')(sequelize);
const Appointment = require('./appointment')(sequelize);

// Relacionamentos




// Um Doutor pertence a UMA Especialidade
Doctor.belongsTo(Specialty, { as: 'specialty', foreignKey: 'specialty_id' });
// Uma Especialidade pode ter muitos Doutores
Specialty.hasMany(Doctor, { as: 'doctors', foreignKey: 'specialty_id' });

// Um Agendamento pertence a UM Utilizador (Paciente)
Appointment.belongsTo(User, { as: 'paciente', foreignKey: 'user_id' }); 

// Um Utilizador (Paciente) tem Muitos Agendamentos
User.hasMany(Appointment, { as: 'appointments', foreignKey: 'user_id' }); // Adicionado as: 'appointments'

// Um Agendamento pertence a UM Doutor
Appointment.belongsTo(Doctor, { as: 'medico', foreignKey: 'doctor_id' }); // Adicionado as: 'medico'


// Um Doutor tem Muitos Agendamentos
Doctor.hasMany(Appointment, { as: 'appointments', foreignKey: 'doctor_id' }); // Adicionado as: 'appointments'


module.exports = {
 sequelize,
 User,
 Specialty,
 Doctor,
 Appointment,
};