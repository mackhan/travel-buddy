// models/Message.js
const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Message = sequelize.define('Message', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  conversationId: { type: DataTypes.STRING(100), allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('text', 'image', 'system'), defaultValue: 'text' },
  tripId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'messages', timestamps: true, underscored: true })

module.exports = Message
