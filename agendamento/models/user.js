const { DataTypes, Model } = require('sequelize');

class User extends Model {}

module.exports = (sequelize) => {
  User.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    google_id: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
    },
  }, {
    sequelize, // Passa a instância do Sequelize
    modelName: 'User',
    tableName: 'users',
    timestamps: false, // Caso sua tabela não tenha colunas de timestamp (createdAt, updatedAt)
  });

  return User;
};
