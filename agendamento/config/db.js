const { Sequelize } = require('sequelize');
require('dotenv').config(); // Carrega as variáveis do .env

const sequelize = new Sequelize(
  process.env.DB_NAME || 'Scheduler',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '12345678',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4'
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci'
    }
  }
);

module.exports = sequelize;

