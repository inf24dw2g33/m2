const fs = require('fs');
const yaml = require('yamljs');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API de Agendamento de Consultas',
    version: '1.0.0',
    description: 'Documentação da API',
  },
  servers: [{ url: 'http://localhost:3000' }],
};

const usersDocs = yaml.load('./docs/users.yaml');
const doctorsDocs = yaml.load('./docs/doctors.yaml');
const appointmentsDocs = yaml.load('./docs/appointments.yaml');
const specialtiesDocs = yaml.load('./docs/specialties.yaml');

const swaggerJson = {
  ...swaggerDefinition,
  paths: {
    ...usersDocs.paths,
    ...doctorsDocs.paths,
    ...appointmentsDocs.paths,
    ...specialtiesDocs.paths,
  },
};

fs.writeFileSync('./public/swagger.json', JSON.stringify(swaggerJson, null, 2));
console.log('✅ Swagger JSON gerado em public/swagger.json');
