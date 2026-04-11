// models/Expense.js
const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  creatorId: { type: DataTypes.INTEGER, allowNull: false },
  tripId: { type: DataTypes.INTEGER, defaultValue: null },
  title: { type: DataTypes.STRING(100), allowNull: false },
  totalAmount: { type: DataTypes.INTEGER, allowNull: false },
  splitMode: { type: DataTypes.ENUM('equal', 'custom'), defaultValue: 'equal' },
  participants: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() { try { return JSON.parse(this.getDataValue('participants')) } catch { return [] } },
    set(v) { this.setDataValue('participants', JSON.stringify(v || [])) }
  },
  status: { type: DataTypes.ENUM('pending', 'settled'), defaultValue: 'pending' }
}, { tableName: 'expenses', timestamps: true, underscored: true })

module.exports = Expense
